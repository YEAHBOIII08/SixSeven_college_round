import type {
  AttackItem,
  AttackSurfaceInfo,
  AttackTemplate,
  AttackTrace,
  BackendHealth,
  BenignTask,
  DefenseEvaluationResponse,
  FindingRecord,
  PlanItem,
  ReplayResult,
  ScanReportData,
  ScanRun,
  TargetTestRequest,
  TargetTestResponse,
} from '@/types';

const API_BASE = '/api';

export interface StartRunParams {
  target_name?: string;
  attack_ids?: string[];
  max_tests?: number;
  max_rounds?: number;
  timeout_seconds?: number;
  scan_mode?: 'deterministic' | 'adaptive';
  vulnerable_mode?: boolean;
  defense_config?: string;
  surface?: string;
}

export interface StartRunResponse {
  run_id: string;
  target_name: string;
  attack_ids: string[];
  status: string;
  created_at: string;
  message: string;
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    let errorDetail =
      (data && typeof data.detail === 'string' && data.detail) ||
      (data && typeof data.message === 'string' && data.message);

    if (!errorDetail) {
      if (response.status === 500 || response.status === 502 || response.status === 504) {
        errorDetail = `Backend server unreachable (${response.status}). Please make sure Uvicorn is running on http://127.0.0.1:8000.`;
      } else {
        errorDetail = `HTTP error ${response.status}: ${response.statusText}`;
      }
    }
    throw new Error(errorDetail);
  }

  return data as T;
}

export const api = {
  /** Check if the backend is running and healthy */
  async getHealth(): Promise<BackendHealth> {
    return request<BackendHealth>('/health');
  },

  /** Get list of available attack vectors */
  async getAttacks(): Promise<AttackTemplate[]> {
    return request<AttackTemplate[]>('/attacks');
  },

  /** Get specific attack template or stored execution */
  async getAttack(attackId: string): Promise<AttackTemplate | AttackItem> {
    return request<AttackTemplate | AttackItem>(`/attacks/${attackId}`);
  },

  /** List all historical security scan runs */
  async getRuns(): Promise<ScanRun[]> {
    return request<ScanRun[]>('/runs');
  },

  /** Get details and status of a specific run */
  async getRun(runId: string): Promise<ScanRun> {
    return request<ScanRun>(`/runs/${runId}`);
  },

  /** Get all attacks and prompts recorded for a scan run */
  async getRunAttacks(runId: string): Promise<AttackItem[]> {
    return request<AttackItem[]>(`/runs/${runId}/attacks`);
  },

  /** Get generated report for a scan run */
  async getRunReport(runId: string): Promise<ScanReportData> {
    return request<ScanReportData>(`/runs/${runId}/report`);
  },

  /** Launch a new deterministic or adaptive security scan */
  async startRun(params: StartRunParams): Promise<StartRunResponse> {
    return request<StartRunResponse>('/runs', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  /** Request cancellation of an in-progress scan */
  async cancelRun(runId: string): Promise<{ run_id: string; status: string }> {
    return request<{ run_id: string; status: string }>(`/runs/${runId}/cancel`, {
      method: 'POST',
    });
  },

  /** List detected findings across runs */
  async getFindings(params?: {
    severity?: string;
    category?: string;
    run_id?: string;
    status?: string;
  }): Promise<FindingRecord[]> {
    const query = new URLSearchParams();
    if (params?.severity) query.append('severity', params.severity);
    if (params?.category) query.append('category', params.category);
    if (params?.run_id) query.append('run_id', params.run_id);
    if (params?.status) query.append('status', params.status);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return request<FindingRecord[]>(`/findings${queryString}`);
  },

  /** Directly test the sandboxed target agent with an arbitrary message */
  async testTargetAgent(payload: TargetTestRequest): Promise<TargetTestResponse> {
    return request<TargetTestResponse>('/target/test', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /** Get catalog of all 5 vulnerability surfaces */
  async getSurfaces(): Promise<Record<string, AttackSurfaceInfo>> {
    return request<Record<string, AttackSurfaceInfo>>('/surfaces');
  },

  /** Generate structured 5-surface attack plan via Planner role */
  async getPlan(params?: {
    target_spec?: Record<string, unknown>;
    surface?: string;
  }): Promise<{ plan: PlanItem[]; total_items: number; surfaces_covered: string[] }> {
    return request<{ plan: PlanItem[]; total_items: number; surfaces_covered: string[] }>('/scans/plan', {
      method: 'POST',
      body: JSON.stringify(params || {}),
    });
  },

  /** List recorded reproducible attack traces */
  async getTraces(params?: { run_id?: string; surface?: string }): Promise<AttackTrace[]> {
    const query = new URLSearchParams();
    if (params?.run_id) query.append('run_id', params.run_id);
    if (params?.surface) query.append('surface', params.surface);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return request<AttackTrace[]>(`/traces${queryString}`);
  },

  /** Get specific attack trace by ID */
  async getTrace(traceId: string): Promise<AttackTrace> {
    return request<AttackTrace>(`/traces/${traceId}`);
  },

  /** Deterministic 1-click replay of an attack trace */
  async replayTrace(traceId: string, defenseOverride?: string): Promise<ReplayResult> {
    return request<ReplayResult>(`/traces/${traceId}/replay`, {
      method: 'POST',
      body: JSON.stringify({ defense_override: defenseOverride }),
    });
  },

  /** Get replay consistency metric */
  async getReplayConsistency(
    runId?: string
  ): Promise<{ total_replays: number; matches: number; consistency_rate: number }> {
    const query = runId ? `?run_id=${runId}` : '';
    return request<{ total_replays: number; matches: number; consistency_rate: number }>(
      `/traces/stats/consistency${query}`
    );
  },

  /** Run complete defense evaluation matrix across all defense configs and benign tasks */
  async evaluateDefenses(): Promise<DefenseEvaluationResponse> {
    return request<DefenseEvaluationResponse>('/evaluate/defenses', {
      method: 'POST',
    });
  },

  /** Get the 10 benign support tasks */
  async getBenignSuite(): Promise<BenignTask[]> {
    return request<BenignTask[]>('/benign-suite');
  },

  /** Get SSE EventSource URL for real-time live execution updates */
  getEventsUrl(runId: string): string {
    return `${API_BASE}/runs/${runId}/events`;
  },
};
