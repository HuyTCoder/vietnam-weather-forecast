# api/views_obs_summary.py

from __future__ import annotations

from datetime import datetime, time, timezone as dt_timezone
from typing import Any, Dict, List, Optional, Tuple
from uuid import UUID

from django.db import connection
from django.http import HttpResponseBadRequest, JsonResponse
from django.utils import timezone


# =============================================================================
# 1) SUMMARY TEXTS
# =============================================================================

def _build_current_comment(
    temp_c: Optional[float],
    wind_ms: Optional[float],
    precip_mm: Optional[float],
) -> str:
    """
    Mô tả 'hiện tại' (dùng cho panel).
    Giữ tương thích với frontend hiện tại: câu có số nhiệt độ + mô tả gió/mưa.
    """
    pieces: List[str] = []

    if temp_c is not None:
        try:
            pieces.append(f"Nhiệt độ hiện tại khoảng {float(temp_c):.1f}°C")
        except Exception:
            pass

    if wind_ms is not None:
        try:
            wind_kmh = float(wind_ms) * 3.6
            if wind_kmh < 5:
                pieces.append("gió yếu")
            elif wind_kmh < 20:
                pieces.append("gió nhẹ đến vừa")
            else:
                pieces.append("gió khá mạnh")
        except Exception:
            pass

    if precip_mm is not None:
        try:
            if float(precip_mm) >= 0.1:
                pieces.append("có mưa")
            else:
                pieces.append("không mưa")
        except Exception:
            pass

    return ", ".join(pieces) if pieces else "Chưa đủ dữ liệu để mô tả thời tiết hiện tại."


def _build_today_summary_text(
    location_id: Any,
    base_utc: datetime,
    fcst_provider: str = "ML",
) -> str:
    """
    TỔNG HỢP 'HÔM NAY' THEO NGÀY LOCAL (Asia/Bangkok):
    - Lấy các giờ thuộc ngày hôm nay theo local time: 00:00 .. 23:00
    - Merge theo giờ:
      + Ưu tiên OBS (openmeteo) nếu tồn tại ở giờ đó
      + Nếu OBS thiếu -> bù bằng FCST (provider=ML) ở giờ đó
      + Nếu cả hai thiếu -> bỏ qua giờ đó
    - Nếu chưa hết ngày: phần giờ tương lai trong ngày hôm nay thường sẽ chỉ có FCST.
    """
    default_tz = timezone.get_default_timezone()  # Asia/Bangkok trong settings

    # Xác định "ngày hôm nay" theo LOCAL, neo theo base_utc để nhất quán với snapshot
    base_local = base_utc.astimezone(default_tz)
    today_local = base_local.date()

    start_local = timezone.make_aware(datetime.combine(today_local, time(0, 0, 0)), default_tz)
    end_local = timezone.make_aware(datetime.combine(today_local, time(23, 0, 0)), default_tz)

    # Convert sang UTC để query DB (timestamptz)
    start_utc = start_local.astimezone(dt_timezone.utc)
    end_utc = end_local.astimezone(dt_timezone.utc)

    # 1) Đọc OBS trong ngày
    obs_map: Dict[int, Dict[str, Any]] = {}  # key: local_hour 0..23
    with connection.cursor() as cur:
        cur.execute(
            """
            SELECT valid_at, temp_c, wind_ms, precip_mm, cloudcover_pct
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

    for valid_at_utc, temp_c, wind_ms, precip_mm, cloudcover in rows:
        try:
            local_dt = valid_at_utc.astimezone(default_tz)
            h = int(local_dt.hour)
        except Exception:
            continue
        obs_map[h] = {
            "temp_c": temp_c,
            "wind_ms": wind_ms,
            "precip_mm": precip_mm,
            "cloudcover_pct": cloudcover,
        }

    # 2) Đọc FCST trong ngày
    fcst_map: Dict[int, Dict[str, Any]] = {}
    with connection.cursor() as cur:
        cur.execute(
            """
            SELECT valid_at, temp_c, wind_ms, precip_mm, cloudcover_pct
            FROM public.weather_hourly_fcst
            WHERE provider = %s
              AND location_id = %s
              AND valid_at >= %s
              AND valid_at <= %s
            ORDER BY valid_at ASC
            """,
            [fcst_provider, str(location_id), start_utc, end_utc],
        )
        rows = cur.fetchall()

    for valid_at_utc, temp_c, wind_ms, precip_mm, cloudcover in rows:
        try:
            local_dt = valid_at_utc.astimezone(default_tz)
            h = int(local_dt.hour)
        except Exception:
            continue
        fcst_map[h] = {
            "temp_c": temp_c,
            "wind_ms": wind_ms,
            "precip_mm": precip_mm,
            "cloudcover_pct": cloudcover,
        }

    # 3) Merge 24 giờ: ưu tiên OBS, thiếu thì FCST
    temp_vals: List[float] = []
    wind_vals: List[float] = []
    cloud_vals: List[float] = []

    precip_sum = 0.0
    raining_hours = 0
    heavy_rain_hours = 0  # >= 5mm/h

    used_hours = 0
    obs_hours = 0
    fcst_hours = 0

    for h in range(24):
        rec: Optional[Dict[str, Any]] = None
        src: Optional[str] = None

        if h in obs_map:
            rec = obs_map[h]
            src = "obs"
        elif h in fcst_map:
            rec = fcst_map[h]
            src = "fcst"
        else:
            continue

        used_hours += 1
        if src == "obs":
            obs_hours += 1
        else:
            fcst_hours += 1

        # temp
        t = rec.get("temp_c")
        if t is not None:
            try:
                temp_vals.append(float(t))
            except Exception:
                pass

        # wind
        w = rec.get("wind_ms")
        if w is not None:
            try:
                wind_vals.append(float(w))
            except Exception:
                pass

        # cloud
        cc = rec.get("cloudcover_pct")
        if cc is not None:
            try:
                cloud_vals.append(float(cc))
            except Exception:
                pass

        # precip
        p = rec.get("precip_mm")
        if p is not None:
            try:
                pv = float(p)
                if pv > 0:
                    raining_hours += 1
                if pv >= 5:
                    heavy_rain_hours += 1
                precip_sum += max(0.0, pv)
            except Exception:
                pass

    if used_hours == 0:
        return "Chưa có đủ dữ liệu để tổng hợp thời tiết hôm nay."

    # 4) Tính thống kê ngày
    t_min = min(temp_vals) if temp_vals else None
    t_max = max(temp_vals) if temp_vals else None
    t_mean = (sum(temp_vals) / len(temp_vals)) if temp_vals else None

    wind_mean = (sum(wind_vals) / len(wind_vals)) if wind_vals else None
    cloud_mean = (sum(cloud_vals) / len(cloud_vals)) if cloud_vals else None

    # 5) Sinh câu mô tả "today"
    parts: List[str] = []

    # Nêu mức độ dữ liệu
    if fcst_hours > 0 and obs_hours > 0:
        parts.append(f"Tổng hợp hôm nay dựa trên {obs_hours} giờ quan trắc và {fcst_hours} giờ dự báo.")
    elif obs_hours > 0:
        parts.append(f"Tổng hợp hôm nay chủ yếu từ quan trắc ({obs_hours} giờ).")
    else:
        parts.append(f"Tổng hợp hôm nay chủ yếu từ dự báo ({fcst_hours} giờ) do thiếu quan trắc theo giờ.")

    # Nhiệt độ ngày
    if t_min is not None and t_max is not None:
        if t_mean is not None:
            parts.append(f"Nhiệt độ dao động khoảng {t_min:.1f}–{t_max:.1f}°C (trung bình {t_mean:.1f}°C).")
        else:
            parts.append(f"Nhiệt độ dao động khoảng {t_min:.1f}–{t_max:.1f}°C.")
    elif t_mean is not None:
        parts.append(f"Nhiệt độ trung bình khoảng {t_mean:.1f}°C.")

    # Mưa ngày
    # precip_mm là mm/h theo giờ; cộng các giờ -> tổng mm trong ngày theo dữ liệu giờ.
    if precip_sum <= 0.05 and raining_hours == 0:
        parts.append("Hôm nay nhìn chung ít mưa hoặc không mưa đáng kể.")
    else:
        parts.append(f"Tổng lượng mưa trong ngày khoảng {precip_sum:.1f} mm.")
        if heavy_rain_hours > 0:
            parts.append(f"Có {heavy_rain_hours} giờ mưa to (≥ 5 mm/h), cần lưu ý ngập cục bộ.")
        elif raining_hours > 0:
            parts.append(f"Có mưa trong khoảng {raining_hours} giờ, có thể gây trơn trượt khi di chuyển.")

    # Mây (phụ)
    if cloud_mean is not None:
        if cloud_mean < 20:
            parts.append("Trời chủ yếu quang mây.")
        elif cloud_mean < 60:
            parts.append("Mây vừa, có nắng gián đoạn.")
        elif cloud_mean < 85:
            parts.append("Nhiều mây, ít nắng.")
        else:
            parts.append("Trời u ám, mây dày.")

    # Gió (phụ)
    if wind_mean is not None:
        wind_kmh = wind_mean * 3.6
        if wind_kmh < 10:
            parts.append("Gió nhìn chung yếu.")
        elif wind_kmh < 25:
            parts.append("Gió trung bình mức nhẹ đến vừa.")
        else:
            parts.append("Gió trung bình khá mạnh, cần chú ý khi di chuyển ngoài trời.")

    return " ".join(parts)


# =============================================================================
# 2) ALERTS ENGINE (rule-based hazards)
# =============================================================================

_LEVEL_ORDER = ["none", "info", "watch", "warning", "danger"]
_LEVEL_RANK = {lv: i for i, lv in enumerate(_LEVEL_ORDER)}


def _make_hazard(
    h_type: str,
    level: str,
    score: int,
    headline: str,
    description: str,
    advices: Optional[List[str]] = None,
) -> Dict[str, Any]:
    if advices is None:
        advices = []
    if level not in _LEVEL_RANK:
        level = "info"
    return {
        "type": h_type,
        "level": level,
        "score": int(score),
        "headline": headline,
        "description": description,
        "advices": advices,
    }


def _compute_heat_index(temp_c: Optional[float], rel_humidity: Optional[float]) -> Optional[float]:
    if temp_c is None:
        return None
    T = float(temp_c)
    if rel_humidity is None:
        return T

    RH = max(0.0, min(100.0, float(rel_humidity)))
    if T < 27 or RH < 40:
        return T

    # Công thức HI (C) dạng đa thức (thực dụng cho cảnh báo)
    return (
        -8.784695
        + 1.61139411 * T
        + 2.338549 * RH
        - 0.14611605 * T * RH
        - 0.012308094 * (T**2)
        - 0.016424828 * (RH**2)
        + 0.002211732 * (T**2) * RH
        + 0.00072546 * T * (RH**2)
        - 0.000003582 * (T**2) * (RH**2)
    )


def _compute_windchill(temp_c: Optional[float], wind_ms: Optional[float]) -> Optional[float]:
    if temp_c is None or wind_ms is None:
        return None

    T = float(temp_c)
    V_kmh = float(wind_ms) * 3.6

    if T > 10 or V_kmh < 5:
        return None

    return 13.12 + 0.6215 * T - 11.37 * (V_kmh**0.16) + 0.3965 * T * (V_kmh**0.16)


def _build_heat_cold_hazard(
    temp_c: Optional[float],
    wind_ms: Optional[float],
    cloudcover: Optional[float],
    rel_humidity: Optional[float],
) -> Optional[Dict[str, Any]]:
    if temp_c is None:
        return None

    T = float(temp_c)
    windchill = _compute_windchill(T, wind_ms)
    effective_cold = windchill if windchill is not None else T

    # LẠNH
    if effective_cold <= 15:
        if effective_cold <= 5:
            level, score = "warning", 3
            headline = "Trời rét, có gió"
            desc = (
                f"Nhiệt độ cảm nhận xuống khoảng {effective_cold:.1f}°C "
                "(tính theo nhiệt độ và gió), dễ gây rét buốt, "
                "đặc biệt vào đêm và sáng sớm."
            )
        elif effective_cold <= 10:
            level, score = "watch", 2
            headline = "Trời lạnh"
            desc = (
                f"Nhiệt độ cảm nhận khoảng {effective_cold:.1f}°C, "
                "trời lạnh, cần chú ý giữ ấm cho trẻ nhỏ và người già."
            )
        else:
            level, score = "info", 1
            headline = "Thời tiết se lạnh"
            desc = f"Nhiệt độ khoảng {T:.1f}°C, khá mát hoặc hơi lạnh về đêm và sáng sớm."

        adv = [
            "Chuẩn bị áo ấm khi ra ngoài, đặc biệt vào tối và sáng sớm.",
            "Giữ ấm cho trẻ nhỏ, người cao tuổi.",
        ]
        return _make_hazard("cold", level, score, headline, desc, adv)

    # NÓNG
    if T < 32:
        return None

    HI = _compute_heat_index(T, rel_humidity)
    effective_heat = HI if HI is not None else T

    if effective_heat < 32:
        return None

    cloudy = cloudcover is not None and float(cloudcover) >= 60

    if effective_heat < 41:
        level, score = "info", 1
        headline = "Thời tiết oi nóng"
        desc = (
            f"Nhiệt độ cảm nhận khoảng {effective_heat:.1f}°C, "
            "trời oi, dễ mệt nếu hoạt động ngoài trời lâu."
        )
    elif effective_heat < 54:
        level, score = "watch", 2
        headline = "Nắng nóng, cần thận trọng"
        desc = (
            f"Nhiệt độ cảm nhận khoảng {effective_heat:.1f}°C. "
            "Nếu làm việc ngoài trời lâu, nguy cơ mất nước và kiệt sức tăng."
        )
    else:
        level, score = "warning", 3
        headline = "Nắng nóng gay gắt, nguy cơ cao"
        desc = (
            f"Nhiệt độ cảm nhận trên {effective_heat:.1f}°C, "
            "nguy cơ say nắng, sốc nhiệt nếu ở ngoài trời trong thời gian dài."
        )

    if cloudy:
        desc += " Lượng mây nhiều có thể giảm bớt nắng trực tiếp, nhưng không giảm nhiều mức oi nóng."

    adv = [
        "Hạn chế ở ngoài trời nắng lâu trong khung giờ trưa - đầu giờ chiều.",
        "Uống đủ nước, mặc quần áo thoáng mát.",
        "Ưu tiên nghỉ ngơi trong bóng râm hoặc nơi có mái che.",
    ]
    return _make_hazard("heat", level, score, headline, desc, adv)


def _build_wind_hazard(wind_ms: Optional[float]) -> Optional[Dict[str, Any]]:
    if wind_ms is None:
        return None

    wind_kmh = float(wind_ms) * 3.6
    if wind_kmh < 20:
        return None

    if wind_kmh < 30:
        level, score = "info", 1
        headline = "Gió vừa"
        desc = (
            f"Tốc độ gió khoảng {wind_kmh:.0f} km/h (xấp xỉ cấp 4 Beaufort), "
            "có thể gây khó chịu khi di chuyển bằng xe máy hoặc đi bộ."
        )
    elif wind_kmh < 50:
        level, score = "watch", 2
        headline = "Gió mạnh"
        desc = (
            f"Gió mạnh khoảng {wind_kmh:.0f} km/h (xấp xỉ cấp 5–6 Beaufort), "
            "cần chú ý khi đi lại ngoài trời, đặc biệt ở nơi trống trải."
        )
    else:
        level, score = "warning", 3
        headline = "Gió rất mạnh"
        desc = (
            f"Gió rất mạnh khoảng {wind_kmh:.0f} km/h (từ cấp 7 Beaufort trở lên), "
            "có thể gây đổ cây, biển quảng cáo, nguy hiểm khi tham gia giao thông."
        )

    adv = [
        "Hạn chế đứng gần cây lớn, biển quảng cáo, vật dễ đổ.",
        "Giữ chắc tay lái nếu di chuyển bằng xe máy.",
    ]
    return _make_hazard("strong_wind", level, score, headline, desc, adv)


def _build_rain_hazard(
    rain_1h: float,
    rain_3h: float,
    rain_6h: float,
    precip_now: Optional[float] = None,
) -> Optional[Dict[str, Any]]:
    r1 = float(rain_1h or 0.0)
    r3 = float(rain_3h or 0.0)
    r6 = float(rain_6h or 0.0)

    extra_3h = max(0.0, r3 - r1)
    extra_6h = max(0.0, r6 - r3)

    # trọng số thực dụng: 1h gần nhất quan trọng nhất
    eff = r1 + 0.6 * extra_3h + 0.4 * extra_6h

    # (A) Mưa nhẹ theo giờ hiện tại
    try:
        if precip_now is not None and float(precip_now) >= 0.1 and eff < 0.5:
            return _make_hazard(
                "rain",
                "info",
                1,
                "Mưa nhẹ",
                "Có mưa nhẹ trong giờ gần nhất, đường có thể trơn trượt.",
                ["Di chuyển cẩn thận, chuẩn bị áo mưa nếu cần."],
            )
    except Exception:
        pass

    # (B) Không mưa đáng kể
    if eff < 0.5:
        return None

    # (C) Có mưa tích lũy -> phân cấp
    if eff < 5:
        return _make_hazard(
            "rain",
            "info",
            1,
            "Mưa nhỏ, rải rác",
            f"Mưa tích lũy khoảng {eff:.1f}mm trong 1–6 giờ gần nhất. "
            "Ảnh hưởng chủ yếu là trơn trượt, bất tiện khi di chuyển.",
            ["Chuẩn bị áo mưa nếu phải di chuyển ngoài trời."],
        )

    if eff < 15:
        return _make_hazard(
            "rain",
            "watch",
            2,
            "Mưa vừa, có nguy cơ ngập nhẹ",
            f"Mưa tích lũy khoảng {eff:.1f}mm trong vài giờ gần đây, "
            "có thể gây ngập nhẹ tại các khu vực trũng, thoát nước kém.",
            ["Hạn chế di chuyển nhanh trên đường trơn.", "Theo dõi các điểm trũng, khu dân cư thấp."],
        )

    if eff < 30:
        return _make_hazard(
            "rain",
            "warning",
            3,
            "Mưa to, nguy cơ ngập cục bộ",
            f"Mưa tích lũy khoảng {eff:.1f}mm, nguy cơ ngập cục bộ tại khu dân cư, đô thị và các điểm trũng.",
            ["Hạn chế đi qua vùng ngập nước hoặc khu vực thoát nước kém.", "Chủ động kê cao đồ đạc ở tầng thấp."],
        )

    return _make_hazard(
        "rain",
        "danger",
        4,
        "Mưa rất to, nguy cơ lũ cục bộ",
        f"Mưa tích lũy trên {eff:.1f}mm trong 6 giờ, nguy cơ ngập sâu, lũ quét hoặc sạt lở đất "
        "(đặc biệt vùng đồi núi).",
        ["Tránh di chuyển qua khu vực ngập sâu, sông suối, khe suối.", "Theo dõi chặt chẽ cảnh báo của cơ quan khí tượng thủy văn."],
    )


def _calc_overall_level_and_comment(hazards: List[Dict[str, Any]]) -> Tuple[str, str]:
    if not hazards:
        return ("none", "Thời tiết nhìn chung ổn định, không có nguy cơ đáng kể trong giờ gần nhất.")

    def _rank(h: Dict[str, Any]) -> int:
        return _LEVEL_RANK.get(h.get("level", "none"), 0)

    main = max(hazards, key=_rank)
    main_rank = _rank(main)

    watch_rank = _LEVEL_RANK["watch"]
    num_watch_or_more = sum(1 for h in hazards if _rank(h) >= watch_rank)

    overall_rank = main_rank
    # Nếu có >=2 yếu tố từ watch trở lên, nâng mức tổng thể thêm 1 bậc (tối đa danger)
    if num_watch_or_more >= 2 and overall_rank < (len(_LEVEL_ORDER) - 1):
        overall_rank += 1

    overall_level = _LEVEL_ORDER[overall_rank]
    headline = main.get("headline", "Cảnh báo thời tiết")

    others = [h for h in hazards if h is not main and _rank(h) >= watch_rank]
    if not others:
        overall_comment = headline
    else:
        other_types = ", ".join(sorted({h.get("type", "") for h in others if h.get("type")}))
        overall_comment = (
            f"{headline}. Đồng thời có thêm các yếu tố bất lợi: {other_types}, "
            "làm mức cảnh báo tổng thể tăng lên."
        )

    return overall_level, overall_comment


def _build_alerts_from_obs(
    temp_c: Optional[float],
    wind_ms: Optional[float],
    precip_mm: Optional[float],
    cloudcover: Optional[float],
    rel_humidity: Optional[float],
    rain_1h: float,
    rain_3h: float,
    rain_6h: float,
) -> Dict[str, Any]:
    hazards: List[Dict[str, Any]] = []

    rain_h = _build_rain_hazard(rain_1h, rain_3h, rain_6h, precip_now=precip_mm)
    if rain_h:
        hazards.append(rain_h)

    heat_cold_h = _build_heat_cold_hazard(temp_c, wind_ms, cloudcover, rel_humidity)
    if heat_cold_h:
        hazards.append(heat_cold_h)

    wind_h = _build_wind_hazard(wind_ms)
    if wind_h:
        hazards.append(wind_h)

    overall_level, overall_comment = _calc_overall_level_and_comment(hazards)
    return {"overall_level": overall_level, "overall_comment": overall_comment, "hazards": hazards}


# =============================================================================
# 3) DB HELPERS (rain accum + snapshot selection)
# =============================================================================

def _floor_to_hour_utc(dt: datetime) -> datetime:
    return dt.astimezone(dt_timezone.utc).replace(minute=0, second=0, microsecond=0)


def _sum_rain_in_window(
    rows: List[Tuple[Any, Any]],
    anchor_ts: datetime,
) -> Tuple[float, float, float, float]:
    have_hours = set()

    rain_1h = 0.0
    rain_3h = 0.0
    rain_6h = 0.0

    for valid_at, precip_mm in rows:
        try:
            dt = anchor_ts - valid_at
            hours = dt.total_seconds() / 3600.0
        except Exception:
            continue

        if hours < 0 or hours > 6.0:
            continue

        # bucket 0..6 (inclusive)
        hour_bucket = int(round(hours))
        have_hours.add(hour_bucket)

        p = float(precip_mm or 0.0)
        if hours <= 1.0:
            rain_1h += p
            rain_3h += p
            rain_6h += p
        elif hours <= 3.0:
            rain_3h += p
            rain_6h += p
        else:
            rain_6h += p

    coverage_ratio = len(have_hours) / 7.0
    return rain_1h, rain_3h, rain_6h, coverage_ratio


def _fetch_rain_accums(
    location_id: Any,
    latest_valid_at: Optional[datetime],
    fcst_provider: str = "ML",
    coverage_threshold: float = 0.7,
) -> Tuple[float, float, float]:
    if latest_valid_at is None:
        return 0.0, 0.0, 0.0

    # 1) OBS rows
    with connection.cursor() as cur:
        cur.execute(
            """
            SELECT w.valid_at, COALESCE(w.precip_mm, 0) AS precip_mm
            FROM public.weather_hourly_obs w
            WHERE w.source = 'openmeteo'
              AND w.location_id = %s
              AND w.valid_at <= %s
              AND w.valid_at >= %s - interval '6 hour'
            ORDER BY w.valid_at DESC;
            """,
            [str(location_id), latest_valid_at, latest_valid_at],
        )
        obs_rows = cur.fetchall()

    if obs_rows:
        r1, r3, r6, cov = _sum_rain_in_window(obs_rows, latest_valid_at)
        if cov >= float(coverage_threshold):
            return r1, r3, r6

    # 2) fallback FCST
    with connection.cursor() as cur:
        cur.execute(
            """
            SELECT f.valid_at, COALESCE(f.precip_mm, 0) AS precip_mm
            FROM public.weather_hourly_fcst f
            WHERE f.provider = %s
              AND f.location_id = %s
              AND f.valid_at <= %s
              AND f.valid_at >= %s - interval '6 hour'
            ORDER BY f.valid_at DESC;
            """,
            [fcst_provider, str(location_id), latest_valid_at, latest_valid_at],
        )
        fcst_rows = cur.fetchall()

    if fcst_rows:
        r1, r3, r6, _ = _sum_rain_in_window(fcst_rows, latest_valid_at)
        return r1, r3, r6

    return 0.0, 0.0, 0.0


def _fetch_snapshot_at_hour(
    location_id: Any,
    base_utc: datetime,
    fcst_provider: str = "ML",
) -> Tuple[Optional[Tuple], Optional[str], Optional[str]]:
    with connection.cursor() as cur:
        # 1) OBS đúng giờ
        cur.execute(
            """
            SELECT
              l.id, l.name, l.lat, l.lon,
              w.valid_at, w.temp_c, w.wind_ms, w.precip_mm,
              w.wind_dir_deg, w.rel_humidity_pct, w.cloudcover_pct, w.surface_pressure_hpa
            FROM public.locations l
            JOIN public.weather_hourly_obs w ON w.location_id = l.id
            WHERE w.source = 'openmeteo'
              AND l.id = %s
              AND w.valid_at = %s
            LIMIT 1;
            """,
            [str(location_id), base_utc],
        )
        row = cur.fetchone()
        if row:
            return row, "obs", "openmeteo"

        # 2) FCST đúng giờ
        cur.execute(
            """
            SELECT
              l.id, l.name, l.lat, l.lon,
              f.valid_at, f.temp_c, f.wind_ms, f.precip_mm,
              f.wind_dir_deg, f.rel_humidity_pct, f.cloudcover_pct, f.surface_pressure_hpa
            FROM public.locations l
            JOIN public.weather_hourly_fcst f ON f.location_id = l.id
            WHERE f.provider = %s
              AND l.id = %s
              AND f.valid_at = %s
            LIMIT 1;
            """,
            [fcst_provider, str(location_id), base_utc],
        )
        row = cur.fetchone()
        if row:
            return row, "fcst", fcst_provider

        # 3) OBS mới nhất (fallback cuối)
        cur.execute(
            """
            SELECT
              l.id, l.name, l.lat, l.lon,
              w.valid_at, w.temp_c, w.wind_ms, w.precip_mm,
              w.wind_dir_deg, w.rel_humidity_pct, w.cloudcover_pct, w.surface_pressure_hpa
            FROM public.locations l
            JOIN public.weather_hourly_obs w ON w.location_id = l.id
            WHERE w.source = 'openmeteo'
              AND l.id = %s
            ORDER BY w.valid_at DESC
            LIMIT 1;
            """,
            [str(location_id)],
        )
        row = cur.fetchone()
        if row:
            return row, "obs", "openmeteo"

    return None, None, None


# =============================================================================
# 4) API
# =============================================================================

def obs_summary(request, location_id: str):
    """
    GET /api/obs/summary/<location_id>

    JSON giữ nguyên cấu trúc:
    - found
    - location
    - obs (snapshot current; có thể lấy từ OBS hoặc FCST)
    - today.summary_text (tổng hợp theo ngày local, OBS + FCST bù giờ)
    - current.summary_text
    - alerts { overall_level, overall_comment, hazards[] }

    obs có metadata:
    - _source: "obs"|"fcst"
    - _provider: "openmeteo"|"ML"
    """
    try:
        UUID(str(location_id))
    except Exception:
        return HttpResponseBadRequest("invalid location_id")

    fcst_provider = "ML"

    now_utc = timezone.now().astimezone(dt_timezone.utc)
    base_utc = _floor_to_hour_utc(now_utc)

    row, snapshot_source, snapshot_provider = _fetch_snapshot_at_hour(
        location_id,
        base_utc,
        fcst_provider=fcst_provider,
    )
    if not row:
        return JsonResponse({"found": False}, status=404)

    (
        loc_id,
        loc_name,
        lat,
        lon,
        valid_at,
        temp_c,
        wind_ms,
        precip_mm,
        wind_dir_deg,
        rel_humidity,
        cloudcover,
        surface_pressure,
    ) = row

    # Mưa tích lũy: ưu tiên OBS, thiếu coverage -> fallback FCST
    rain_1h, rain_3h, rain_6h = _fetch_rain_accums(
        loc_id,
        valid_at,
        fcst_provider=fcst_provider,
        coverage_threshold=0.7,
    )

    # today: tổng hợp theo NGÀY local, bù giờ bằng FCST nếu chưa hết ngày
    today_text = _build_today_summary_text(
        location_id=loc_id,
        base_utc=base_utc,
        fcst_provider=fcst_provider,
    )

    # current: mô tả snapshot
    current_text = _build_current_comment(temp_c, wind_ms, precip_mm)

    alerts = _build_alerts_from_obs(
        temp_c=temp_c,
        wind_ms=wind_ms,
        precip_mm=precip_mm,
        cloudcover=cloudcover,
        rel_humidity=rel_humidity,
        rain_1h=rain_1h,
        rain_3h=rain_3h,
        rain_6h=rain_6h,
    )

    data = {
        "found": True,
        "location": {
            "id": str(loc_id),
            "name": loc_name,
            "lat": float(lat),
            "lon": float(lon),
        },
        "obs": {
            "valid_at": valid_at.isoformat(),
            "temp_c": temp_c,
            "wind_ms": wind_ms,
            "precip_mm": precip_mm,
            "wind_dir_deg": wind_dir_deg,
            "rel_humidity_pct": rel_humidity,
            "cloudcover_pct": cloudcover,
            "surface_pressure_hpa": surface_pressure,
            "_source": snapshot_source,
            "_provider": snapshot_provider,
        },
        "today": {"summary_text": today_text},
        "current": {"summary_text": current_text},
        "alerts": alerts,
    }
    return JsonResponse(data)
