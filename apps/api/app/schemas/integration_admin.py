from pydantic import BaseModel


class DataContractResponse(BaseModel):
    dataset_name: str
    source_system: str
    version: str
    primary_key_fields: list[str] | None = None
    required_fields: list[str] | None = None
    optional_fields: list[str] | None = None
    field_types: dict | None = None
    business_rules: list[str] | None = None
    owner_unit: str | None = None
    retention_policy: str | None = None


class BatchStatusResponse(BaseModel):
    batch_id: str
    source_code: str | None = None
    status: str
    record_count: int
    checksum: str | None = None
    started_at: str | None = None
    finished_at: str | None = None
    error_message: str | None = None


class ManualReviewResponse(BaseModel):
    id: str
    entity_type: str
    source_code: str | None = None
    source_name: str | None = None
    suggested_match: str | None = None
    reason: str
    status: str


class ReconciliationResponse(BaseModel):
    batch_id: str
    dataset_name: str
    source_count: int
    loaded_count: int
    diff_count: int
    status: str
    details: dict | None = None


class FileUploadResponse(BaseModel):
    batch_id: str
    source_code: str
    file_name: str
    sha256_hash: str
    file_size_bytes: int
    status: str
    message: str
