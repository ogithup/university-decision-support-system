from fastapi import APIRouter, HTTPException, Query

from app.schemas.academic import AcademicDetail, AcademicListItem, AcademicScore, AcademicWork
from app.services.mock_university import (
    get_academic_detail,
    get_academic_score,
    get_academic_works,
    list_academics,
)


router = APIRouter()


@router.get("/academics", response_model=list[AcademicListItem])
def academics(
    faculty_id: str | None = Query(default=None),
    department_id: str | None = Query(default=None),
) -> list[AcademicListItem]:
    return list_academics(faculty_id=faculty_id, department_id=department_id)


@router.get("/academics/{academic_id}", response_model=AcademicDetail)
def academic_detail(academic_id: str) -> AcademicDetail:
    detail = get_academic_detail(academic_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Academic not found")
    return detail


@router.get("/academics/{academic_id}/works", response_model=list[AcademicWork])
def academic_works(academic_id: str) -> list[AcademicWork]:
    return get_academic_works(academic_id)


@router.get("/academics/{academic_id}/scores", response_model=AcademicScore)
def academic_scores(academic_id: str) -> AcademicScore:
    score = get_academic_score(academic_id)
    if not score:
        raise HTTPException(status_code=404, detail="Academic score not found")
    return score

