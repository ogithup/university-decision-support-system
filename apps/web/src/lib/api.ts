import {
  AcademicDetail,
  AcademicDataStatus,
  AcademicListItem,
  AcademicPerformanceCenterResponse,
  AcademicWork,
  AssistantAnalyzeResponse,
  CollectionJob,
  CollectionJobItem,
  DashboardSummaryResponse,
  FinanceSummaryResponse,
  InsightDetailResponse,
  OrganizationPerformance,
  ProviderHealth,
  ScenarioRunRequest,
  ScenarioRunResponse,
  WorkspaceResponse,
} from "../types/university";

export type IntegrationActionResponse = {
  status: string;
  message: string;
  batch_id?: string | null;
  source_code?: string;
  file_name?: string;
  raw_record_count?: number;
  staging_record_count?: number;
  warehouse_upsert_count?: number;
};

const defaultBaseUrl = "http://localhost:8000/api/v1";


function normalizeBrowserBaseUrl(baseUrl: string) {
  try {
    const url = new URL(baseUrl);
    if (url.hostname === "api") {
      url.hostname = "localhost";
    }
    return url.toString().replace(/\/$/, "");
  } catch {
    return baseUrl.replace(/\/$/, "");
  }
}


function getApiBaseUrl() {
  if (typeof window !== "undefined") {
    const publicBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || defaultBaseUrl;
    return normalizeBrowserBaseUrl(publicBaseUrl);
  }

  return (process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || defaultBaseUrl).replace(/\/$/, "");
}


async function getJson<T>(path: string): Promise<T> {
  const primaryBaseUrl = getApiBaseUrl();
  const candidates = [primaryBaseUrl];
  if (primaryBaseUrl.includes("api:8000")) {
    candidates.push(primaryBaseUrl.replace("api:8000", "localhost:8000"));
  }
  if (primaryBaseUrl.includes("localhost:8000")) {
    candidates.push(primaryBaseUrl.replace("localhost:8000", "api:8000"));
  }

  let lastError: Error | null = null;
  for (const baseUrl of candidates) {
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Request failed for ${path} with ${response.status}`);
      }

      return response.json() as Promise<T>;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  throw lastError || new Error(`Request failed for ${path}`);
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


export async function fetchAcademicDataStatus(academicId: string): Promise<AcademicDataStatus> {
  return getJson<AcademicDataStatus>(`/academicians/${academicId}/data-status`);
}


export async function fetchAcademics(filters?: {
  facultyId?: string;
  departmentId?: string;
}): Promise<AcademicListItem[]> {
  const params = new URLSearchParams();
  if (filters?.facultyId) {
    params.set("faculty_id", filters.facultyId);
  }
  if (filters?.departmentId) {
    params.set("department_id", filters.departmentId);
  }
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return getJson<AcademicListItem[]>(`/academics${suffix}`);
}


export async function fetchAcademicWorks(academicId: string): Promise<AcademicWork[]> {
  return getJson<AcademicWork[]>(`/academics/${academicId}/works`);
}


export async function fetchFacultyPerformance(facultyId: string): Promise<OrganizationPerformance> {
  return getJson<OrganizationPerformance>(`/faculties/${facultyId}/performance`);
}


export async function fetchDataSourceHealth(): Promise<ProviderHealth[]> {
  return getJson<ProviderHealth[]>("/data-sources/health");
}


export async function fetchCollectionJobs(): Promise<CollectionJob[]> {
  return getJson<CollectionJob[]>("/integrations/collection-jobs");
}


export async function fetchCollectionJobItems(jobId: string): Promise<CollectionJobItem[]> {
  return getJson<CollectionJobItem[]>(`/integrations/collection-jobs/${jobId}/items`);
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

export async function importLocalAcademicsMaster(requestedBy: string): Promise<IntegrationActionResponse> {
  const response = await fetch(`${getApiBaseUrl()}/integrations/run/local/yok-akademik-academics-master`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      requested_by: requestedBy,
      period_label: "2025-2026",
    }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json() as Promise<IntegrationActionResponse>;
}

export async function refreshAcademicData(
  academicId: string,
  requestedBy: string,
  options?: {
    sourceMode?: string;
    sections?: string[];
  },
): Promise<CollectionJob> {
  const response = await fetch(`${getApiBaseUrl()}/academicians/${academicId}/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      requested_by: requestedBy,
      source_mode: options?.sourceMode || "auto",
      sections: options?.sections || ["profile", "works", "projects"],
    }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json() as Promise<CollectionJob>;
}

export async function createCollectionJob(
  requestedBy: string,
  options?: {
    sourceMode?: string;
    academicIds?: string[];
    sections?: string[];
  },
): Promise<CollectionJob> {
  const response = await fetch(`${getApiBaseUrl()}/integrations/collection-jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      requested_by: requestedBy,
      source_mode: options?.sourceMode || "auto",
      academic_ids: options?.academicIds,
      sections: options?.sections || ["profile", "works", "projects"],
    }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json() as Promise<CollectionJob>;
}

export async function rebuildWarehouse(sourceCode: string, requestedBy: string): Promise<IntegrationActionResponse> {
  const response = await fetch(`${getApiBaseUrl()}/integrations/run/local/warehouse-rebuild`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      requested_by: requestedBy,
      source_code: sourceCode,
    }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json() as Promise<IntegrationActionResponse>;
}

export async function uploadIntegrationFile(
  sourceCode: string,
  requestedBy: string,
  file: File,
): Promise<IntegrationActionResponse> {
  const formData = new FormData();
  formData.append("source_code", sourceCode);
  formData.append("requested_by", requestedBy);
  formData.append("period_label", "2025-2026");
  formData.append("file", file);

  const response = await fetch(`${getApiBaseUrl()}/integrations/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json() as Promise<IntegrationActionResponse>;
}

export async function uploadYokAkademikHar(requestedBy: string, file: File): Promise<IntegrationActionResponse> {
  const formData = new FormData();
  formData.append("requested_by", requestedBy);
  formData.append("file", file);

  const response = await fetch(`${getApiBaseUrl()}/integrations/run/yok-akademik/har-upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json() as Promise<IntegrationActionResponse>;
}

export async function uploadYokAkademikHtmlPackage(requestedBy: string, file: File): Promise<IntegrationActionResponse> {
  const formData = new FormData();
  formData.append("requested_by", requestedBy);
  formData.append("file", file);

  const response = await fetch(`${getApiBaseUrl()}/integrations/run/yok-akademik/html-package-upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json() as Promise<IntegrationActionResponse>;
}
