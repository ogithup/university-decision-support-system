import hashlib
from datetime import datetime, UTC
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.meta import (
    MetaDataQualityResult,
    MetaDataQualityRule,
    MetaDataSource,
    MetaIngestionBatch,
    RawYoksisProgram,
    RawYoksisStaff,
    RawYoksisStudent,
    StgYoksisProgram,
    StgYoksisStaff,
    StgYoksisStudent,
    YoksisFieldMapping,
)


RAW_MODEL_BY_RESOURCE = {
    "programs": RawYoksisProgram,
    "students": RawYoksisStudent,
    "staff": RawYoksisStaff,
}

STAGING_MODEL_BY_RESOURCE = {
    "programs": StgYoksisProgram,
    "students": StgYoksisStudent,
    "staff": StgYoksisStaff,
}


class IntegrationRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_source(self, source_code: str) -> MetaDataSource | None:
        stmt = select(MetaDataSource).where(MetaDataSource.source_code == source_code)
        return self.db.execute(stmt).scalar_one_or_none()

    def create_batch(self, source_id: str, requested_by: str) -> MetaIngestionBatch:
        batch = MetaIngestionBatch(
            id=uuid4(),
            source_id=source_id,
            batch_code=f"YOKSIS-{datetime.now(UTC).strftime('%Y%m%d%H%M%S')}",
            status="running",
            created_by=requested_by,
        )
        self.db.add(batch)
        self.db.flush()
        return batch

    def set_batch_result(
        self,
        batch: MetaIngestionBatch,
        *,
        status: str,
        record_count: int,
        checksum: str | None = None,
        error_message: str | None = None,
    ) -> None:
        batch.status = status
        batch.record_count = record_count
        batch.checksum = checksum
        batch.error_message = error_message
        batch.finished_at = datetime.now(UTC)
        self.db.flush()

    def get_batch(self, batch_id: str) -> MetaIngestionBatch | None:
        stmt = select(MetaIngestionBatch).where(MetaIngestionBatch.id == batch_id)
        return self.db.execute(stmt).scalar_one_or_none()

    def persist_raw_records(self, resource: str, batch_id: str, records: list[dict]) -> int:
        model = RAW_MODEL_BY_RESOURCE[resource]
        for record in records:
            self.db.add(model(batch_id=batch_id, payload=record))
        self.db.flush()
        return len(records)

    def persist_staging_records(self, resource: str, rows: list[dict]) -> int:
        model = STAGING_MODEL_BY_RESOURCE[resource]
        for row in rows:
            self.db.add(model(**row))
        self.db.flush()
        return len(rows)

    def get_field_mappings(self, resource: str) -> list[YoksisFieldMapping]:
        stmt = (
            select(YoksisFieldMapping)
            .where(YoksisFieldMapping.resource_name == resource)
            .where(YoksisFieldMapping.is_active.is_(True))
        )
        return list(self.db.execute(stmt).scalars().all())

    def get_quality_rules(self, entity_name: str) -> list[MetaDataQualityRule]:
        stmt = (
            select(MetaDataQualityRule)
            .where(MetaDataQualityRule.entity_name == entity_name)
            .where(MetaDataQualityRule.is_active.is_(True))
        )
        return list(self.db.execute(stmt).scalars().all())

    def create_quality_result(
        self,
        *,
        batch_id: str,
        rule_id: str,
        entity_name: str,
        failed_count: int,
        status: str,
        sample_payload: dict | None,
    ) -> None:
        self.db.add(
            MetaDataQualityResult(
                id=uuid4(),
                batch_id=batch_id,
                rule_id=rule_id,
                entity_name=entity_name,
                failed_count=failed_count,
                status=status,
                sample_payload=sample_payload,
            )
        )
        self.db.flush()

    @staticmethod
    def compute_checksum(records: list[dict]) -> str:
        payload = repr(records).encode("utf-8")
        return hashlib.sha256(payload).hexdigest()
