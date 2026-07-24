from sqlalchemy import Boolean, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, TIMESTAMP, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class MetaDataSource(Base):
    __tablename__ = "meta_data_source"

    id: Mapped[str] = mapped_column(UUID(as_uuid=True), primary_key=True)
    source_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    source_name: Mapped[str] = mapped_column(String(200), nullable=False)
    source_type: Mapped[str] = mapped_column(String(50), nullable=False)
    owner_unit: Mapped[str | None] = mapped_column(String(200))
    refresh_frequency: Mapped[str | None] = mapped_column(String(50))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[str] = mapped_column(TIMESTAMP, server_default=func.now(), nullable=False)


class MetaIngestionBatch(Base):
    __tablename__ = "meta_ingestion_batch"

    id: Mapped[str] = mapped_column(UUID(as_uuid=True), primary_key=True)
    source_id: Mapped[str] = mapped_column(
        UUID(as_uuid=True), ForeignKey("meta_data_source.id"), nullable=False
    )
    batch_code: Mapped[str] = mapped_column(String(100), nullable=False)
    started_at: Mapped[str] = mapped_column(TIMESTAMP, server_default=func.now(), nullable=False)
    finished_at: Mapped[str | None] = mapped_column(TIMESTAMP)
    status: Mapped[str] = mapped_column(String(30), nullable=False)
    record_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    checksum: Mapped[str | None] = mapped_column(String(128))
    error_message: Mapped[str | None] = mapped_column(Text)
    created_by: Mapped[str | None] = mapped_column(String(100))


class MetaDataQualityRule(Base):
    __tablename__ = "meta_data_quality_rule"

    id: Mapped[str] = mapped_column(UUID(as_uuid=True), primary_key=True)
    rule_code: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    rule_name: Mapped[str] = mapped_column(String(200), nullable=False)
    entity_name: Mapped[str] = mapped_column(String(100), nullable=False)
    severity: Mapped[str] = mapped_column(String(20), nullable=False)
    rule_expression: Mapped[str] = mapped_column(Text, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class MetaDataQualityResult(Base):
    __tablename__ = "meta_data_quality_result"

    id: Mapped[str] = mapped_column(UUID(as_uuid=True), primary_key=True)
    batch_id: Mapped[str] = mapped_column(
        UUID(as_uuid=True), ForeignKey("meta_ingestion_batch.id"), nullable=False
    )
    rule_id: Mapped[str] = mapped_column(
        UUID(as_uuid=True), ForeignKey("meta_data_quality_rule.id"), nullable=False
    )
    entity_name: Mapped[str] = mapped_column(String(100), nullable=False)
    failed_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    sample_payload: Mapped[dict | None] = mapped_column(JSONB)
    created_at: Mapped[str] = mapped_column(TIMESTAMP, server_default=func.now(), nullable=False)


class RawYoksisProgram(Base):
    __tablename__ = "raw_yoksis_program"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    batch_id: Mapped[str] = mapped_column(
        UUID(as_uuid=True), ForeignKey("meta_ingestion_batch.id"), nullable=False
    )
    payload: Mapped[dict] = mapped_column(JSONB, nullable=False)
    fetched_at: Mapped[str] = mapped_column(TIMESTAMP, server_default=func.now(), nullable=False)


class RawYoksisStudent(Base):
    __tablename__ = "raw_yoksis_student"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    batch_id: Mapped[str] = mapped_column(
        UUID(as_uuid=True), ForeignKey("meta_ingestion_batch.id"), nullable=False
    )
    payload: Mapped[dict] = mapped_column(JSONB, nullable=False)
    fetched_at: Mapped[str] = mapped_column(TIMESTAMP, server_default=func.now(), nullable=False)


class RawYoksisStaff(Base):
    __tablename__ = "raw_yoksis_staff"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    batch_id: Mapped[str] = mapped_column(
        UUID(as_uuid=True), ForeignKey("meta_ingestion_batch.id"), nullable=False
    )
    payload: Mapped[dict] = mapped_column(JSONB, nullable=False)
    fetched_at: Mapped[str] = mapped_column(TIMESTAMP, server_default=func.now(), nullable=False)


class YoksisFieldMapping(Base):
    __tablename__ = "yoksis_field_mapping"

    id: Mapped[str] = mapped_column(UUID(as_uuid=True), primary_key=True)
    resource_name: Mapped[str] = mapped_column(String(50), nullable=False)
    source_field: Mapped[str] = mapped_column(String(100), nullable=False)
    target_field: Mapped[str] = mapped_column(String(100), nullable=False)
    is_required: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    transform_type: Mapped[str | None] = mapped_column(String(50))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class StgYoksisProgram(Base):
    __tablename__ = "stg_yoksis_program"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    batch_id: Mapped[str] = mapped_column(
        UUID(as_uuid=True), ForeignKey("meta_ingestion_batch.id"), nullable=False
    )
    source_record_id: Mapped[str | None] = mapped_column(String(100))
    program_code: Mapped[str | None] = mapped_column(String(50))
    program_name: Mapped[str | None] = mapped_column(String(200))
    unit_code: Mapped[str | None] = mapped_column(String(50))
    degree_level: Mapped[str | None] = mapped_column(String(30))
    language_code: Mapped[str | None] = mapped_column(String(10))
    education_type: Mapped[str | None] = mapped_column(String(30))
    source_payload: Mapped[dict] = mapped_column(JSONB, nullable=False)
    transform_status: Mapped[str] = mapped_column(String(20), default="parsed", nullable=False)
    transform_message: Mapped[str | None] = mapped_column(Text)
    transformed_at: Mapped[str] = mapped_column(TIMESTAMP, server_default=func.now(), nullable=False)


class StgYoksisStudent(Base):
    __tablename__ = "stg_yoksis_student"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    batch_id: Mapped[str] = mapped_column(
        UUID(as_uuid=True), ForeignKey("meta_ingestion_batch.id"), nullable=False
    )
    source_record_id: Mapped[str | None] = mapped_column(String(100))
    student_no: Mapped[str | None] = mapped_column(String(50))
    program_code: Mapped[str | None] = mapped_column(String(50))
    unit_code: Mapped[str | None] = mapped_column(String(50))
    gender: Mapped[str | None] = mapped_column(String(20))
    nationality_code: Mapped[str | None] = mapped_column(String(10))
    scholarship_type: Mapped[str | None] = mapped_column(String(50))
    scholarship_rate: Mapped[float | None] = mapped_column(String(20))
    entry_year: Mapped[int | None] = mapped_column(Integer)
    current_status: Mapped[str | None] = mapped_column(String(30))
    source_payload: Mapped[dict] = mapped_column(JSONB, nullable=False)
    transform_status: Mapped[str] = mapped_column(String(20), default="parsed", nullable=False)
    transform_message: Mapped[str | None] = mapped_column(Text)
    transformed_at: Mapped[str] = mapped_column(TIMESTAMP, server_default=func.now(), nullable=False)


class StgYoksisStaff(Base):
    __tablename__ = "stg_yoksis_staff"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    batch_id: Mapped[str] = mapped_column(
        UUID(as_uuid=True), ForeignKey("meta_ingestion_batch.id"), nullable=False
    )
    source_record_id: Mapped[str | None] = mapped_column(String(100))
    personnel_no: Mapped[str | None] = mapped_column(String(50))
    unit_code: Mapped[str | None] = mapped_column(String(50))
    title_code: Mapped[str | None] = mapped_column(String(30))
    personnel_type: Mapped[str | None] = mapped_column(String(30))
    employment_status: Mapped[str | None] = mapped_column(String(30))
    hire_date_text: Mapped[str | None] = mapped_column(String(30))
    source_payload: Mapped[dict] = mapped_column(JSONB, nullable=False)
    transform_status: Mapped[str] = mapped_column(String(20), default="parsed", nullable=False)
    transform_message: Mapped[str | None] = mapped_column(Text)
    transformed_at: Mapped[str] = mapped_column(TIMESTAMP, server_default=func.now(), nullable=False)


class DataContract(Base):
    __tablename__ = "data_contract"

    id: Mapped[str] = mapped_column(UUID(as_uuid=True), primary_key=True)
    dataset_name: Mapped[str] = mapped_column(String(100), nullable=False)
    source_system: Mapped[str] = mapped_column(String(100), nullable=False)
    version: Mapped[str] = mapped_column(String(20), nullable=False)
    primary_key_fields: Mapped[list | None] = mapped_column(JSONB)
    required_fields: Mapped[list | None] = mapped_column(JSONB)
    optional_fields: Mapped[list | None] = mapped_column(JSONB)
    field_types: Mapped[dict | None] = mapped_column(JSONB)
    code_lists: Mapped[dict | None] = mapped_column(JSONB)
    business_rules: Mapped[list | None] = mapped_column(JSONB)
    owner_unit: Mapped[str | None] = mapped_column(String(200))
    retention_policy: Mapped[str | None] = mapped_column(String(100))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class InstitutionCodeMapping(Base):
    __tablename__ = "institution_code_mapping"

    id: Mapped[str] = mapped_column(UUID(as_uuid=True), primary_key=True)
    source_system: Mapped[str] = mapped_column(String(50), nullable=False)
    source_code: Mapped[str] = mapped_column(String(100), nullable=False)
    source_name: Mapped[str | None] = mapped_column(String(255))
    yok_university_code: Mapped[str | None] = mapped_column(String(50))
    yok_unit_code: Mapped[str | None] = mapped_column(String(50))
    yok_program_code: Mapped[str | None] = mapped_column(String(50))
    obs_code: Mapped[str | None] = mapped_column(String(50))
    normalized_name: Mapped[str | None] = mapped_column(String(255))
    mapping_status: Mapped[str] = mapped_column(String(30), default="mapped", nullable=False)
    created_at: Mapped[str] = mapped_column(TIMESTAMP, server_default=func.now(), nullable=False)


class ManualReviewQueue(Base):
    __tablename__ = "manual_review_queue"

    id: Mapped[str] = mapped_column(UUID(as_uuid=True), primary_key=True)
    batch_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("meta_ingestion_batch.id")
    )
    source_system: Mapped[str] = mapped_column(String(50), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False)
    source_code: Mapped[str | None] = mapped_column(String(100))
    source_name: Mapped[str | None] = mapped_column(String(255))
    suggested_match: Mapped[str | None] = mapped_column(String(255))
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="open", nullable=False)
    payload: Mapped[dict | None] = mapped_column(JSONB)
    created_at: Mapped[str] = mapped_column(TIMESTAMP, server_default=func.now(), nullable=False)


class ReconciliationReport(Base):
    __tablename__ = "reconciliation_report"

    id: Mapped[str] = mapped_column(UUID(as_uuid=True), primary_key=True)
    batch_id: Mapped[str] = mapped_column(
        UUID(as_uuid=True), ForeignKey("meta_ingestion_batch.id"), nullable=False
    )
    dataset_name: Mapped[str] = mapped_column(String(100), nullable=False)
    source_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    loaded_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    diff_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    status: Mapped[str] = mapped_column(String(30), nullable=False)
    details: Mapped[dict | None] = mapped_column(JSONB)
    created_at: Mapped[str] = mapped_column(TIMESTAMP, server_default=func.now(), nullable=False)


class UploadedSourceFile(Base):
    __tablename__ = "uploaded_source_file"

    id: Mapped[str] = mapped_column(UUID(as_uuid=True), primary_key=True)
    batch_id: Mapped[str] = mapped_column(
        UUID(as_uuid=True), ForeignKey("meta_ingestion_batch.id"), nullable=False
    )
    source_code: Mapped[str] = mapped_column(String(50), nullable=False)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_type: Mapped[str | None] = mapped_column(String(50))
    period_label: Mapped[str | None] = mapped_column(String(50))
    storage_path: Mapped[str] = mapped_column(String(500), nullable=False)
    sha256_hash: Mapped[str] = mapped_column(String(128), nullable=False)
    file_size_bytes: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    row_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[str] = mapped_column(TIMESTAMP, server_default=func.now(), nullable=False)
