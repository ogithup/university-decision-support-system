from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.schemas.academic import (
    AcademicPerformanceCenterResponse,
    AlertItem,
    AssistantAnalyzeRequest,
    AssistantAnalyzeResponse,
    DashboardSummaryResponse,
    FinanceSummaryResponse,
    InsightDetailResponse,
    ScenarioRunRequest,
    ScenarioRunResponse,
    WorkspaceResponse,
)
from app.services.dashboard.academic_performance import get_academic_performance_center
from app.services.dashboard.insight_details import get_dashboard_insight_detail
from app.services.mock_university import (
    analyze_prompt,
    get_alerts,
    get_dashboard_summary,
    get_finance_summary,
    get_workspace,
    run_scenario,
)


router = APIRouter()


@router.get("/dashboard/summary", response_model=DashboardSummaryResponse)
def dashboard_summary() -> DashboardSummaryResponse:
    return get_dashboard_summary()


@router.get("/dashboard/academic-performance-center", response_model=AcademicPerformanceCenterResponse)
def academic_performance_center(db: Session = Depends(get_db)) -> AcademicPerformanceCenterResponse:
    return get_academic_performance_center(db)


@router.get("/dashboard/insights/{insight_id}", response_model=InsightDetailResponse)
def dashboard_insight_detail(insight_id: str, db: Session = Depends(get_db)) -> InsightDetailResponse:
    return get_dashboard_insight_detail(insight_id, db)


@router.get("/finance/summary", response_model=FinanceSummaryResponse)
def finance_summary() -> FinanceSummaryResponse:
    return get_finance_summary()


@router.get("/alerts", response_model=list[AlertItem])
def alerts() -> list[AlertItem]:
    return get_alerts()


@router.post("/scenarios/run", response_model=ScenarioRunResponse)
def scenarios(request: ScenarioRunRequest) -> ScenarioRunResponse:
    return run_scenario(request)


@router.post("/assistant/analyze", response_model=AssistantAnalyzeResponse)
def assistant_analyze(request: AssistantAnalyzeRequest) -> AssistantAnalyzeResponse:
    return analyze_prompt(
        prompt=request.prompt,
        academic_year=request.academic_year,
        faculty_id=request.faculty_id,
        department_id=request.department_id,
    )


@router.get("/workspaces/{workspace_id}", response_model=WorkspaceResponse)
def workspace_detail(workspace_id: str) -> WorkspaceResponse:
    workspace = get_workspace(workspace_id)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return workspace
