"""Initial warehouse schema.

Revision ID: 20260722_0001
Revises:
Create Date: 2026-07-22 14:55:00
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "20260722_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute('create extension if not exists "pgcrypto";')

    op.create_table(
        "meta_data_source",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("source_code", sa.String(length=50), nullable=False, unique=True),
        sa.Column("source_name", sa.String(length=200), nullable=False),
        sa.Column("source_type", sa.String(length=50), nullable=False),
        sa.Column("owner_unit", sa.String(length=200)),
        sa.Column("refresh_frequency", sa.String(length=50)),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.TIMESTAMP(), nullable=False, server_default=sa.text("now()")),
    )
    op.create_table(
        "meta_ingestion_batch",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("source_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("meta_data_source.id"), nullable=False),
        sa.Column("batch_code", sa.String(length=100), nullable=False),
        sa.Column("started_at", sa.TIMESTAMP(), nullable=False, server_default=sa.text("now()")),
        sa.Column("finished_at", sa.TIMESTAMP()),
        sa.Column("status", sa.String(length=30), nullable=False),
        sa.Column("record_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("checksum", sa.String(length=128)),
        sa.Column("error_message", sa.Text()),
        sa.Column("created_by", sa.String(length=100)),
    )
    op.create_table(
        "meta_data_quality_rule",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("rule_code", sa.String(length=100), nullable=False, unique=True),
        sa.Column("rule_name", sa.String(length=200), nullable=False),
        sa.Column("entity_name", sa.String(length=100), nullable=False),
        sa.Column("severity", sa.String(length=20), nullable=False),
        sa.Column("rule_expression", sa.Text(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
    )
    op.create_table(
        "meta_data_quality_result",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("batch_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("meta_ingestion_batch.id"), nullable=False),
        sa.Column("rule_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("meta_data_quality_rule.id"), nullable=False),
        sa.Column("entity_name", sa.String(length=100), nullable=False),
        sa.Column("failed_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("sample_payload", postgresql.JSONB(astext_type=sa.Text())),
        sa.Column("created_at", sa.TIMESTAMP(), nullable=False, server_default=sa.text("now()")),
    )
    op.create_table(
        "raw_yoksis_program",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("batch_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("meta_ingestion_batch.id"), nullable=False),
        sa.Column("payload", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("fetched_at", sa.TIMESTAMP(), nullable=False, server_default=sa.text("now()")),
    )
    op.create_table(
        "raw_yoksis_student",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("batch_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("meta_ingestion_batch.id"), nullable=False),
        sa.Column("payload", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("fetched_at", sa.TIMESTAMP(), nullable=False, server_default=sa.text("now()")),
    )
    op.create_table(
        "raw_yoksis_staff",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("batch_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("meta_ingestion_batch.id"), nullable=False),
        sa.Column("payload", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("fetched_at", sa.TIMESTAMP(), nullable=False, server_default=sa.text("now()")),
    )
    op.create_table(
        "dim_time",
        sa.Column("date_key", sa.Integer(), primary_key=True),
        sa.Column("full_date", sa.Date(), nullable=False),
        sa.Column("year", sa.Integer(), nullable=False),
        sa.Column("quarter", sa.Integer(), nullable=False),
        sa.Column("month", sa.Integer(), nullable=False),
        sa.Column("month_name", sa.String(length=20), nullable=False),
        sa.Column("week", sa.Integer(), nullable=False),
        sa.Column("day", sa.Integer(), nullable=False),
        sa.Column("academic_year", sa.String(length=20)),
        sa.Column("semester", sa.String(length=20)),
    )
    op.create_table(
        "dim_unit",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("unit_code", sa.String(length=50), nullable=False, unique=True),
        sa.Column("unit_name", sa.String(length=200), nullable=False),
        sa.Column("unit_type", sa.String(length=50), nullable=False),
        sa.Column("parent_unit_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("dim_unit.id")),
        sa.Column("is_academic", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
    )
    op.create_table(
        "dim_program",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("program_code", sa.String(length=50), nullable=False, unique=True),
        sa.Column("program_name", sa.String(length=200), nullable=False),
        sa.Column("unit_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("dim_unit.id"), nullable=False),
        sa.Column("degree_level", sa.String(length=30), nullable=False),
        sa.Column("language_code", sa.String(length=10)),
        sa.Column("education_type", sa.String(length=30)),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
    )
    op.create_table(
        "dim_student",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("student_no", sa.String(length=50), unique=True),
        sa.Column("gender", sa.String(length=20)),
        sa.Column("nationality_code", sa.String(length=10)),
        sa.Column("scholarship_type", sa.String(length=50)),
        sa.Column("scholarship_rate", sa.Numeric(5, 2)),
        sa.Column("entry_year", sa.Integer()),
        sa.Column("current_status", sa.String(length=30)),
    )
    op.create_table(
        "dim_personnel",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("personnel_no", sa.String(length=50), unique=True),
        sa.Column("unit_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("dim_unit.id")),
        sa.Column("title_code", sa.String(length=30)),
        sa.Column("personnel_type", sa.String(length=30)),
        sa.Column("employment_status", sa.String(length=30)),
        sa.Column("hire_date", sa.Date()),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
    )
    op.create_table(
        "dim_course",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("course_code", sa.String(length=50), nullable=False, unique=True),
        sa.Column("course_name", sa.String(length=200), nullable=False),
        sa.Column("unit_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("dim_unit.id")),
        sa.Column("credit", sa.Numeric(4, 2)),
        sa.Column("weekly_hours", sa.Numeric(4, 2)),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
    )
    op.create_table(
        "dim_space",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("space_code", sa.String(length=50), nullable=False, unique=True),
        sa.Column("space_name", sa.String(length=200), nullable=False),
        sa.Column("building_name", sa.String(length=200)),
        sa.Column("campus_name", sa.String(length=200)),
        sa.Column("space_type", sa.String(length=50)),
        sa.Column("capacity", sa.Integer()),
        sa.Column("area_m2", sa.Numeric(12, 2)),
        sa.Column("owner_unit_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("dim_unit.id")),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
    )
    op.create_table(
        "dim_finance_account",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("account_code", sa.String(length=50), nullable=False, unique=True),
        sa.Column("account_name", sa.String(length=200), nullable=False),
        sa.Column("account_group", sa.String(length=50), nullable=False),
        sa.Column("parent_account_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("dim_finance_account.id")),
    )
    op.create_table(
        "dim_kpi",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("kpi_code", sa.String(length=100), nullable=False, unique=True),
        sa.Column("kpi_name", sa.String(length=200), nullable=False),
        sa.Column("category", sa.String(length=100), nullable=False),
        sa.Column("unit_of_measure", sa.String(length=50), nullable=False),
        sa.Column("owner_module", sa.String(length=100), nullable=False),
        sa.Column("formula_text", sa.Text(), nullable=False),
        sa.Column("refresh_frequency", sa.String(length=50)),
        sa.Column("risk_threshold_low", sa.Numeric(18, 4)),
        sa.Column("risk_threshold_high", sa.Numeric(18, 4)),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
    )
    op.create_table(
        "dim_external_framework",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("framework_code", sa.String(length=30), nullable=False, unique=True),
        sa.Column("framework_name", sa.String(length=100), nullable=False),
        sa.Column("methodology_year", sa.Integer(), nullable=False),
    )
    op.create_table(
        "dim_external_indicator",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("framework_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("dim_external_framework.id"), nullable=False),
        sa.Column("indicator_code", sa.String(length=100), nullable=False),
        sa.Column("indicator_name", sa.String(length=200), nullable=False),
        sa.Column("category", sa.String(length=100)),
        sa.Column("weight", sa.Numeric(8, 4)),
        sa.UniqueConstraint("framework_id", "indicator_code"),
    )
    op.create_table(
        "fact_student_enrollment",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("date_key", sa.Integer(), sa.ForeignKey("dim_time.date_key"), nullable=False),
        sa.Column("unit_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("dim_unit.id"), nullable=False),
        sa.Column("program_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("dim_program.id"), nullable=False),
        sa.Column("student_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("dim_student.id"), nullable=False),
        sa.Column("enrollment_status", sa.String(length=30), nullable=False),
        sa.Column("is_new_registration", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("is_graduated", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("is_dropout", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("graduation_duration_term", sa.Integer()),
    )
    op.create_table(
        "fact_program_quota",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("date_key", sa.Integer(), sa.ForeignKey("dim_time.date_key"), nullable=False),
        sa.Column("program_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("dim_program.id"), nullable=False),
        sa.Column("quota", sa.Integer(), nullable=False),
        sa.Column("placed_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("enrolled_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("occupancy_rate", sa.Numeric(8, 4)),
        sa.Column("base_score", sa.Numeric(10, 2)),
        sa.Column("success_rank", sa.Integer()),
    )
    op.create_table(
        "fact_course_load",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("date_key", sa.Integer(), sa.ForeignKey("dim_time.date_key"), nullable=False),
        sa.Column("course_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("dim_course.id"), nullable=False),
        sa.Column("personnel_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("dim_personnel.id")),
        sa.Column("program_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("dim_program.id")),
        sa.Column("student_count", sa.Integer(), nullable=False),
        sa.Column("weekly_hours", sa.Numeric(8, 2), nullable=False),
        sa.Column("section_count", sa.Integer(), nullable=False, server_default="1"),
    )
    op.create_table(
        "fact_personnel_performance",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("date_key", sa.Integer(), sa.ForeignKey("dim_time.date_key"), nullable=False),
        sa.Column("personnel_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("dim_personnel.id"), nullable=False),
        sa.Column("unit_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("dim_unit.id"), nullable=False),
        sa.Column("publication_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("citation_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("project_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("patent_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("thesis_supervision_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("teaching_load_hours", sa.Numeric(10, 2), nullable=False, server_default="0"),
        sa.Column("performance_score", sa.Numeric(12, 4)),
    )
    op.create_table(
        "fact_space_utilization",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("date_key", sa.Integer(), sa.ForeignKey("dim_time.date_key"), nullable=False),
        sa.Column("space_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("dim_space.id"), nullable=False),
        sa.Column("planned_hours", sa.Numeric(10, 2), nullable=False, server_default="0"),
        sa.Column("used_hours", sa.Numeric(10, 2), nullable=False, server_default="0"),
        sa.Column("utilization_rate", sa.Numeric(8, 4)),
        sa.Column("assigned_unit_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("dim_unit.id")),
    )
    op.create_table(
        "fact_finance_actual",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("date_key", sa.Integer(), sa.ForeignKey("dim_time.date_key"), nullable=False),
        sa.Column("unit_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("dim_unit.id")),
        sa.Column("program_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("dim_program.id")),
        sa.Column("account_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("dim_finance_account.id"), nullable=False),
        sa.Column("amount", sa.Numeric(18, 2), nullable=False),
        sa.Column("currency_code", sa.String(length=10), nullable=False, server_default="TRY"),
    )
    op.create_table(
        "fact_finance_budget",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("date_key", sa.Integer(), sa.ForeignKey("dim_time.date_key"), nullable=False),
        sa.Column("unit_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("dim_unit.id")),
        sa.Column("program_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("dim_program.id")),
        sa.Column("account_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("dim_finance_account.id"), nullable=False),
        sa.Column("budget_amount", sa.Numeric(18, 2), nullable=False),
        sa.Column("currency_code", sa.String(length=10), nullable=False, server_default="TRY"),
    )
    op.create_table(
        "fact_kpi_snapshot",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("date_key", sa.Integer(), sa.ForeignKey("dim_time.date_key"), nullable=False),
        sa.Column("kpi_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("dim_kpi.id"), nullable=False),
        sa.Column("unit_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("dim_unit.id")),
        sa.Column("program_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("dim_program.id")),
        sa.Column("actual_value", sa.Numeric(18, 4)),
        sa.Column("target_value", sa.Numeric(18, 4)),
        sa.Column("previous_year_value", sa.Numeric(18, 4)),
        sa.Column("university_average", sa.Numeric(18, 4)),
        sa.Column("yoy_change", sa.Numeric(18, 4)),
        sa.Column("achievement_rate", sa.Numeric(18, 4)),
        sa.Column("risk_level", sa.String(length=20)),
        sa.Column("calculated_at", sa.TIMESTAMP(), nullable=False, server_default=sa.text("now()")),
    )
    op.create_table(
        "fact_external_indicator_snapshot",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("date_key", sa.Integer(), sa.ForeignKey("dim_time.date_key"), nullable=False),
        sa.Column("framework_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("dim_external_framework.id"), nullable=False),
        sa.Column("indicator_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("dim_external_indicator.id"), nullable=False),
        sa.Column("unit_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("dim_unit.id")),
        sa.Column("actual_value", sa.Numeric(18, 4)),
        sa.Column("benchmark_turkiye", sa.Numeric(18, 4)),
        sa.Column("benchmark_peer", sa.Numeric(18, 4)),
        sa.Column("readiness_score", sa.Numeric(8, 4)),
        sa.Column("completeness_rate", sa.Numeric(8, 4)),
        sa.Column("status", sa.String(length=30)),
    )
    op.create_table(
        "strategy_goal",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("goal_code", sa.String(length=50), nullable=False, unique=True),
        sa.Column("goal_name", sa.String(length=200), nullable=False),
        sa.Column("owner_unit_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("dim_unit.id")),
        sa.Column("start_date", sa.Date()),
        sa.Column("end_date", sa.Date()),
        sa.Column("status", sa.String(length=30), nullable=False, server_default="planned"),
    )
    op.create_table(
        "strategy_goal_kpi",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("goal_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("strategy_goal.id"), nullable=False),
        sa.Column("kpi_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("dim_kpi.id"), nullable=False),
        sa.Column("target_value", sa.Numeric(18, 4), nullable=False),
        sa.Column("weight", sa.Numeric(8, 4), nullable=False, server_default="1"),
    )
    op.create_table(
        "risk_rule",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("rule_code", sa.String(length=100), nullable=False, unique=True),
        sa.Column("rule_name", sa.String(length=200), nullable=False),
        sa.Column("entity_scope", sa.String(length=50), nullable=False),
        sa.Column("condition_expression", sa.Text(), nullable=False),
        sa.Column("severity", sa.String(length=20), nullable=False),
        sa.Column("recommended_action", sa.Text()),
    )
    op.create_table(
        "risk_alert",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("rule_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("risk_rule.id"), nullable=False),
        sa.Column("detected_at", sa.TIMESTAMP(), nullable=False, server_default=sa.text("now()")),
        sa.Column("unit_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("dim_unit.id")),
        sa.Column("program_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("dim_program.id")),
        sa.Column("alert_title", sa.String(length=200), nullable=False),
        sa.Column("alert_description", sa.Text()),
        sa.Column("severity", sa.String(length=20), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="open"),
    )
    op.create_table(
        "scenario_definition",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("scenario_code", sa.String(length=100), nullable=False, unique=True),
        sa.Column("scenario_name", sa.String(length=200), nullable=False),
        sa.Column("scenario_type", sa.String(length=50), nullable=False),
        sa.Column("created_by", sa.String(length=100), nullable=False),
        sa.Column("created_at", sa.TIMESTAMP(), nullable=False, server_default=sa.text("now()")),
    )
    op.create_table(
        "scenario_parameter",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("scenario_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("scenario_definition.id"), nullable=False),
        sa.Column("parameter_name", sa.String(length=100), nullable=False),
        sa.Column("parameter_value", sa.Numeric(18, 4)),
        sa.Column("parameter_text", sa.String(length=200)),
    )
    op.create_table(
        "scenario_result",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("scenario_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("scenario_definition.id"), nullable=False),
        sa.Column("result_scope", sa.String(length=50), nullable=False),
        sa.Column("unit_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("dim_unit.id")),
        sa.Column("program_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("dim_program.id")),
        sa.Column("metric_code", sa.String(length=100), nullable=False),
        sa.Column("base_value", sa.Numeric(18, 4)),
        sa.Column("scenario_value", sa.Numeric(18, 4)),
        sa.Column("delta_value", sa.Numeric(18, 4)),
        sa.Column("calculated_at", sa.TIMESTAMP(), nullable=False, server_default=sa.text("now()")),
    )

    op.execute(
        """
        insert into dim_kpi (
            kpi_code, kpi_name, category, unit_of_measure, owner_module, formula_text,
            refresh_frequency, risk_threshold_low, risk_threshold_high
        ) values
            ('STU_TOTAL', 'Toplam Ogrenci Sayisi', 'education', 'student', 'student_analytics', 'active_students_count', 'daily', null, null),
            ('PRG_OCC_RATE', 'Program Doluluk Orani', 'education', 'percent', 'student_analytics', 'enrolled_count / quota * 100', 'daily', 70, 90),
            ('GRAD_RATE', 'Mezuniyet Orani', 'education', 'percent', 'student_analytics', 'graduated_students / cohort_size * 100', 'term', 50, 80),
            ('REV_EXP_BAL', 'Gelir Gider Dengesi', 'finance', 'TRY', 'finance_analytics', 'total_revenue - total_expense', 'monthly', null, null),
            ('COST_PER_STU', 'Ogrenci Basi Maliyet', 'finance', 'TRY', 'finance_analytics', 'total_expense / active_students_count', 'monthly', null, null),
            ('CITATION_TOTAL', 'Toplam Atif', 'research', 'count', 'personnel_analytics', 'sum(citation_count)', 'monthly', null, null),
            ('SPACE_UTIL', 'Fiziksel Kapasite Kullanim Orani', 'infrastructure', 'percent', 'space_analytics', 'used_hours / planned_hours * 100', 'daily', 40, 85),
            ('YOK_READY', 'YOK Veri Hazirlik Skoru', 'external_frameworks', 'percent', 'external_readiness', 'completed_indicators / total_indicators * 100', 'weekly', 50, 75)
        on conflict (kpi_code) do nothing;
        """
    )

    op.execute(
        """
        insert into meta_data_source (source_code, source_name, source_type, refresh_frequency)
        values
            ('yoksis_programs', 'YOKSIS Program Data', 'api_or_file', 'daily'),
            ('yoksis_students', 'YOKSIS Student Data', 'api_or_file', 'daily'),
            ('yoksis_staff', 'YOKSIS Staff Data', 'api_or_file', 'daily')
        on conflict (source_code) do nothing;
        """
    )


def downgrade() -> None:
    for table_name in [
        "scenario_result",
        "scenario_parameter",
        "scenario_definition",
        "risk_alert",
        "risk_rule",
        "strategy_goal_kpi",
        "strategy_goal",
        "fact_external_indicator_snapshot",
        "fact_kpi_snapshot",
        "fact_finance_budget",
        "fact_finance_actual",
        "fact_space_utilization",
        "fact_personnel_performance",
        "fact_course_load",
        "fact_program_quota",
        "fact_student_enrollment",
        "dim_external_indicator",
        "dim_external_framework",
        "dim_kpi",
        "dim_finance_account",
        "dim_space",
        "dim_course",
        "dim_personnel",
        "dim_student",
        "dim_program",
        "dim_unit",
        "dim_time",
        "raw_yoksis_staff",
        "raw_yoksis_student",
        "raw_yoksis_program",
        "meta_data_quality_result",
        "meta_data_quality_rule",
        "meta_ingestion_batch",
        "meta_data_source",
    ]:
        op.drop_table(table_name)

