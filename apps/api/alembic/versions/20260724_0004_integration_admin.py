"""Add integration admin and file upload tables.

Revision ID: 20260724_0004
Revises: 20260722_0003
Create Date: 2026-07-24 11:30:00
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "20260724_0004"
down_revision = "20260722_0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "data_contract",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("dataset_name", sa.String(length=100), nullable=False),
        sa.Column("source_system", sa.String(length=100), nullable=False),
        sa.Column("version", sa.String(length=20), nullable=False),
        sa.Column("primary_key_fields", postgresql.JSONB(astext_type=sa.Text())),
        sa.Column("required_fields", postgresql.JSONB(astext_type=sa.Text())),
        sa.Column("optional_fields", postgresql.JSONB(astext_type=sa.Text())),
        sa.Column("field_types", postgresql.JSONB(astext_type=sa.Text())),
        sa.Column("code_lists", postgresql.JSONB(astext_type=sa.Text())),
        sa.Column("business_rules", postgresql.JSONB(astext_type=sa.Text())),
        sa.Column("owner_unit", sa.String(length=200)),
        sa.Column("retention_policy", sa.String(length=100)),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
    )
    op.create_table(
        "institution_code_mapping",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("source_system", sa.String(length=50), nullable=False),
        sa.Column("source_code", sa.String(length=100), nullable=False),
        sa.Column("source_name", sa.String(length=255)),
        sa.Column("yok_university_code", sa.String(length=50)),
        sa.Column("yok_unit_code", sa.String(length=50)),
        sa.Column("yok_program_code", sa.String(length=50)),
        sa.Column("obs_code", sa.String(length=50)),
        sa.Column("normalized_name", sa.String(length=255)),
        sa.Column("mapping_status", sa.String(length=30), nullable=False, server_default="mapped"),
        sa.Column("created_at", sa.TIMESTAMP(), nullable=False, server_default=sa.text("now()")),
    )
    op.create_table(
        "manual_review_queue",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("batch_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("meta_ingestion_batch.id")),
        sa.Column("source_system", sa.String(length=50), nullable=False),
        sa.Column("entity_type", sa.String(length=50), nullable=False),
        sa.Column("source_code", sa.String(length=100)),
        sa.Column("source_name", sa.String(length=255)),
        sa.Column("suggested_match", sa.String(length=255)),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False, server_default="open"),
        sa.Column("payload", postgresql.JSONB(astext_type=sa.Text())),
        sa.Column("created_at", sa.TIMESTAMP(), nullable=False, server_default=sa.text("now()")),
    )
    op.create_table(
        "reconciliation_report",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("batch_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("meta_ingestion_batch.id"), nullable=False),
        sa.Column("dataset_name", sa.String(length=100), nullable=False),
        sa.Column("source_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("loaded_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("diff_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("status", sa.String(length=30), nullable=False),
        sa.Column("details", postgresql.JSONB(astext_type=sa.Text())),
        sa.Column("created_at", sa.TIMESTAMP(), nullable=False, server_default=sa.text("now()")),
    )
    op.create_table(
        "uploaded_source_file",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("batch_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("meta_ingestion_batch.id"), nullable=False),
        sa.Column("source_code", sa.String(length=50), nullable=False),
        sa.Column("file_name", sa.String(length=255), nullable=False),
        sa.Column("file_type", sa.String(length=50)),
        sa.Column("period_label", sa.String(length=50)),
        sa.Column("storage_path", sa.String(length=500), nullable=False),
        sa.Column("sha256_hash", sa.String(length=128), nullable=False),
        sa.Column("file_size_bytes", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("row_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.TIMESTAMP(), nullable=False, server_default=sa.text("now()")),
    )

    op.execute(
        """
        insert into meta_data_source (source_code, source_name, source_type, refresh_frequency)
        values ('yok_excel_upload', 'YOK Excel Upload', 'file', 'manual')
        on conflict (source_code) do nothing;
        """
    )

    op.execute(
        """
        insert into data_contract (
            dataset_name, source_system, version, primary_key_fields, required_fields,
            optional_fields, field_types, business_rules, owner_unit, retention_policy, is_active
        ) values
        (
            'yoksis_programs',
            'YOKSIS',
            'v1',
            '["program_code"]'::jsonb,
            '["program_code", "program_name"]'::jsonb,
            '["unit_code", "degree_level", "language_code", "education_type"]'::jsonb,
            '{"program_code":"string","program_name":"string","unit_code":"string","degree_level":"string"}'::jsonb,
            '["Program code zorunludur","Program name zorunludur"]'::jsonb,
            'Bilgi Islem Daire Baskanligi',
            '5 years',
            true
        ),
        (
            'yoksis_students',
            'YOKSIS',
            'v1',
            '["student_no"]'::jsonb,
            '["student_no","program_code"]'::jsonb,
            '["unit_code","gender","nationality_code","entry_year","current_status"]'::jsonb,
            '{"student_no":"string","program_code":"string","entry_year":"integer"}'::jsonb,
            '["Student number zorunludur","Program code zorunludur"]'::jsonb,
            'Ogrenci Isleri',
            '5 years',
            true
        ),
        (
            'yok_excel_upload',
            'YOK_FILES',
            'v1',
            '["source_row_id"]'::jsonb,
            '["period","file_name"]'::jsonb,
            '["sheet_name","row_count"]'::jsonb,
            '{"period":"string","file_name":"string"}'::jsonb,
            '["Dosya hash zorunludur","Period etiketi algilanmalidir"]'::jsonb,
            'Veri Yonetimi',
            '5 years',
            true
        );
        """
    )

    op.execute(
        """
        insert into manual_review_queue (
            batch_id, source_system, entity_type, source_code, source_name, suggested_match, reason, status, payload
        )
        select
            null,
            'YOKSIS',
            'program',
            'UNKNOWN-PROG',
            'Bilgisayar Muh.',
            'Bilgisayar Muhendisligi',
            'Kod eslesmesi bulunamadi, isim normalizasyonu gerekli.',
            'open',
            '{"source":"demo"}'::jsonb
        where not exists (
            select 1 from manual_review_queue where source_code = 'UNKNOWN-PROG'
        );
        """
    )

    op.execute(
        """
        insert into reconciliation_report (
            batch_id, dataset_name, source_count, loaded_count, diff_count, status, details
        )
        select
            b.id,
            'yoksis_programs',
            1,
            1,
            0,
            'success',
            jsonb_build_object(
                'message', 'Demo mutabakat raporu',
                'unmatched_records', 0
            )
        from meta_ingestion_batch b
        where not exists (select 1 from reconciliation_report)
        order by b.started_at desc
        limit 1;
        """
    )


def downgrade() -> None:
    op.drop_table("uploaded_source_file")
    op.drop_table("reconciliation_report")
    op.drop_table("manual_review_queue")
    op.drop_table("institution_code_mapping")
    op.drop_table("data_contract")
