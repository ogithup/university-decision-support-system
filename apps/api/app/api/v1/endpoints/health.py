from fastapi import APIRouter
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.services.integrations.yoksis import YoksisIntegrationService
from fastapi import Depends


router = APIRouter()


@router.get("/health")
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/health/ready")
def readiness(db: Session = Depends(get_db)) -> dict[str, str]:
    db.execute(text("select 1"))
    integration_status = YoksisIntegrationService.connectivity_status()
    return {
        "status": "ready",
        "database": "ok",
        "yoksis_mode": str(integration_status["mode"]),
    }
