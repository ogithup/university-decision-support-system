from sqlalchemy import Boolean, ForeignKey, Integer, Numeric, String, func
from sqlalchemy.dialects.postgresql import TIMESTAMP, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class FactStudentEnrollment(Base):
    __tablename__ = "fact_student_enrollment"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    date_key: Mapped[int] = mapped_column(ForeignKey("dim_time.date_key"), nullable=False)
    unit_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("dim_unit.id"), nullable=False)
    program_id: Mapped[str] = mapped_column(
        UUID(as_uuid=True), ForeignKey("dim_program.id"), nullable=False
    )
    student_id: Mapped[str] = mapped_column(
        UUID(as_uuid=True), ForeignKey("dim_student.id"), nullable=False
    )
    enrollment_status: Mapped[str] = mapped_column(String(30), nullable=False)
    is_new_registration: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_graduated: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_dropout: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    graduation_duration_term: Mapped[int | None] = mapped_column(Integer)


class FactProgramQuota(Base):
    __tablename__ = "fact_program_quota"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    date_key: Mapped[int] = mapped_column(ForeignKey("dim_time.date_key"), nullable=False)
    program_id: Mapped[str] = mapped_column(
        UUID(as_uuid=True), ForeignKey("dim_program.id"), nullable=False
    )
    quota: Mapped[int] = mapped_column(Integer, nullable=False)
    placed_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    enrolled_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    occupancy_rate: Mapped[float | None] = mapped_column(Numeric(8, 4))
    base_score: Mapped[float | None] = mapped_column(Numeric(10, 2))
    success_rank: Mapped[int | None] = mapped_column(Integer)


class FactCourseLoad(Base):
    __tablename__ = "fact_course_load"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    date_key: Mapped[int] = mapped_column(ForeignKey("dim_time.date_key"), nullable=False)
    course_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("dim_course.id"), nullable=False)
    personnel_id: Mapped[str | None] = mapped_column(UUID(as_uuid=True), ForeignKey("dim_personnel.id"))
    program_id: Mapped[str | None] = mapped_column(UUID(as_uuid=True), ForeignKey("dim_program.id"))
    student_count: Mapped[int] = mapped_column(Integer, nullable=False)
    weekly_hours: Mapped[float] = mapped_column(Numeric(8, 2), nullable=False)
    section_count: Mapped[int] = mapped_column(Integer, default=1, nullable=False)


class FactPersonnelPerformance(Base):
    __tablename__ = "fact_personnel_performance"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    date_key: Mapped[int] = mapped_column(ForeignKey("dim_time.date_key"), nullable=False)
    personnel_id: Mapped[str] = mapped_column(
        UUID(as_uuid=True), ForeignKey("dim_personnel.id"), nullable=False
    )
    unit_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("dim_unit.id"), nullable=False)
    publication_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    citation_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    project_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    patent_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    thesis_supervision_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    teaching_load_hours: Mapped[float] = mapped_column(Numeric(10, 2), default=0, nullable=False)
    performance_score: Mapped[float | None] = mapped_column(Numeric(12, 4))


class FactSpaceUtilization(Base):
    __tablename__ = "fact_space_utilization"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    date_key: Mapped[int] = mapped_column(ForeignKey("dim_time.date_key"), nullable=False)
    space_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("dim_space.id"), nullable=False)
    planned_hours: Mapped[float] = mapped_column(Numeric(10, 2), default=0, nullable=False)
    used_hours: Mapped[float] = mapped_column(Numeric(10, 2), default=0, nullable=False)
    utilization_rate: Mapped[float | None] = mapped_column(Numeric(8, 4))
    assigned_unit_id: Mapped[str | None] = mapped_column(UUID(as_uuid=True), ForeignKey("dim_unit.id"))


class FactFinanceActual(Base):
    __tablename__ = "fact_finance_actual"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    date_key: Mapped[int] = mapped_column(ForeignKey("dim_time.date_key"), nullable=False)
    unit_id: Mapped[str | None] = mapped_column(UUID(as_uuid=True), ForeignKey("dim_unit.id"))
    program_id: Mapped[str | None] = mapped_column(UUID(as_uuid=True), ForeignKey("dim_program.id"))
    account_id: Mapped[str] = mapped_column(
        UUID(as_uuid=True), ForeignKey("dim_finance_account.id"), nullable=False
    )
    amount: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False)
    currency_code: Mapped[str] = mapped_column(String(10), default="TRY", nullable=False)


class FactFinanceBudget(Base):
    __tablename__ = "fact_finance_budget"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    date_key: Mapped[int] = mapped_column(ForeignKey("dim_time.date_key"), nullable=False)
    unit_id: Mapped[str | None] = mapped_column(UUID(as_uuid=True), ForeignKey("dim_unit.id"))
    program_id: Mapped[str | None] = mapped_column(UUID(as_uuid=True), ForeignKey("dim_program.id"))
    account_id: Mapped[str] = mapped_column(
        UUID(as_uuid=True), ForeignKey("dim_finance_account.id"), nullable=False
    )
    budget_amount: Mapped[float] = mapped_column(Numeric(18, 2), nullable=False)
    currency_code: Mapped[str] = mapped_column(String(10), default="TRY", nullable=False)


class FactKpiSnapshot(Base):
    __tablename__ = "fact_kpi_snapshot"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    date_key: Mapped[int] = mapped_column(ForeignKey("dim_time.date_key"), nullable=False)
    kpi_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("dim_kpi.id"), nullable=False)
    unit_id: Mapped[str | None] = mapped_column(UUID(as_uuid=True), ForeignKey("dim_unit.id"))
    program_id: Mapped[str | None] = mapped_column(UUID(as_uuid=True), ForeignKey("dim_program.id"))
    actual_value: Mapped[float | None] = mapped_column(Numeric(18, 4))
    target_value: Mapped[float | None] = mapped_column(Numeric(18, 4))
    previous_year_value: Mapped[float | None] = mapped_column(Numeric(18, 4))
    university_average: Mapped[float | None] = mapped_column(Numeric(18, 4))
    yoy_change: Mapped[float | None] = mapped_column(Numeric(18, 4))
    achievement_rate: Mapped[float | None] = mapped_column(Numeric(18, 4))
    risk_level: Mapped[str | None] = mapped_column(String(20))
    calculated_at: Mapped[str] = mapped_column(TIMESTAMP, server_default=func.now(), nullable=False)


class FactExternalIndicatorSnapshot(Base):
    __tablename__ = "fact_external_indicator_snapshot"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    date_key: Mapped[int] = mapped_column(ForeignKey("dim_time.date_key"), nullable=False)
    framework_id: Mapped[str] = mapped_column(
        UUID(as_uuid=True), ForeignKey("dim_external_framework.id"), nullable=False
    )
    indicator_id: Mapped[str] = mapped_column(
        UUID(as_uuid=True), ForeignKey("dim_external_indicator.id"), nullable=False
    )
    unit_id: Mapped[str | None] = mapped_column(UUID(as_uuid=True), ForeignKey("dim_unit.id"))
    actual_value: Mapped[float | None] = mapped_column(Numeric(18, 4))
    benchmark_turkiye: Mapped[float | None] = mapped_column(Numeric(18, 4))
    benchmark_peer: Mapped[float | None] = mapped_column(Numeric(18, 4))
    readiness_score: Mapped[float | None] = mapped_column(Numeric(8, 4))
    completeness_rate: Mapped[float | None] = mapped_column(Numeric(8, 4))
    status: Mapped[str | None] = mapped_column(String(30))

