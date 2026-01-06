# api/views_obs.py
import math
from uuid import UUID
from datetime import timedelta, timezone as dt_timezone

from django.http import JsonResponse, HttpResponseBadRequest
from django.db import connection
from django.utils import timezone

FCST_PROVIDER = "ML"

# ===== MULTI-PROVIDER CONFIG =====
ALLOWED_PROVIDERS = ("ML",)   # hiện tại hệ thống bạn đang dùng 1 provider là ML
DEFAULT_PROVIDER = "ML"


def latest_snapshot(request):
    """
    Trả về snapshot giờ hiện tại cho MỖI điểm, nhưng JSON giữ y hệt schema cũ.

    Logic:
      - Giờ chuẩn: base_utc = now UTC, floored về đầu giờ.
      - Với mỗi location:
          + Nếu có OBS (weather_hourly_obs, source='openmeteo', valid_at=base_utc)
            → dùng OBS.
          + Nếu KHÔNG có OBS nhưng có FCST (weather_hourly_fcst, provider='ML',
            valid_at=base_utc) → dùng FCST.
          + Nếu cả hai đều không có → không trả điểm đó.
    """
    now_utc = timezone.now().astimezone(dt_timezone.utc)
    base_utc = now_utc.replace(minute=0, second=0, microsecond=0)

    limit = int(request.GET.get("limit") or 0)  # optional

    sql = """
      WITH base_hour AS (
        SELECT %s::timestamptz AS vt
      ),
      obs AS (
        SELECT
          l.id AS location_id,
          l.lat,
          l.lon,
          w.valid_at,
          w.temp_c,
          w.wind_ms,
          w.precip_mm,
          w.wind_dir_deg,
          w.rel_humidity_pct,
          w.cloudcover_pct,
          w.surface_pressure_hpa
        FROM base_hour b
        JOIN public.weather_hourly_obs w
          ON w.valid_at = b.vt
         AND w.source = 'openmeteo'
        JOIN public.locations l
          ON l.id = w.location_id
      ),
      fcst_only AS (
        -- Chỉ lấy FCST giờ base_utc cho các điểm KHÔNG có OBS
        SELECT
          l.id AS location_id,
          l.lat,
          l.lon,
          f.valid_at,
          f.temp_c,
          f.wind_ms,
          f.precip_mm,
          f.wind_dir_deg,
          f.rel_humidity_pct,
          f.cloudcover_pct,
          f.surface_pressure_hpa
        FROM base_hour b
        JOIN public.weather_hourly_fcst f
          ON f.valid_at = b.vt
         AND f.provider = %s
        JOIN public.locations l
          ON l.id = f.location_id
        LEFT JOIN obs o
          ON o.location_id = l.id
        WHERE o.location_id IS NULL
      )
      SELECT
        location_id,
        lat,
        lon,
        valid_at,
        temp_c,
        wind_ms,
        precip_mm,
        wind_dir_deg,
        rel_humidity_pct,
        cloudcover_pct,
        surface_pressure_hpa
      FROM obs
      UNION ALL
      SELECT
        location_id,
        lat,
        lon,
        valid_at,
        temp_c,
        wind_ms,
        precip_mm,
        wind_dir_deg,
        rel_humidity_pct,
        cloudcover_pct,
        surface_pressure_hpa
      FROM fcst_only
      ORDER BY valid_at DESC, lat, lon
    """
    params = [base_utc, FCST_PROVIDER]

    if limit > 0:
        sql += " LIMIT %s"
        params.append(limit)

    with connection.cursor() as cur:
        cur.execute(sql, params)
        rows = cur.fetchall()

    data = [
        {
            "location_id": str(r[0]),
            "lat": float(r[1]),
            "lon": float(r[2]),
            "valid_at": r[3].isoformat(),
            "temp_c": r[4],
            "wind_ms": r[5],
            "precip_mm": r[6],
            "wind_dir_deg": r[7],
            "rel_humidity_pct": r[8],
            "cloudcover_pct": r[9],
            "surface_pressure_hpa": r[10],
        }
        for r in rows
    ]

    resp = JsonResponse({"count": len(data), "data": data})
    resp["Cache-Control"] = "public, max-age=60"
    return resp


def merged_timeseries(request, location_id):
    """
    Chuỗi thời gian MERGED cho 1 điểm: 48h quá khứ + 96h tương lai (mặc định).

    - Quá khứ: ưu tiên OBS (weather_hourly_obs, source='openmeteo')
    - Nếu giờ nào OBS bị thiếu (kể cả quá khứ/hiện tại) -> fallback FCST (weather_hourly_fcst, provider='ML')
    - Tương lai: dùng FCST (provider='ML')
    - Nếu giờ nào không có cả OBS lẫn FCST -> source = "none"
    """
    try:
        UUID(str(location_id))
    except Exception:
        return HttpResponseBadRequest("invalid location_id")

    with connection.cursor() as cur:
        cur.execute(
            """
            SELECT id, name, lat, lon
            FROM public.locations
            WHERE id = %s
            """,
            [str(location_id)],
        )
        loc_row = cur.fetchone()

    if not loc_row:
        return JsonResponse({"found": False})

    loc_info = {
        "id": str(loc_row[0]),
        "name": loc_row[1],
        "lat": float(loc_row[2]),
        "lon": float(loc_row[3]),
    }

    try:
        back_hours = int(request.GET.get("back") or 48)
    except Exception:
        back_hours = 48
    try:
        fwd_hours = int(request.GET.get("fwd") or 96)
    except Exception:
        fwd_hours = 96

    if back_hours < 0:
        back_hours = 0
    if back_hours > 168:
        back_hours = 168
    if fwd_hours < 0:
        fwd_hours = 0
    if fwd_hours > 168:
        fwd_hours = 168

    provider = FCST_PROVIDER

    now_utc = timezone.now().astimezone(dt_timezone.utc)
    base_utc = now_utc.replace(minute=0, second=0, microsecond=0)

    start_utc = base_utc - timedelta(hours=back_hours)
    end_utc = base_utc + timedelta(hours=fwd_hours)

    # ------------------ Lấy OBS trong khoảng [start_utc, end_utc] ------------------
    obs_map = {}

    with connection.cursor() as cur:
        cur.execute(
            """
            SELECT
              valid_at,
              temp_c,
              wind_ms,
              precip_mm,
              rel_humidity_pct,
              wind_dir_deg,
              cloudcover_pct,
              surface_pressure_hpa
            FROM public.weather_hourly_obs
            WHERE source = 'openmeteo'
              AND location_id = %s
              AND valid_at >= %s
              AND valid_at <= %s
            ORDER BY valid_at ASC
            """,
            [str(location_id), start_utc, end_utc],
        )
        rows = cur.fetchall()

    for r in rows:
        ts = r[0]
        obs_map[ts] = {
            "temp_c": r[1],
            "wind_ms": r[2],
            "precip_mm": r[3],
            "rel_humidity_pct": r[4],
            "wind_dir_deg": r[5],
            "cloudcover_pct": r[6],
            "surface_pressure_hpa": r[7],
        }

    # ------------------ Lấy FCST trong khoảng [start_utc, end_utc] ------------------
    fcst_map = {}

    with connection.cursor() as cur:
        cur.execute(
            """
            SELECT
              valid_at,
              temp_c,
              wind_ms,
              precip_mm,
              rel_humidity_pct,
              wind_dir_deg,
              cloudcover_pct,
              surface_pressure_hpa
            FROM public.weather_hourly_fcst
            WHERE location_id = %s
              AND provider = %s
              AND valid_at >= %s
              AND valid_at <= %s
            ORDER BY valid_at ASC
            """,
            [str(location_id), provider, start_utc, end_utc],
        )
        rows = cur.fetchall()

    for r in rows:
        ts = r[0]
        fcst_map[ts] = {
            "temp_c": r[1],
            "wind_ms": r[2],
            "precip_mm": r[3],
            "rel_humidity_pct": r[4],
            "wind_dir_deg": r[5],
            "cloudcover_pct": r[6],
            "surface_pressure_hpa": r[7],
        }

    # ------------------ GHÉP MERGED THEO TRỤC THỜI GIAN ------------------
    steps = []
    cursor = start_utc

    while cursor <= end_utc:
        rec = None
        source = "none"

        if cursor in obs_map:
            rec = obs_map[cursor]
            source = "obs"
        elif cursor in fcst_map:
            rec = fcst_map[cursor]
            source = "fcst"

        steps.append(
            {
                "valid_at": cursor.isoformat(),
                "source": source,
                "temp_c": rec["temp_c"] if rec else None,
                "wind_ms": rec["wind_ms"] if rec else None,
                "precip_mm": rec["precip_mm"] if rec else None,
                "rel_humidity_pct": rec["rel_humidity_pct"] if rec else None,
                "wind_dir_deg": rec["wind_dir_deg"] if rec else None,
                "cloudcover_pct": rec["cloudcover_pct"] if rec else None,
                "surface_pressure_hpa": rec["surface_pressure_hpa"] if rec else None,
            }
        )

        cursor += timedelta(hours=1)

    return JsonResponse(
        {
            "found": True,
            "location": loc_info,
            "base_time": base_utc.isoformat(),
            "back_hours": back_hours,
            "forward_hours": fwd_hours,
            "provider": provider,
            "count": len(steps),
            "steps": steps,
        }
    )

def nearest_point(request):
    """
    Trả về location gần nhất + OBS mới nhất tại điểm đó.
    """
    try:
        lat = float(request.GET["lat"])
        lon = float(request.GET["lon"])
    except Exception:
        return HttpResponseBadRequest("need lat & lon")

    with connection.cursor() as cur:
        cur.execute(
            """
            SELECT
              l.id,
              l.lat,
              l.lon,
              w.valid_at,
              w.temp_c,
              w.wind_ms,
              w.precip_mm,
              w.wind_dir_deg,
              w.rel_humidity_pct,
              w.cloudcover_pct,
              w.surface_pressure_hpa
            FROM public.locations l
            JOIN public.latest_openmeteo_hourly w
              ON w.location_id = l.id
            ORDER BY l.geom <-> ST_SetSRID(ST_Point(%s,%s), 4326)
            LIMIT 1
            """,
            [lon, lat],
        )
        row = cur.fetchone()

    if not row:
        return JsonResponse({"found": False})

    return JsonResponse(
        {
            "found": True,
            "location_id": str(row[0]),
            "lat": float(row[1]),
            "lon": float(row[2]),
            "valid_at": row[3].isoformat(),
            "temp_c": row[4],
            "wind_ms": row[5],
            "precip_mm": row[6],
            "wind_dir_deg": row[7],
            "rel_humidity_pct": row[8],
            "cloudcover_pct": row[9],
            "surface_pressure_hpa": row[10],
        }
    )

def rain_frames(request):
    """
    Radar mưa MERGED theo base_utc, trả 12 frame:
      - 6 frame trước (bao gồm base_utc): base_utc-5h .. base_utc
      - 6 frame tương lai: base_utc+1h .. base_utc+6h

    Merge theo giờ:
      - Ưu tiên OBS (openmeteo) nếu có tại đúng valid_at
      - Nếu OBS thiếu -> dùng FCST (provider=ML)
      - Nếu thiếu cả hai -> cell/frame có thể rỗng
    """
    # cố định theo yêu cầu
    PAST_FRAMES_INCL_BASE = 6   # gồm cả base_utc
    FUTURE_FRAMES = 6           # sau base_utc
    TOTAL_FRAMES = PAST_FRAMES_INCL_BASE + FUTURE_FRAMES  # 12

    now_utc = timezone.now().astimezone(dt_timezone.utc)
    base_utc = now_utc.replace(minute=0, second=0, microsecond=0)

    start_utc = base_utc - timedelta(hours=PAST_FRAMES_INCL_BASE - 1)  # base-5h
    end_utc = base_utc + timedelta(hours=FUTURE_FRAMES)                # base+6h

    sql = """
      WITH
      params AS (
        SELECT
          %s::timestamptz AS start_utc,
          %s::timestamptz AS end_utc
      ),
      times AS (
        SELECT generate_series(
          (SELECT start_utc FROM params),
          (SELECT end_utc   FROM params),
          interval '1 hour'
        ) AS valid_at
      ),
      grid AS (
        SELECT id, lat, lon
        FROM public.locations
        WHERE active = true
      ),
      obs AS (
        SELECT location_id, valid_at, precip_mm
        FROM public.weather_hourly_obs
        WHERE source = 'openmeteo'
          AND valid_at >= (SELECT start_utc FROM params)
          AND valid_at <= (SELECT end_utc   FROM params)
      ),
      fcst AS (
        SELECT location_id, valid_at, precip_mm
        FROM public.weather_hourly_fcst
        WHERE provider = %s
          AND valid_at >= (SELECT start_utc FROM params)
          AND valid_at <= (SELECT end_utc   FROM params)
      ),
      merged AS (
        SELECT
          t.valid_at,
          g.lat,
          g.lon,
          COALESCE(o.precip_mm, f.precip_mm) AS precip_mm
        FROM times t
        CROSS JOIN grid g
        LEFT JOIN obs  o ON o.location_id = g.id AND o.valid_at = t.valid_at
        LEFT JOIN fcst f ON f.location_id = g.id AND f.valid_at = t.valid_at
      )
      SELECT valid_at, lat, lon, precip_mm
      FROM merged
      WHERE precip_mm IS NOT NULL
      ORDER BY valid_at ASC, lat ASC, lon ASC;
    """

    with connection.cursor() as cur:
        cur.execute(sql, [start_utc, end_utc, FCST_PROVIDER])
        rows = cur.fetchall()

    # Gom cells theo từng timestamp
    frames_map = {}
    for valid_at, lat, lon, precip in rows:
        try:
            p = float(precip)
        except Exception:
            continue
        frames_map.setdefault(valid_at, []).append(
            {"lat": float(lat), "lon": float(lon), "precip_mm": p}
        )

    # Luôn trả đủ 12 frame theo trục thời gian chuẩn (kể cả frame rỗng)
    frames = []
    ts = start_utc
    while ts <= end_utc:
        cells = frames_map.get(ts, [])
        frames.append({"valid_at": ts.isoformat(), "cells": cells})
        ts += timedelta(hours=1)

    # đảm bảo đúng 12 frame (an toàn)
    if len(frames) != TOTAL_FRAMES:
        frames = frames[:TOTAL_FRAMES]

    resp = JsonResponse(
        {
            "base_utc": base_utc.isoformat(),
            "frame_count": len(frames),
            "frames": frames,
        }
    )
    resp["Cache-Control"] = "public, max-age=60"
    return resp