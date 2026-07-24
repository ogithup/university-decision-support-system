export type ChartDatum = {
  label: string;
  value: number;
};

export type DashboardKpi = {
  code: string;
  label: string;
  value: string;
  delta: string;
  status: string;
};

export type AcademicPerformanceMetric = {
  code: string;
  label: string;
  value: string;
  delta: string;
  status: string;
  icon: string;
  sparkline: ChartDatum[];
};

export type AcademicPerformanceCenterResponse = {
  period: string;
  faculty: string;
  source_mode: string;
  last_updated: string;
  metrics: AcademicPerformanceMetric[];
};

export type InsightTrendPoint = {
  label: string;
  bar_value: number;
  line_value: number;
  delta_value: number;
};

export type InsightChangeItem = {
  label: string;
  value: string;
  direction: string;
  note: string;
};

export type InsightSourceContext = {
  active_channel: string;
  available_channels: string[];
  refresh_policy: string;
  provenance_note: string;
};

export type InsightDetailResponse = {
  insight_id: string;
  title: string;
  subtitle: string;
  status: string;
  source_mode: string;
  source_context: InsightSourceContext;
  headline_value: string;
  headline_delta: string;
  summary: string;
  combo_trend: InsightTrendPoint[];
  change_breakdown: InsightChangeItem[];
  diagnostics: InsightChangeItem[];
  alerts: AlertItem[];
};

export type SourceHealth = {
  source: string;
  status: string;
  freshness: string;
  detail: string;
};

export type AlertItem = {
  id: string;
  level: string;
  title: string;
  owner: string;
  action: string;
};

export type LeaderboardItem = {
  academic_id: string;
  name: string;
  title: string;
  department: string;
  score: number;
  change: number;
};

export type ProgramHealthItem = {
  program_code: string;
  program_name: string;
  sustainability_status: string;
  demand_index: number;
  occupancy_rate: number;
  graduation_rate: number;
  employment_outlook: number;
  financial_balance: number;
  strategic_alignment: number;
  action_label: string;
};

export type StrategicGoalItem = {
  code: string;
  title: string;
  current_value: string;
  target_value: string;
  progress_pct: number;
  risk_level: string;
  owner: string;
};

export type ReadinessScoreItem = {
  framework: string;
  score: number;
  data_readiness_pct: number;
  benchmark_gap: number;
  note: string;
};

export type ScenarioTemplateItem = {
  scenario_type: string;
  title: string;
  description: string;
  key_driver: string;
  expected_focus: string;
};

export type RiskMatrixItem = {
  risk_id: string;
  category: string;
  title: string;
  probability: number;
  impact: number;
  owner: string;
  mitigation: string;
};

export type DashboardSummaryResponse = {
  academic_year: string;
  selected_faculty: string;
  selected_department: string;
  last_sync: string;
  critical_alert_count: number;
  kpis: DashboardKpi[];
  student_metrics: DashboardKpi[];
  finance_metrics: DashboardKpi[];
  capacity_metrics: DashboardKpi[];
  publication_trend: ChartDatum[];
  student_trend: ChartDatum[];
  occupancy_trend: ChartDatum[];
  graduation_trend: ChartDatum[];
  faculty_scores: ChartDatum[];
  readiness_scores: ChartDatum[];
  capacity_utilization: ChartDatum[];
  benchmark_comparison: ChartDatum[];
  work_distribution: ChartDatum[];
  top_performers: LeaderboardItem[];
  program_health: ProgramHealthItem[];
  strategic_goals: StrategicGoalItem[];
  readiness_details: ReadinessScoreItem[];
  scenario_templates: ScenarioTemplateItem[];
  risk_matrix: RiskMatrixItem[];
  source_health: SourceHealth[];
  alerts: AlertItem[];
  assistant_prompts: string[];
};

export type FinanceKpi = {
  label: string;
  value: string;
  delta: string;
  status: string;
};

export type FinanceSummaryResponse = {
  academic_year: string;
  kpis: FinanceKpi[];
  revenue_mix: ChartDatum[];
  expense_mix: ChartDatum[];
  budget_variance: ChartDatum[];
};

export type ScoreDimensions = {
  research_productivity: number;
  scientific_impact: number;
  projects_and_innovation: number;
  education_contribution: number;
  collaboration: number;
  institutional_contribution: number;
  continuity: number;
};

export type AcademicScore = {
  academic_id: string;
  name: string;
  faculty: string;
  department: string;
  period: string;
  overall_score: number;
  previous_score: number;
  change: number;
  dimensions: ScoreDimensions;
  data_completeness: number;
  risk_level: string;
  calculated_at: string;
  disclaimer: string;
};

export type AcademicDetail = {
  academic_id: string;
  name: string;
  title: string;
  faculty_id: string;
  faculty: string;
  department_id: string;
  department: string;
  academic_year: string;
  bio: string;
  expertise: string[];
  publication_count: number;
  citation_count: number;
  project_count: number;
  international_collaboration_rate: number;
  teaching_load: number;
  advisory_count: number;
  score: AcademicScore;
};

export type AcademicWork = {
  work_id: string;
  academic_id: string;
  title: string;
  work_type: string;
  year: number;
  impact_score: number;
  collaboration_scope: string;
};

export type AssistantAnalyzeResponse = {
  workspace_id: string;
  title: string;
  summary: string;
  confidence: string;
  workspace_schema: {
    title: string;
    filters: string[];
    widgets: Array<{ type: string; metric: string }>;
  };
};

export type WorkspaceWidget = {
  type: string;
  title: string;
  metric: string;
  description: string;
};

export type WorkspaceResponse = {
  workspace_id: string;
  title: string;
  summary: string;
  academic_year: string;
  filters: Record<string, string | null>;
  assumptions: string[];
  widgets: WorkspaceWidget[];
  narrative: string[];
  risks: AlertItem[];
};

export type ScenarioRunRequest = {
  scenario_type: string;
  faculty_id?: string;
  department_id?: string;
  academic_year?: string;
  staff_growth_pct?: number;
  budget_change_pct?: number;
  scholarship_change_pct?: number;
};

export type ScenarioRunResponse = {
  scenario_id: string;
  title: string;
  summary: string;
  baseline: DashboardKpi[];
  projected: DashboardKpi[];
  risks: AlertItem[];
};
