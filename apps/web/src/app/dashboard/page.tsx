import { fetchAcademicPerformanceCenter, fetchDashboardSummary, fetchFinanceSummary } from "../../lib/api";
import {
  AcademicPerformanceCenterResponse,
  DashboardSummaryResponse,
  FinanceSummaryResponse,
} from "../../types/university";
import { DashboardClient } from "./dashboard-client";


const fallbackSummary: DashboardSummaryResponse = {
  academic_year: "2025-2026",
  selected_faculty: "Tum Fakulteler",
  selected_department: "Tum Bolumler",
  last_sync: "2026-07-24T10:45:00+03:00",
  critical_alert_count: 2,
  kpis: [],
  student_metrics: [],
  finance_metrics: [],
  capacity_metrics: [],
  publication_trend: [],
  student_trend: [],
  occupancy_trend: [],
  graduation_trend: [],
  faculty_scores: [],
  readiness_scores: [],
  capacity_utilization: [],
  benchmark_comparison: [],
  work_distribution: [],
  top_performers: [],
  program_health: [],
  strategic_goals: [],
  readiness_details: [],
  scenario_templates: [],
  risk_matrix: [],
  source_health: [],
  alerts: [],
  assistant_prompts: [],
};

const fallbackFinance: FinanceSummaryResponse = {
  academic_year: "2025-2026",
  kpis: [],
  revenue_mix: [],
  expense_mix: [],
  budget_variance: [],
};

const fallbackAcademicCenter: AcademicPerformanceCenterResponse = {
  period: "2025-2026",
  faculty: "Tumu",
  source_mode: "mock_fallback",
  last_updated: "2026-07-24T10:45:00+03:00",
  metrics: [],
};


export default async function DashboardPage() {
  const [summary, finance, academicCenter] = await Promise.all([
    fetchDashboardSummary().catch(() => fallbackSummary),
    fetchFinanceSummary().catch(() => fallbackFinance),
    fetchAcademicPerformanceCenter().catch(() => fallbackAcademicCenter),
  ]);

  return <DashboardClient summary={summary} finance={finance} academicCenter={academicCenter} />;
}
