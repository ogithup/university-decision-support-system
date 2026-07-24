from sqlalchemy import ForeignKey, Numeric, String, func
from sqlalchemy.dialects.postgresql import TIMESTAMP, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class ScenarioDefinition(Base):
    __tablename__ = "scenario_definition"

    id: Mapped[str] = mapped_column(UUID(as_uuid=True), primary_key=True)
    scenario_code: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    scenario_name: Mapped[str] = mapped_column(String(200), nullable=False)
    scenario_type: Mapped[str] = mapped_column(String(50), nullable=False)
    created_by: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[str] = mapped_column(TIMESTAMP, server_default=func.now(), nullable=False)


class ScenarioParameter(Base):
    __tablename__ = "scenario_parameter"

    id: Mapped[str] = mapped_column(UUID(as_uuid=True), primary_key=True)
    scenario_id: Mapped[str] = mapped_column(
        UUID(as_uuid=True), ForeignKey("scenario_definition.id"), nullable=False
    )
    parameter_name: Mapped[str] = mapped_column(String(100), nullable=False)
    parameter_value: Mapped[float | None] = mapped_column(Numeric(18, 4))
    parameter_text: Mapped[str | None] = mapped_column(String(200))


class ScenarioResult(Base):
    __tablename__ = "scenario_result"

    id: Mapped[str] = mapped_column(UUID(as_uuid=True), primary_key=True)
    scenario_id: Mapped[str] = mapped_column(
        UUID(as_uuid=True), ForeignKey("scenario_definition.id"), nullable=False
    )
    result_scope: Mapped[str] = mapped_column(String(50), nullable=False)
    unit_id: Mapped[str | None] = mapped_column(UUID(as_uuid=True), ForeignKey("dim_unit.id"))
    program_id: Mapped[str | None] = mapped_column(UUID(as_uuid=True), ForeignKey("dim_program.id"))
    metric_code: Mapped[str] = mapped_column(String(100), nullable=False)
    base_value: Mapped[float | None] = mapped_column(Numeric(18, 4))
    scenario_value: Mapped[float | None] = mapped_column(Numeric(18, 4))
    delta_value: Mapped[float | None] = mapped_column(Numeric(18, 4))
    calculated_at: Mapped[str] = mapped_column(TIMESTAMP, server_default=func.now(), nullable=False)

