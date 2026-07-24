from __future__ import annotations

from datetime import datetime

from sqlalchemy.orm import Session

from app.repositories.dashboard_repository import DashboardRepository
from app.schemas.academic import AcademicPerformanceCenterResponse, AcademicPerformanceMetric, ChartDatum


_METRIC_CONFIG = {
    "STAFF_TOTAL": {
        "label": "Toplam Akademik Personel",
        "value": "40",
        "delta": "+3 kadro",
        "status": "healthy",
        "icon": "users",
        "sparkline": [34, 35, 36, 37, 39, 40],
    },
    "PUB_TOTAL": {
        "label": "Toplam Yayin",
        "value": "795",
        "delta": "+12.4%",
        "status": "healthy",
        "icon": "book-open",
        "sparkline": [620, 658, 701, 742, 776, 795],
    },
    "CIT_TOTAL": {
        "label": "Toplam Atif",
        "value": "9806",
        "delta": "+9.8%",
        "status": "healthy",
        "icon": "quote",
        "sparkline": [6900, 7420, 8110, 8760, 9320, 9806],
    },
    "PUB_PER_ACAD": {
        "label": "Akademisyen Basi Yayin",
        "value": "19.9",
        "delta": "+1.6",
        "status": "healthy",
        "icon": "activity",
        "sparkline": [15.1, 16.3, 17.2, 18.1, 19.1, 19.9],
    },
    "COLLAB_INT": {
        "label": "Uluslararasi Is Birligi",
        "value": "%61",
        "delta": "+4 puan",
        "status": "watch",
        "icon": "globe",
        "sparkline": [48, 51, 53, 56, 59, 61],
    },
    "PROJ_ACTIVE": {
        "label": "Aktif Proje",
        "value": "172",
        "delta": "+5 proje",
        "status": "healthy",
        "icon": "briefcase",
        "sparkline": [126, 139, 148, 157, 167, 172],
    },
    "TARGET_RATE": {
        "label": "Hedef Gerceklesme",
        "value": "%84",
        "delta": "+6 puan",
        "status": "healthy",
        "icon": "target",
        "sparkline": [66, 71, 74, 78, 81, 84],
    },
    "KPI_RISK": {
        "label": "Risk Altindaki KPI",
        "value": "4",
        "delta": "-1",
        "status": "watch",
        "icon": "alert-triangle",
        "sparkline": [7, 7, 6, 5, 5, 4],
    },
}


def _format_live_value(code: str, value: float | None) -> str:
    if value is None:
        return _METRIC_CONFIG[code]["value"]
    if code in {"COLLAB_INT", "TARGET_RATE"}:
        return f"%{float(value):.0f}"
    if code == "PUB_PER_ACAD":
        return f"{float(value):.1f}"
    return f"{int(value):,}"


def get_academic_performance_center(db: Session) -> AcademicPerformanceCenterResponse:
    repo = DashboardRepository(db)
    codes = list(_METRIC_CONFIG.keys())
    live_rows = {
        code: (name, value, risk_level)
        for code, name, value, risk_level in repo.get_latest_kpis_by_codes(codes)
    }
    source_mode = "warehouse_live" if len(live_rows) >= 4 else "mock_fallback"

    metrics = []
    for code in codes:
        config = _METRIC_CONFIG[code]
        live_row = live_rows.get(code)
        label = live_row[0] if live_row else config["label"]
        value = _format_live_value(code, live_row[1] if live_row else None)
        status = (live_row[2] if live_row and live_row[2] else config["status"]).lower()
        metrics.append(
            AcademicPerformanceMetric(
                code=code,
                label=label,
                value=value,
                delta=config["delta"],
                status=status,
                icon=config["icon"],
                sparkline=[
                    ChartDatum(label=f"D{index + 1}", value=float(point))
                    for index, point in enumerate(config["sparkline"])
                ],
            )
        )

    return AcademicPerformanceCenterResponse(
        period="2025-2026",
        faculty="Tumu",
        source_mode=source_mode,
        last_updated=datetime(2026, 7, 24, 10, 45).isoformat() + "+03:00",
        metrics=metrics,
    )
