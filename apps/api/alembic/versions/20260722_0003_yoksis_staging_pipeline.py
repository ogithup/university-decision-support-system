"""Add YOKSIS staging and mapping tables.

Revision ID: 20260722_0003
Revises: 20260722_0002
Create Date: 2026-07-22 15:05:00
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "20260722_0003"
down_revision = "20260722_0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "yoksis_field_mapping",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("resource_name", sa.String(length=50), nullable=False),
        sa.Column("source_field", sa.String(length=100), nullable=False),
        sa.Column("target_field", sa.String(length=100), nullable=False),
        sa.Column("is_required", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("transform_type", sa.String(length=50)),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
    )
    op.create_table(
        "stg_yoksis_program",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("batch_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("meta_ingestion_batch.id"), nullable=False),
        sa.Column("source_record_id", sa.String(length=100)),
        sa.Column("program_code", sa.String(length=50)),
        sa.Column("program_name", sa.String(length=200)),
        sa.Column("unit_code", sa.String(length=50)),
        sa.Column("degree_level", sa.String(length=30)),
        sa.Column("language_code", sa.String(length=10)),
        sa.Column("education_type", sa.String(length=30)),
        sa.Column("source_payload", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("transform_status", sa.String(length=20), nullable=False, server_default="parsed"),
        sa.Column("transform_message", sa.Text()),
        sa.Column("transformed_at", sa.TIMESTAMP(), nullable=False, server_default=sa.text("now()")),
    )
    op.create_table(
        "stg_yoksis_student",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("batch_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("meta_ingestion_batch.id"), nullable=False),
        sa.Column("source_record_id", sa.String(length=100)),
        sa.Column("student_no", sa.String(length=50)),
        sa.Column("program_code", sa.String(length=50)),
        sa.Column("unit_code", sa.String(length=50)),
        sa.Column("gender", sa.String(length=20)),
        sa.Column("nationality_code", sa.String(length=10)),
        sa.Column("scholarship_type", sa.String(length=50)),
        sa.Column("scholarship_rate", sa.String(length=20)),
        sa.Column("entry_year", sa.Integer()),
        sa.Column("current_status", sa.String(length=30)),
        sa.Column("source_payload", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("transform_status", sa.String(length=20), nullable=False, server_default="parsed"),
        sa.Column("transform_message", sa.Text()),
        sa.Column("transformed_at", sa.TIMESTAMP(), nullable=False, server_default=sa.text("now()")),
    )
    op.create_table(
        "stg_yoksis_staff",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("batch_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("meta_ingestion_batch.id"), nullable=False),
        sa.Column("source_record_id", sa.String(length=100)),
        sa.Column("personnel_no", sa.String(length=50)),
        sa.Column("unit_code", sa.String(length=50)),
        sa.Column("title_code", sa.String(length=30)),
        sa.Column("personnel_type", sa.String(length=30)),
        sa.Column("employment_status", sa.String(length=30)),
        sa.Column("hire_date_text", sa.String(length=30)),
        sa.Column("source_payload", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("transform_status", sa.String(length=20), nullable=False, server_default="parsed"),
        sa.Column("transform_message", sa.Text()),
        sa.Column("transformed_at", sa.TIMESTAMP(), nullable=False, server_default=sa.text("now()")),
    )

    op.execute(
        """
        insert into yoksis_field_mapping (resource_name, source_field, target_field, is_required, transform_type)
        values
            ('programs', 'programCode', 'program_code', true, 'string'),
            ('programs', 'programName', 'program_name', true, 'string'),
            ('programs', 'unitCode', 'unit_code', false, 'string'),
            ('programs', 'degreeLevel', 'degree_level', false, 'string'),
            ('students', 'studentNo', 'student_no', true, 'string'),
            ('students', 'programCode', 'program_code', true, 'string'),
            ('students', 'entryYear', 'entry_year', false, 'integer'),
            ('students', 'currentStatus', 'current_status', false, 'string'),
            ('staff', 'personnelNo', 'personnel_no', true, 'string'),
            ('staff', 'unitCode', 'unit_code', false, 'string'),
            ('staff', 'titleCode', 'title_code', false, 'string'),
            ('staff', 'employmentStatus', 'employment_status', false, 'string')
        ;
        """
    )
    op.execute(
        """
        insert into meta_data_quality_rule (id, rule_code, rule_name, entity_name, severity, rule_expression, is_active)
        values
            (gen_random_uuid(), 'YOKSIS_PROGRAM_CODE_REQ', 'Program code is required', 'programs', 'high', 'required:program_code', true),
            (gen_random_uuid(), 'YOKSIS_PROGRAM_NAME_REQ', 'Program name is required', 'programs', 'high', 'required:program_name', true),
            (gen_random_uuid(), 'YOKSIS_STUDENT_NO_REQ', 'Student number is required', 'students', 'high', 'required:student_no', true),
            (gen_random_uuid(), 'YOKSIS_STUDENT_PROGRAM_REQ', 'Student program code is required', 'students', 'high', 'required:program_code', true),
            (gen_random_uuid(), 'YOKSIS_STAFF_NO_REQ', 'Personnel number is required', 'staff', 'high', 'required:personnel_no', true)
        on conflict (rule_code) do nothing;
        """
    )


def downgrade() -> None:
    op.execute(
        """
        delete from meta_data_quality_rule
        where rule_code in (
            'YOKSIS_PROGRAM_CODE_REQ',
            'YOKSIS_PROGRAM_NAME_REQ',
            'YOKSIS_STUDENT_NO_REQ',
            'YOKSIS_STUDENT_PROGRAM_REQ',
            'YOKSIS_STAFF_NO_REQ'
        );
        """
    )
    op.drop_table("stg_yoksis_staff")
    op.drop_table("stg_yoksis_student")
    op.drop_table("stg_yoksis_program")
    op.drop_table("yoksis_field_mapping")
