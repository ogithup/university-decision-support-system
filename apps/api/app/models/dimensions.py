from sqlalchemy import Boolean, ForeignKey, Integer, Numeric, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import DATE, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class DimTime(Base):
    __tablename__ = "dim_time"

    date_key: Mapped[int] = mapped_column(Integer, primary_key=True)
    full_date: Mapped[str] = mapped_column(DATE, nullable=False)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    quarter: Mapped[int] = mapped_column(Integer, nullable=False)
    month: Mapped[int] = mapped_column(Integer, nullable=False)
    month_name: Mapped[str] = mapped_column(String(20), nullable=False)
    week: Mapped[int] = mapped_column(Integer, nullable=False)
    day: Mapped[int] = mapped_column(Integer, nullable=False)
    academic_year: Mapped[str | None] = mapped_column(String(20))
    semester: Mapped[str | None] = mapped_column(String(20))


class DimUnit(Base):
    __tablename__ = "dim_unit"

    id: Mapped[str] = mapped_column(UUID(as_uuid=True), primary_key=True)
    unit_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    unit_name: Mapped[str] = mapped_column(String(200), nullable=False)
    unit_type: Mapped[str] = mapped_column(String(50), nullable=False)
    parent_unit_id: Mapped[str | None] = mapped_column(UUID(as_uuid=True), ForeignKey("dim_unit.id"))
    is_academic: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class DimProgram(Base):
    __tablename__ = "dim_program"

    id: Mapped[str] = mapped_column(UUID(as_uuid=True), primary_key=True)
    program_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    program_name: Mapped[str] = mapped_column(String(200), nullable=False)
    unit_id: Mapped[str] = mapped_column(UUID(as_uuid=True), ForeignKey("dim_unit.id"), nullable=False)
    degree_level: Mapped[str] = mapped_column(String(30), nullable=False)
    language_code: Mapped[str | None] = mapped_column(String(10))
    education_type: Mapped[str | None] = mapped_column(String(30))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class DimStudent(Base):
    __tablename__ = "dim_student"

    id: Mapped[str] = mapped_column(UUID(as_uuid=True), primary_key=True)
    student_no: Mapped[str | None] = mapped_column(String(50), unique=True)
    gender: Mapped[str | None] = mapped_column(String(20))
    nationality_code: Mapped[str | None] = mapped_column(String(10))
    scholarship_type: Mapped[str | None] = mapped_column(String(50))
    scholarship_rate: Mapped[float | None] = mapped_column(Numeric(5, 2))
    entry_year: Mapped[int | None] = mapped_column(Integer)
    current_status: Mapped[str | None] = mapped_column(String(30))


class DimPersonnel(Base):
    __tablename__ = "dim_personnel"

    id: Mapped[str] = mapped_column(UUID(as_uuid=True), primary_key=True)
    personnel_no: Mapped[str | None] = mapped_column(String(50), unique=True)
    unit_id: Mapped[str | None] = mapped_column(UUID(as_uuid=True), ForeignKey("dim_unit.id"))
    title_code: Mapped[str | None] = mapped_column(String(30))
    personnel_type: Mapped[str | None] = mapped_column(String(30))
    employment_status: Mapped[str | None] = mapped_column(String(30))
    hire_date: Mapped[str | None] = mapped_column(DATE)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class DimCourse(Base):
    __tablename__ = "dim_course"

    id: Mapped[str] = mapped_column(UUID(as_uuid=True), primary_key=True)
    course_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    course_name: Mapped[str] = mapped_column(String(200), nullable=False)
    unit_id: Mapped[str | None] = mapped_column(UUID(as_uuid=True), ForeignKey("dim_unit.id"))
    credit: Mapped[float | None] = mapped_column(Numeric(4, 2))
    weekly_hours: Mapped[float | None] = mapped_column(Numeric(4, 2))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class DimSpace(Base):
    __tablename__ = "dim_space"

    id: Mapped[str] = mapped_column(UUID(as_uuid=True), primary_key=True)
    space_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    space_name: Mapped[str] = mapped_column(String(200), nullable=False)
    building_name: Mapped[str | None] = mapped_column(String(200))
    campus_name: Mapped[str | None] = mapped_column(String(200))
    space_type: Mapped[str | None] = mapped_column(String(50))
    capacity: Mapped[int | None] = mapped_column(Integer)
    area_m2: Mapped[float | None] = mapped_column(Numeric(12, 2))
    owner_unit_id: Mapped[str | None] = mapped_column(UUID(as_uuid=True), ForeignKey("dim_unit.id"))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class DimFinanceAccount(Base):
    __tablename__ = "dim_finance_account"

    id: Mapped[str] = mapped_column(UUID(as_uuid=True), primary_key=True)
    account_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    account_name: Mapped[str] = mapped_column(String(200), nullable=False)
    account_group: Mapped[str] = mapped_column(String(50), nullable=False)
    parent_account_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("dim_finance_account.id")
    )


class DimKpi(Base):
    __tablename__ = "dim_kpi"

    id: Mapped[str] = mapped_column(UUID(as_uuid=True), primary_key=True)
    kpi_code: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    kpi_name: Mapped[str] = mapped_column(String(200), nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    unit_of_measure: Mapped[str] = mapped_column(String(50), nullable=False)
    owner_module: Mapped[str] = mapped_column(String(100), nullable=False)
    formula_text: Mapped[str] = mapped_column(String, nullable=False)
    refresh_frequency: Mapped[str | None] = mapped_column(String(50))
    risk_threshold_low: Mapped[float | None] = mapped_column(Numeric(18, 4))
    risk_threshold_high: Mapped[float | None] = mapped_column(Numeric(18, 4))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class DimExternalFramework(Base):
    __tablename__ = "dim_external_framework"

    id: Mapped[str] = mapped_column(UUID(as_uuid=True), primary_key=True)
    framework_code: Mapped[str] = mapped_column(String(30), unique=True, nullable=False)
    framework_name: Mapped[str] = mapped_column(String(100), nullable=False)
    methodology_year: Mapped[int] = mapped_column(Integer, nullable=False)


class DimExternalIndicator(Base):
    __tablename__ = "dim_external_indicator"
    __table_args__ = (UniqueConstraint("framework_id", "indicator_code"),)

    id: Mapped[str] = mapped_column(UUID(as_uuid=True), primary_key=True)
    framework_id: Mapped[str] = mapped_column(
        UUID(as_uuid=True), ForeignKey("dim_external_framework.id"), nullable=False
    )
    indicator_code: Mapped[str] = mapped_column(String(100), nullable=False)
    indicator_name: Mapped[str] = mapped_column(String(200), nullable=False)
    category: Mapped[str | None] = mapped_column(String(100))
    weight: Mapped[float | None] = mapped_column(Numeric(8, 4))

