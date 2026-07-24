from sqlalchemy.orm import Session

from app.repositories.dashboard_repository import DashboardRepository
from app.schemas.dashboard import (
    ChartSeriesPoint,
    DashboardCard,
    DashboardChart,
    ExecutiveDashboardResponse,
)


def _format_kpi_value(code: str, value: float | None) -> str:
    if value is None:
        return "N/A"
    if code in {"PRG_OCC_RATE", "GRAD_RATE", "YOK_READY", "SPACE_UTIL"}:
        return f"%{float(value):.1f}"
    if code in {"REV_EXP_BAL", "COST_PER_STU"}:
        return f"{float(value):,.1f} TRY"
    return f"{int(value):,}"


def get_executive_dashboard_from_db(db: Session) -> ExecutiveDashboardResponse:
    repo = DashboardRepository(db)

    cards = [
        DashboardCard(
            id=code.lower(),
            title=name,
            value=_format_kpi_value(code, value),
            subtitle=f"Risk seviyesi: {risk_level or 'unknown'}",
            risk_level=risk_level or "unknown",
        )
        for code, name, value, risk_level in repo.get_latest_kpi_cards()
    ]

    student_trend = DashboardChart(
        id="student-trend",
        title="Ogrenci Trend",
        chart_type="line",
        series=[
            ChartSeriesPoint(label=label, value=float(value))
            for label, value in repo.get_student_trend()
        ],
    )

    readiness = DashboardChart(
        id="readiness",
        title="Dis Cerceve Hazirlik",
        chart_type="bar",
        series=[
            ChartSeriesPoint(label=label, value=float(value or 0))
            for label, value in repo.get_framework_readiness()
        ],
    )

    alerts = list(repo.get_open_alerts())

    return ExecutiveDashboardResponse(cards=cards, charts=[student_trend, readiness], alerts=alerts)

