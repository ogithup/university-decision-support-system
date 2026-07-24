from __future__ import annotations

from pydantic import BaseModel


class ChartDatum(BaseModel):
    label: str
    value: float


class DashboardKpi(BaseModel):
    code: str
    label: str
    value: str
    delta: str
    status: str


class AcademicPerformanceMetric(BaseModel):
    code: str
    label: str
    value: str
    delta: str
    status: str
    icon: str
    sparkline: list["ChartDatum"]


class AcademicPerformanceCenterResponse(BaseModel):
    period: str
    faculty: str
    source_mode: str
    last_updated: str
    metrics: list[AcademicPerformanceMetric]


class InsightTrendPoint(BaseModel):
    label: str
    bar_value: float
    line_value: float
    delta_value: float


class InsightChangeItem(BaseModel):
    label: str
    value: str
    direction: str
    note: str


class InsightSourceContext(BaseModel):
    active_channel: str
    available_channels: list[str]
    refresh_policy: str
    provenance_note: str


class InsightDetailResponse(BaseModel):
    insight_id: str
    title: str
    subtitle: str
    status: str
    source_mode: str
    source_context: InsightSourceContext
    headline_value: str
    headline_delta: str
    summary: str
    combo_trend: list[InsightTrendPoint]
    change_breakdown: list[InsightChangeItem]
    diagnostics: list[InsightChangeItem]
    alerts: list[AlertItem]


class SourceHealth(BaseModel):
    source: str
    status: str
    freshness: str
    detail: str


class AlertItem(BaseModel):
    id: str
    level: str
    title: str
    owner: str
    action: str


class LeaderboardItem(BaseModel):
    academic_id: str
    name: str
    title: str
    department: str
    score: float
    change: float


class ProgramHealthItem(BaseModel):
    program_code: str
    program_name: str
    sustainability_status: str
    demand_index: float
    occupancy_rate: float
    graduation_rate: float
    employment_outlook: float
    financial_balance: float
    strategic_alignment: float
    action_label: str


class StrategicGoalItem(BaseModel):
    code: str
    title: str
    current_value: str
    target_value: str
    progress_pct: float
    risk_level: str
    owner: str


class ReadinessScoreItem(BaseModel):
    framework: str
    score: float
    data_readiness_pct: float
    benchmark_gap: float
    note: str


class ScenarioTemplateItem(BaseModel):
    scenario_type: str
    title: str
    description: str
    key_driver: str
    expected_focus: str


class RiskMatrixItem(BaseModel):
    risk_id: str
    category: str
    title: str
    probability: float
    impact: float
    owner: str
    mitigation: str


class AcademicListItem(BaseModel):
    academic_id: str
    name: str
    title: str
    faculty_id: str
    faculty: str
    department_id: str
    department: str
    overall_score: float
    publication_count: int
    citation_count: int
    project_count: int
    data_completeness: float
    risk_level: str


class AcademicWork(BaseModel):
    work_id: str
    academic_id: str
    title: str
    work_type: str
    year: int
    impact_score: float
    collaboration_scope: str


class ScoreDimensions(BaseModel):
    research_productivity: float
    scientific_impact: float
    projects_and_innovation: float
    education_contribution: float
    collaboration: float
    institutional_contribution: float
    continuity: float


class AcademicScore(BaseModel):
    academic_id: str
    name: str
    faculty: str
    department: str
    period: str
    overall_score: float
    previous_score: float
    change: float
    dimensions: ScoreDimensions
    data_completeness: float
    risk_level: str
    calculated_at: str
    disclaimer: str


class AcademicDetail(BaseModel):
    academic_id: str
    name: str
    title: str
    faculty_id: str
    faculty: str
    department_id: str
    department: str
    academic_year: str
    bio: str
    expertise: list[str]
    publication_count: int
    citation_count: int
    project_count: int
    international_collaboration_rate: float
    teaching_load: float
    advisory_count: int
    score: AcademicScore


class OrganizationPerformance(BaseModel):
    entity_id: str
    entity_type: str
    name: str
    academic_year: str
    overall_score: float
    publication_total: int
    citation_total: int
    project_total: int
    average_score: float
    staff_count: int
    trend: list[ChartDatum]
    top_departments: list[ChartDatum]
    risks: list[AlertItem]


class FinanceKpi(BaseModel):
    label: str
    value: str
    delta: str
    status: str


class FinanceSummaryResponse(BaseModel):
    academic_year: str
    kpis: list[FinanceKpi]
    revenue_mix: list[ChartDatum]
    expense_mix: list[ChartDatum]
    budget_variance: list[ChartDatum]


class DashboardSummaryResponse(BaseModel):
    academic_year: str
    selected_faculty: str
    selected_department: str
    last_sync: str
    critical_alert_count: int
    kpis: list[DashboardKpi]
    student_metrics: list[DashboardKpi]
    finance_metrics: list[DashboardKpi]
    capacity_metrics: list[DashboardKpi]
    publication_trend: list[ChartDatum]
    student_trend: list[ChartDatum]
    occupancy_trend: list[ChartDatum]
    graduation_trend: list[ChartDatum]
    faculty_scores: list[ChartDatum]
    readiness_scores: list[ChartDatum]
    capacity_utilization: list[ChartDatum]
    benchmark_comparison: list[ChartDatum]
    work_distribution: list[ChartDatum]
    top_performers: list[LeaderboardItem]
    program_health: list[ProgramHealthItem]
    strategic_goals: list[StrategicGoalItem]
    readiness_details: list[ReadinessScoreItem]
    scenario_templates: list[ScenarioTemplateItem]
    risk_matrix: list[RiskMatrixItem]
    source_health: list[SourceHealth]
    alerts: list[AlertItem]
    assistant_prompts: list[str]


class ScenarioRunRequest(BaseModel):
    scenario_type: str
    faculty_id: str | None = None
    department_id: str | None = None
    academic_year: str = "2025-2026"
    staff_growth_pct: float = 0
    budget_change_pct: float = 0
    scholarship_change_pct: float = 0


class ScenarioRunResponse(BaseModel):
    scenario_id: str
    title: str
    summary: str
    baseline: list[DashboardKpi]
    projected: list[DashboardKpi]
    risks: list[AlertItem]


class AssistantAnalyzeRequest(BaseModel):
    prompt: str
    academic_year: str = "2025-2026"
    faculty_id: str | None = None
    department_id: str | None = None


class WorkspaceWidget(BaseModel):
    type: str
    title: str
    metric: str
    description: str


class AssistantAnalyzeResponse(BaseModel):
    workspace_id: str
    title: str
    summary: str
    confidence: str
    workspace_schema: dict


class WorkspaceResponse(BaseModel):
    workspace_id: str
    title: str
    summary: str
    academic_year: str
    filters: dict
    assumptions: list[str]
    widgets: list[WorkspaceWidget]
    narrative: list[str]
    risks: list[AlertItem]
