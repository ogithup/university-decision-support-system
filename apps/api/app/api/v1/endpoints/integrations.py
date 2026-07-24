from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.repositories.admin_repository import AdminRepository
from app.schemas.integration import (
    ConnectivityCheckResponse,
    IntegrationRunRequest,
    IntegrationRunResponse,
    SourceInfo,
)
from app.schemas.integration_admin import (
    BatchStatusResponse,
    DataContractResponse,
    FileUploadResponse,
    ManualReviewResponse,
    ReconciliationResponse,
)
from app.services.integrations.admin import IntegrationAdminService
from app.services.integrations.file_upload import FileUploadIntegrationService
from app.services.integrations.yoksis import YoksisIntegrationService


router = APIRouter()


@router.get("/sources", response_model=list[SourceInfo])
def list_sources() -> list[SourceInfo]:
    return [
        SourceInfo(
            source_code="yoksis_programs",
            source_name="YOKSIS Program Data",
            source_type="api_or_file",
            refresh_frequency="daily",
            is_active=True,
        ),
        SourceInfo(
            source_code="yoksis_students",
            source_name="YOKSIS Student Data",
            source_type="api_or_file",
            refresh_frequency="daily",
            is_active=True,
        ),
        SourceInfo(
            source_code="yoksis_staff",
            source_name="YOKSIS Staff Data",
            source_type="api_or_file",
            refresh_frequency="daily",
            is_active=True,
        ),
        SourceInfo(
            source_code="yok_excel_upload",
            source_name="YOK Excel Upload",
            source_type="file",
            refresh_frequency="manual",
            is_active=True,
        ),
    ]


@router.post("/run/yoksis/{resource}", response_model=IntegrationRunResponse)
def run_yoksis_resource(
    resource: str,
    payload: IntegrationRunRequest,
    db: Session = Depends(get_db),
) -> IntegrationRunResponse:
    service = YoksisIntegrationService(db)
    return service.run(resource=resource, requested_by=payload.requested_by)


@router.get("/yoksis/connectivity", response_model=ConnectivityCheckResponse)
def yoksis_connectivity() -> ConnectivityCheckResponse:
    return ConnectivityCheckResponse(**YoksisIntegrationService.connectivity_status())


@router.get("/data-contracts", response_model=list[DataContractResponse])
def data_contracts(db: Session = Depends(get_db)) -> list[DataContractResponse]:
    service = IntegrationAdminService(AdminRepository(db))
    return service.list_data_contracts()


@router.get("/batches", response_model=list[BatchStatusResponse])
def batches(db: Session = Depends(get_db)) -> list[BatchStatusResponse]:
    service = IntegrationAdminService(AdminRepository(db))
    return service.list_batches()


@router.get("/batches/{batch_id}", response_model=BatchStatusResponse)
def batch_detail(batch_id: str, db: Session = Depends(get_db)) -> BatchStatusResponse:
    service = IntegrationAdminService(AdminRepository(db))
    batch = service.get_batch(batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    return batch


@router.get("/manual-review", response_model=list[ManualReviewResponse])
def manual_review(db: Session = Depends(get_db)) -> list[ManualReviewResponse]:
    service = IntegrationAdminService(AdminRepository(db))
    return service.list_manual_review_items()


@router.get("/reconciliation/latest", response_model=ReconciliationResponse | None)
def reconciliation_latest(db: Session = Depends(get_db)) -> ReconciliationResponse | None:
    service = IntegrationAdminService(AdminRepository(db))
    return service.latest_reconciliation()


@router.post("/upload", response_model=FileUploadResponse)
async def upload_source_file(
    source_code: str = Form(...),
    requested_by: str = Form(...),
    period_label: str | None = Form(default=None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> FileUploadResponse:
    service = FileUploadIntegrationService(db)
    try:
        return await service.upload_file(
            source_code=source_code,
            upload=file,
            requested_by=requested_by,
            period_label=period_label,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
