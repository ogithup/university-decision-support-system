from sqlalchemy import ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import TIMESTAMP, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class RiskRule(Base):
    __tablename__ = "risk_rule"

    id: Mapped[str] = mapped_column(UUID(as_uuid=True), primary_key=True)
    rule_code: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    rule_name: Mapped[str] = mapped_column(String(200), nullable=False)
    entity_scope: Mapped[str] = mapped_column(String(50), nullable=False)
    condition_expression: Mapped[str] = mapped_column(Text, nullable=False)
    severity: Mapped[str] = mapped_column(String(20), nullable=False)
    recommended_action: Mapped[str | None] = mapped_column(Text)


class RiskAlert(Base):
    __tablename__ = "risk_alert"

    id: Mapped[str] = mapped_column(UUID(as_uuid=True), primary_key=True)
    rule_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("risk_rule.id"), nullable=False)
    detected_at: Mapped[str] = mapped_column(TIMESTAMP, server_default=func.now(), nullable=False)
    unit_id: Mapped[str | None] = mapped_column(UUID(as_uuid=True), ForeignKey("dim_unit.id"))
    program_id: Mapped[str | None] = mapped_column(UUID(as_uuid=True), ForeignKey("dim_program.id"))
    alert_title: Mapped[str] = mapped_column(String(200), nullable=False)
    alert_description: Mapped[str | None] = mapped_column(Text)
    severity: Mapped[str] = mapped_column(String(20), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="open", nullable=False)

