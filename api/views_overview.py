# api/views_overview.py
from datetime import timezone as dt_timezone
from django.db import connection
from django.http import JsonResponse
from django.utils import timezone

FCST_PROVIDER = "ML"


def obs_overview(request):
    """
    Tổng quan toàn mạng tại 1 mốc giờ chuẩn (base_utc).

    Logic mới (đồng bộ theo giờ):
      - base_utc = thời điểm hiện tại theo UTC, làm tròn xuống đầu giờ.
      - Với mỗi location (thường chỉ active=true):
          + Nếu có OBS (weather_hourly_obs, source='openmeteo', valid_at=base_utc) -> dùng OBS
          + Nếu không có OBS nhưng có FCST (weather_hourly_fcst, provider=ML, valid_at=base_utc) -> dùng FCST
          + Nếu thiếu cả hai -> bỏ location (không tính thống kê)
      - JSON giữ nguyên schema cũ.
    """
    now_utc = timezone.now().astimezone(dt_timezone.utc)
    base_utc = now_utc.replace(minute=0, second=0, microsecond=0)

    # ---- Query snapshot merged tại đúng base_utc cho toàn mạng ----
    sql = """
      WITH base_hour AS (
        SELECT %s::timestamptz AS vt
      ),
      grid AS (
        SELECT id, name, lat, lon
        FROM public.locations
        WHERE active = true
      ),
      obs AS (
        SELECT
          g.id   AS location_id,
          g.name AS name,
          g.lat  AS lat,
          g.lon  AS lon,
          w.valid_at,
          w.temp_c,
          w.precip_mm,
          w.wind_ms
        FROM base_hour b
        JOIN public.weather_hourly_obs w
          ON w.valid_at = b.vt
         AND w.source = 'openmeteo'
        JOIN grid g
          ON g.id = w.location_id
      ),
      fcst_only AS (
        -- Chỉ lấy FCST giờ base_utc cho các điểm KHÔNG có OBS
        SELECT
          g.id   AS location_id,
          g.name AS name,
          g.lat  AS lat,
          g.lon  AS lon,
          f.valid_at,
          f.temp_c,
          f.precip_mm,
          f.wind_ms
        FROM base_hour b
        JOIN public.weather_hourly_fcst f
          ON f.valid_at = b.vt
         AND f.provider = %s
        JOIN grid g
          ON g.id = f.location_id
        LEFT JOIN obs o
          ON o.location_id = g.id
        WHERE o.location_id IS NULL
      )
      SELECT
        location_id,
        name,
        lat,
        lon,
        valid_at,
        temp_c,
        precip_mm,
        wind_ms
      FROM obs
      UNION ALL
      SELECT
        location_id,
        name,
        lat,
        lon,
        valid_at,
        temp_c,
        precip_mm,
        wind_ms
      FROM fcst_only
      ORDER BY lat, lon;
    """

    with connection.cursor() as cur:
        cur.execute(sql, [base_utc, FCST_PROVIDER])
        rows = cur.fetchall()

    # Không có dữ liệu tại giờ base_utc
    if not rows:
        resp = JsonResponse(
            {"obs_time": base_utc.isoformat(), "count_locations": 0, "temp": {}, "rain": {}, "wind": {}}
        )
        resp["Cache-Control"] = "public, max-age=60"
        return resp

    # ---- Tính thống kê ----
    count = 0
    sum_temp = 0.0
    cnt_temp = 0

    max_temp = None
    max_temp_loc = None
    min_temp = None
    min_temp_loc = None

    raining_count = 0
    heavy_rain_count = 0  # >= 5mm/h

    hot_count_35 = 0
    hot_count_37 = 0

    strong_wind_count = 0  # >= 10 m/s

    # Vì query đồng bộ theo giờ, obs_time hợp lý nhất chính là base_utc
    obs_time = base_utc

    for (loc_id, loc_name, lat, lon, valid_at, temp_c, precip_mm, wind_ms) in rows:
        # valid_at dự kiến = base_utc, nhưng vẫn giữ logic an toàn
        count += 1

        # TEMP
        if temp_c is not None:
            try:
                t = float(temp_c)
            except Exception:
                t = None
            if t is not None:
                sum_temp += t
                cnt_temp += 1

                if max_temp is None or t > max_temp:
                    max_temp = t
                    max_temp_loc = {
                        "id": str(loc_id),
                        "name": loc_name,
                        "lat": float(lat),
                        "lon": float(lon),
                        "temp_c": t,
                    }

                if min_temp is None or t < min_temp:
                    min_temp = t
                    min_temp_loc = {
                        "id": str(loc_id),
                        "name": loc_name,
                        "lat": float(lat),
                        "lon": float(lon),
                        "temp_c": t,
                    }

                if t >= 35.0:
                    hot_count_35 += 1
                if t >= 37.0:
                    hot_count_37 += 1

        # RAIN
        if precip_mm is not None:
            try:
                p = float(precip_mm)
            except Exception:
                p = None
            if p is not None:
                if p > 0.0:
                    raining_count += 1
                if p >= 5.0:
                    heavy_rain_count += 1

        # WIND
        if wind_ms is not None:
            try:
                w = float(wind_ms)
            except Exception:
                w = None
            if w is not None and w >= 10.0:
                strong_wind_count += 1

    avg_temp = (sum_temp / cnt_temp) if cnt_temp > 0 else None

    resp = JsonResponse(
        {
            "obs_time": obs_time.isoformat() if obs_time else None,
            "count_locations": count,
            "temp": {
                "avg_c": avg_temp,
                "max_c": max_temp,
                "min_c": min_temp,
                "hottest": max_temp_loc,
                "coldest": min_temp_loc,
                "hot_count_ge_35": hot_count_35,
                "hot_count_ge_37": hot_count_37,
            },
            "rain": {
                "raining_count": raining_count,
                "heavy_rain_count": heavy_rain_count,
            },
            "wind": {
                "strong_wind_count": strong_wind_count,
            },
        }
    )
    resp["Cache-Control"] = "public, max-age=60"
    return resp