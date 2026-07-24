from fastapi import APIRouter
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.dashboard import DashboardCard, ExecutiveDashboardResponse
from app.services.dashboard.queries import get_executive_dashboard_from_db
from fastapi import Depends


router = APIRouter()


@router.get("/executive", response_model=ExecutiveDashboardResponse)
def executive_dashboard(db: Session = Depends(get_db)) -> ExecutiveDashboardResponse:
    return get_executive_dashboard_from_db(db)


@router.get("/cockpit", response_model=list[DashboardCard])
def cockpit_cards(db: Session = Depends(get_db)) -> list[DashboardCard]:
    return get_executive_dashboard_from_db(db).cards
