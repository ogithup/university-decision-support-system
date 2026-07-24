from app.repositories.admin_repository import AdminRepository
from app.schemas.integration_admin import (
    BatchStatusResponse,
    DataContractResponse,
    ManualReviewResponse,
    ReconciliationResponse,
)


class IntegrationAdminService:
    def __init__(self, repo: AdminRepository) -> None:
        self.repo = repo

    def list_data_contracts(self) -> list[DataContractResponse]:
        return [
            DataContractResponse(
                dataset_name=item.dataset_name,
                source_system=item.source_system,
                version=item.version,
                primary_key_fields=item.primary_key_fields,
                required_fields=item.required_fields,
                optional_fields=item.optional_fields,
                field_types=item.field_types,
                business_rules=item.business_rules,
                owner_unit=item.owner_unit,
                retention_policy=item.retention_policy,
            )
            for item in self.repo.list_data_contracts()
        ]

    def list_batches(self) -> list[BatchStatusResponse]:
        return [
            BatchStatusResponse(
                batch_id=str(batch.id),
                source_code=source_code,
                status=batch.status,
                record_count=batch.record_count,
                checksum=batch.checksum,
                started_at=str(batch.started_at) if batch.started_at else None,
                finished_at=str(batch.finished_at) if batch.finished_at else None,
                error_message=batch.error_message,
            )
            for batch, source_code in self.repo.list_batches()
        ]

    def get_batch(self, batch_id: str) -> BatchStatusResponse | None:
        row = self.repo.get_batch(batch_id)
        if not row:
            return None
        batch, source_code = row
        return BatchStatusResponse(
            batch_id=str(batch.id),
            source_code=source_code,
            status=batch.status,
            record_count=batch.record_count,
            checksum=batch.checksum,
            started_at=str(batch.started_at) if batch.started_at else None,
            finished_at=str(batch.finished_at) if batch.finished_at else None,
            error_message=batch.error_message,
        )

    def list_manual_review_items(self) -> list[ManualReviewResponse]:
        return [
            ManualReviewResponse(
                id=str(item.id),
                entity_type=item.entity_type,
                source_code=item.source_code,
                source_name=item.source_name,
                suggested_match=item.suggested_match,
                reason=item.reason,
                status=item.status,
            )
            for item in self.repo.list_manual_review_items()
        ]

    def latest_reconciliation(self) -> ReconciliationResponse | None:
        report = self.repo.latest_reconciliation()
        if not report:
            return None
        return ReconciliationResponse(
            batch_id=str(report.batch_id),
            dataset_name=report.dataset_name,
            source_count=report.source_count,
            loaded_count=report.loaded_count,
            diff_count=report.diff_count,
            status=report.status,
            details=report.details,
        )
