from pydantic import BaseModel


class SourceInfo(BaseModel):
    source_code: str
    source_name: str
    source_type: str
    refresh_frequency: str
    is_active: bool


class IntegrationRunRequest(BaseModel):
    requested_by: str


class IntegrationRunResponse(BaseModel):
    source_code: str
    resource: str
    status: str
    message: str
    batch_id: str | None = None
    raw_record_count: int = 0
    staging_record_count: int = 0
    quality_issue_count: int = 0
    warehouse_upsert_count: int = 0


class ConnectivityCheckResponse(BaseModel):
    status: str
    mode: str
    endpoint: str | None = None
    auth_type: str | None = None
    detail: str
