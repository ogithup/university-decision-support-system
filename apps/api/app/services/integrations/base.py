from dataclasses import dataclass


@dataclass
class IntegrationResult:
    source_code: str
    resource: str
    status: str
    message: str
    batch_id: str | None = None
    raw_record_count: int = 0
    staging_record_count: int = 0
    quality_issue_count: int = 0
    warehouse_upsert_count: int = 0
