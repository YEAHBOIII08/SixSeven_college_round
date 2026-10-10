export type ScanStatus =
  | 'pending'
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'timed_out';

export type ScanMode = 'deterministic' | 'adaptive';

export type EventStage =
  | 'queued'
  | 'generating'
  | 'running'
  | 'evaluating'
  | 'completed';

export type Verdict = 'vulnerable' | 'passed' | 'inconclusive' | 'error' | 'safe';

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface ScanCounts {
  vulnerable: number;
  passed: number;
  inconclusive: number;
  error: number;
}

export interface ScanRun {
  run_id: string;
  target_name: string;
  status: ScanStatus;
  scan_mode?: ScanMode;
  vulnerable_mode?: boolean;
  max_tests?: number;
  max_rounds?: number;
  timeout_seconds?: number;
  completed: number;
  total: number;
  counts: ScanCounts;
  created_at: string;
  completed_at?: string;
  stop_reason?: string | null;
  error?: { type?: string; message?: string } | null;
  results?: AttackItem[];
  attempts?: AttackItem[];
  findings_count?: number;
}

export interface AttackItem {
  attack_id: string;
  run_id?: string;
  name?: string;
  attack_name?: string;
  category?: string;
  severity?: Severity;
  source?: 'template' | 'llm' | string;
  status?: string;
  prompt?: string;
  outcome?: Verdict;
  verdict?: Verdict;
  explanation?: string;
  evidence?: unknown[];
  target_response?: string | null;
  tool_calls?: ToolCallRecord[];
  tool_results?: unknown[];
  security_events?: SecurityEventRecord[];
  execution?: Record<string, unknown> | null;
  assessment?: EvaluatorAssessment | null;
  assessment_error?: string | null;
  rejection_reason?: string | null;
  recommended_mitigation?: string | null;
  affected_data?: string | null;
}

export interface EvaluatorAssessment {
  confidence?: 'high' | 'medium' | 'low' | string;
  summary?: string;
  observed_behavior?: string;
  possible_severity?: Severity;
  follow_up_category?: string;
  [key: string]: unknown;
}

export interface ToolCallRecord {
  tool_name: string;
  arguments: Record<string, unknown>;
  status?: string;
}

export interface SecurityEventRecord {
  event_type: string;
  severity: string;
  description: string;
  metadata?: Record<string, unknown>;
}

export interface AttackTemplate {
  attack_id: string;
  name: string;
  category: string;
  severity: Severity;
  description: string;
  expected_violation?: string;
}

export interface ActivityEvent {
  id: string;
  stage: EventStage;
  label: string;
  detail: string;
  timestamp: string;
  attackId?: string;
  verdict?: Verdict;
  rawEvent?: Record<string, unknown>;
}

export interface FindingRecord {
  finding_id?: string;
  id?: string;
  run_id?: string;
  category: string;
  severity: Severity;
  title: string;
  description: string;
  evidence?: unknown[];
  reproducibility_status?: string;
  recommended_mitigation?: string;
  recommendation?: string;
  created_at?: string;
}

export interface ScanReportData {
  run_id: string;
  target_name: string;
  scan_mode?: string;
  status: ScanStatus;
  started_at?: string;
  completed_at?: string;
  duration_seconds?: number;
  summary?: string;
  counts: ScanCounts;
  score?: number;
  findings: FindingRecord[];
  defense_validation?: {
    held: string[];
    bypassed: string[];
  };
}

export interface TargetTestRequest {
  message: string;
  user_id: string;
  vulnerability_config?: {
    allow_unauthorized_record_access?: boolean;
    trust_untrusted_content?: boolean;
  };
}

export interface TargetTestResponse {
  target_response: string;
  tool_calls: ToolCallRecord[];
  tool_results: unknown[];
  security_events: SecurityEventRecord[];
}

export interface BackendHealth {
  status: string;
  version: string;
  message: string;
}
