from fastapi import APIRouter, HTTPException

from app.schemas.academic import OrganizationPerformance
from app.services.mock_university import get_department_performance, get_faculty_performance


router = APIRouter()


@router.get("/departments/{department_id}/performance", response_model=OrganizationPerformance)
def department_performance(department_id: str) -> OrganizationPerformance:
    performance = get_department_performance(department_id)
    if not performance:
        raise HTTPException(status_code=404, detail="Department not found")
    return performance


@router.get("/faculties/{faculty_id}/performance", response_model=OrganizationPerformance)
def faculty_performance(faculty_id: str) -> OrganizationPerformance:
    performance = get_faculty_performance(faculty_id)
    if not performance:
        raise HTTPException(status_code=404, detail="Faculty not found")
    return performance

