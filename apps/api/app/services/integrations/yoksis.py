from collections.abc import Sequence
import httpx
from sqlalchemy.orm import Session

from app.core.config import settings
from app.schemas.integration import IntegrationRunResponse
from app.repositories.integration_repository import IntegrationRepository
from app.services.integrations.base import IntegrationResult
from app.services.integrations.audit import run_required_field_audit
from app.services.integrations.parser import parse_records
from app.services.integrations.warehouse import YoksisWarehouseService


class YoksisIntegrationService:
    """
    Real implementation should authenticate against the institution's official
    YOKSIS access channel, fetch the payload, persist a raw batch, and trigger
    staging transforms. This skeleton keeps the contract stable for that step.
    """

    supported_resources = {"programs", "students", "staff"}

    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = IntegrationRepository(db)
        self.warehouse_service = YoksisWarehouseService(db)

    def run(self, resource: str, requested_by: str) -> IntegrationRunResponse:
        if resource not in self.supported_resources:
            result = IntegrationResult(
                source_code="yoksis",
                resource=resource,
                status="failed",
                message="Unsupported YOKSIS resource.",
            )
        else:
            result = self._ingest_resource(resource=resource, requested_by=requested_by)

        return IntegrationRunResponse(**result.__dict__)

    def _ingest_resource(self, resource: str, requested_by: str) -> IntegrationResult:
        source = self.repo.get_source(f"yoksis_{resource}")
        if not source:
            return IntegrationResult(
                source_code="yoksis",
                resource=resource,
                status="failed",
                message=f"Source metadata not found for yoksis_{resource}.",
            )

        batch = self.repo.create_batch(source_id=source.id, requested_by=requested_by)
        self.db.commit()
        self.db.refresh(batch)

        try:
            records = self._request_resource(resource=resource)
            checksum = self.repo.compute_checksum(records)
            raw_count = self.repo.persist_raw_records(resource=resource, batch_id=batch.id, records=records)
            mappings = self.repo.get_field_mappings(resource)
            parsed_records = parse_records(
                resource=resource,
                batch_id=batch.id,
                records=records,
                mappings=mappings,
            )
            staging_count = self.repo.persist_staging_records(
                resource=resource,
                rows=[parsed.row for parsed in parsed_records],
            )
            quality_issue_count = run_required_field_audit(
                self.repo,
                batch_id=batch.id,
                resource=resource,
                parsed_rows=[parsed.row for parsed in parsed_records],
            )
            warehouse_upsert_count = self.warehouse_service.upsert_from_batch(
                resource=resource,
                batch_id=str(batch.id),
            )
            self.repo.set_batch_result(
                batch,
                status="success" if quality_issue_count == 0 else "partial",
                record_count=raw_count,
                checksum=checksum,
            )
            self.db.commit()
        except Exception as exc:
            self.db.rollback()
            existing_batch = self.repo.get_batch(str(batch.id))
            if existing_batch:
                self.repo.set_batch_result(
                    existing_batch,
                    status="failed",
                    record_count=0,
                    error_message=str(exc),
                )
                self.db.commit()
            return IntegrationResult(
                source_code="yoksis",
                resource=resource,
                status="failed",
                message=f"YOKSIS ingestion failed: {exc}",
                batch_id=str(batch.id),
            )

        return IntegrationResult(
            source_code="yoksis",
            resource=resource,
            status="success" if quality_issue_count == 0 else "partial",
            message=f"YOKSIS {resource} ingestion completed.",
            batch_id=str(batch.id),
            raw_record_count=raw_count,
            staging_record_count=staging_count,
            quality_issue_count=quality_issue_count,
            warehouse_upsert_count=warehouse_upsert_count,
        )

    def _request_resource(self, resource: str) -> list[dict]:
        if not settings.yoksis_base_url:
            return self._fallback_sample_payload(resource)

        headers = {}
        auth = None

        if settings.yoksis_api_key:
            headers["Authorization"] = f"Bearer {settings.yoksis_api_key}"
        elif settings.yoksis_username and settings.yoksis_password:
            auth = (settings.yoksis_username, settings.yoksis_password)

        endpoint = f"{settings.yoksis_base_url.rstrip('/')}/{resource}"

        try:
            with httpx.Client(timeout=30.0) as client:
                response = client.get(endpoint, headers=headers, auth=auth)
                response.raise_for_status()
                payload = response.json()
        except httpx.HTTPError as exc:
            raise RuntimeError(f"YOKSIS request failed: {exc}") from exc

        return self._normalize_payload(payload)

    @staticmethod
    def _normalize_payload(payload: object) -> list[dict]:
        if isinstance(payload, list):
            return [item for item in payload if isinstance(item, dict)]
        if isinstance(payload, dict):
            for key in ("items", "data", "results", "records"):
                value = payload.get(key)
                if isinstance(value, list):
                    return [item for item in value if isinstance(item, dict)]
            return [payload]
        raise RuntimeError("Unsupported YOKSIS payload structure.")

    @staticmethod
    def _fallback_sample_payload(resource: str) -> list[dict]:
        samples: dict[str, Sequence[dict]] = {
            "programs": [
                {
                    "id": "program-001",
                    "programCode": "CENG",
                    "programName": "Bilgisayar Muhendisligi",
                    "unitCode": "MMF",
                    "degreeLevel": "bachelor",
                    "languageCode": "TR",
                    "educationType": "day",
                }
            ],
            "students": [
                {
                    "id": "student-001",
                    "studentNo": "2026001",
                    "programCode": "CENG",
                    "unitCode": "MMF",
                    "gender": "M",
                    "nationalityCode": "INT",
                    "scholarshipType": "partial",
                    "scholarshipRate": 25,
                    "entryYear": 2026,
                    "currentStatus": "active",
                }
            ],
            "staff": [
                {
                    "id": "staff-001",
                    "personnelNo": "A102",
                    "unitCode": "MMF",
                    "titleCode": "prof",
                    "personnelType": "academic",
                    "employmentStatus": "active",
                    "hireDate": "2021-09-01",
                }
            ],
        }
        return list(samples[resource])

    @staticmethod
    def connectivity_status() -> dict[str, str | None]:
        auth_type = None
        if settings.yoksis_api_key:
            auth_type = "api_key"
        elif settings.yoksis_username and settings.yoksis_password:
            auth_type = "basic_auth"

        if settings.yoksis_base_url and auth_type:
            return {
                "status": "configured",
                "mode": "live",
                "endpoint": settings.yoksis_base_url,
                "auth_type": auth_type,
                "detail": "Live YOKSIS configuration is present.",
            }

        return {
            "status": "not_configured",
            "mode": "sample_payload",
            "endpoint": settings.yoksis_base_url,
            "auth_type": auth_type,
            "detail": "Fallback sample payload mode is active.",
        }
