from sqlalchemy import ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import DATE, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class StrategyGoal(Base):
    __tablename__ = "strategy_goal"

    id: Mapped[str] = mapped_column(UUID(as_uuid=True), primary_key=True)
    goal_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    goal_name: Mapped[str] = mapped_column(String(200), nullable=False)
    owner_unit_id: Mapped[str | None] = mapped_column(UUID(as_uuid=True), ForeignKey("dim_unit.id"))
    start_date: Mapped[str | None] = mapped_column(DATE)
    end_date: Mapped[str | None] = mapped_column(DATE)
    status: Mapped[str] = mapped_column(String(30), default="planned", nullable=False)


class StrategyGoalKpi(Base):
    __tablename__ = "strategy_goal_kpi"

    id: Mapped[str] = mapped_column(UUID(as_uuid=True), primary_key=True)
    goal_id: Mapped[str] = mapped_column(
        UUID(as_uuid=True), ForeignKey("strategy_goal.id"), nullable=False
    )
    kpi_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("dim_kpi.id"), nullable=False)
    target_value: Mapped[float] = mapped_column(Numeric(18, 4), nullable=False)
    weight: Mapped[float] = mapped_column(Numeric(8, 4), default=1, nullable=False)

