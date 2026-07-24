import {
  AcademicDetail,
  AcademicPerformanceCenterResponse,
  AcademicWork,
  AssistantAnalyzeResponse,
  DashboardSummaryResponse,
  FinanceSummaryResponse,
  InsightDetailResponse,
  ScenarioRunRequest,
  ScenarioRunResponse,
  WorkspaceResponse,
} from "../types/university";


const defaultBaseUrl = "http://localhost:8000/api/v1";


function getApiBaseUrl() {
  return process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || defaultBaseUrl;
}


async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Request failed for ${path} with ${response.status}`);
  }

  return response.json() as Promise<T>;
}


export async function fetchDashboardSummary(): Promise<DashboardSummaryResponse> {
  return getJson<DashboardSummaryResponse>("/dashboard/summary");
}


export async function fetchAcademicPerformanceCenter(): Promise<AcademicPerformanceCenterResponse> {
  return getJson<AcademicPerformanceCenterResponse>("/dashboard/academic-performance-center");
}


export async function fetchDashboardInsight(insightId: string): Promise<InsightDetailResponse> {
  return getJson<InsightDetailResponse>(`/dashboard/insights/${insightId}`);
}


export async function fetchFinanceSummary(): Promise<FinanceSummaryResponse> {
  return getJson<FinanceSummaryResponse>("/finance/summary");
}


export async function fetchAcademicDetail(academicId: string): Promise<AcademicDetail> {
  return getJson<AcademicDetail>(`/academics/${academicId}`);
}


export async function fetchAcademicWorks(academicId: string): Promise<AcademicWork[]> {
  return getJson<AcademicWork[]>(`/academics/${academicId}/works`);
}


export async function fetchWorkspace(workspaceId: string): Promise<WorkspaceResponse> {
  return getJson<WorkspaceResponse>(`/workspaces/${workspaceId}`);
}


export async function createAnalysisWorkspace(prompt: string): Promise<AssistantAnalyzeResponse> {
  const response = await fetch(`${getApiBaseUrl()}/assistant/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      academic_year: "2025-2026",
      faculty_id: "FAC-ENG",
    }),
  });

  if (!response.ok) {
    throw new Error(`Assistant analyze failed with ${response.status}`);
  }

  return response.json() as Promise<AssistantAnalyzeResponse>;
}


export async function runScenario(request: ScenarioRunRequest): Promise<ScenarioRunResponse> {
  const response = await fetch(`${getApiBaseUrl()}/scenarios/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      academic_year: "2025-2026",
      ...request,
    }),
  });

  if (!response.ok) {
    throw new Error(`Scenario run failed with ${response.status}`);
  }

  return response.json() as Promise<ScenarioRunResponse>;
}
