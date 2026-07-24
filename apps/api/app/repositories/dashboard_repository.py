from collections.abc import Sequence

from sqlalchemy import Integer, Select, cast, desc, func, select
from sqlalchemy.orm import Session

from app.models.dimensions import DimExternalFramework, DimKpi
from app.models.facts import FactExternalIndicatorSnapshot, FactKpiSnapshot, FactStudentEnrollment
from app.models.risk import RiskAlert


class DashboardRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_latest_kpis_by_codes(
        self,
        codes: Sequence[str],
    ) -> Sequence[tuple[str, str, float | None, str | None]]:
        latest_date_key = select(func.max(FactKpiSnapshot.date_key)).scalar_subquery()
        stmt: Select = (
            select(
                DimKpi.kpi_code,
                DimKpi.kpi_name,
                FactKpiSnapshot.actual_value,
                FactKpiSnapshot.risk_level,
            )
            .join(FactKpiSnapshot, FactKpiSnapshot.kpi_id == DimKpi.id)
            .where(FactKpiSnapshot.date_key == latest_date_key)
            .where(DimKpi.kpi_code.in_(codes))
        )
        return self.db.execute(stmt).all()

    def get_latest_kpi_cards(self, limit: int = 4) -> Sequence[tuple[str, str, float | None, str | None]]:
        latest_date_key = select(func.max(FactKpiSnapshot.date_key)).scalar_subquery()
        stmt: Select = (
            select(
                DimKpi.kpi_code,
                DimKpi.kpi_name,
                FactKpiSnapshot.actual_value,
                FactKpiSnapshot.risk_level,
            )
            .join(FactKpiSnapshot, FactKpiSnapshot.kpi_id == DimKpi.id)
            .where(FactKpiSnapshot.date_key == latest_date_key)
            .order_by(DimKpi.kpi_code)
            .limit(limit)
        )
        return self.db.execute(stmt).all()

    def get_student_trend(self) -> Sequence[tuple[str, int]]:
        year_expr = cast(FactStudentEnrollment.date_key / 10000, Integer)
        stmt: Select = (
            select(year_expr, func.count())
            .where(FactStudentEnrollment.is_dropout.is_(False))
            .group_by(year_expr)
            .order_by(year_expr)
        )
        rows = self.db.execute(stmt).all()
        return [(str(year), count) for year, count in rows]

    def get_framework_readiness(self) -> Sequence[tuple[str, float | None]]:
        latest_date_key = select(func.max(FactExternalIndicatorSnapshot.date_key)).scalar_subquery()
        stmt: Select = (
            select(
                DimExternalFramework.framework_code,
                func.avg(FactExternalIndicatorSnapshot.readiness_score),
            )
            .join(
                FactExternalIndicatorSnapshot,
                FactExternalIndicatorSnapshot.framework_id == DimExternalFramework.id,
            )
            .where(FactExternalIndicatorSnapshot.date_key == latest_date_key)
            .group_by(DimExternalFramework.framework_code)
            .order_by(DimExternalFramework.framework_code)
        )
        return self.db.execute(stmt).all()

    def get_open_alerts(self, limit: int = 5) -> Sequence[str]:
        stmt: Select = (
            select(RiskAlert.alert_title)
            .where(RiskAlert.status == "open")
            .order_by(desc(RiskAlert.detected_at))
            .limit(limit)
        )
        return [row[0] for row in self.db.execute(stmt).all()]
