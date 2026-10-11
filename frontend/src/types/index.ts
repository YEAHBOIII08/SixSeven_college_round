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
  defense_config?: string;
  surface?: string;
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
  traces?: AttackTrace[];
  defense_metrics?: DefenseMetrics;
}

export interface DefenseMetrics {
  defense_config: string;
  baseline_asr: number;
  defended_asr: number;
  defense_efficacy: number;
  utility_preservation: number;
  false_positive_rate: number;
  benign_summary?: {
    total_tasks: number;
    completed_tasks: number;
    btsr: number;
    results: BenignTaskResult[];
  };
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
  mitigated_by?: string | null;
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
  defense_config?: string;
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
  traces?: AttackTrace[];
  defense_metrics?: DefenseMetrics;
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

// ============================================================================
// AGENTBREAK PRD v1.0 TYPES
// ============================================================================

export type AttackSurfaceKey =
  | 'instructions'
  | 'memory'
  | 'retrieved_content'
  | 'tool_permissions'
  | 'multi_step';

export type DefenseConfigKey =
  | 'none'
  | 'input_filter'
  | 'tool_policy'
  | 'spotlighting_output'
  | 'all_defenses';

export interface AttackSurfaceInfo {
  name: string;
  description: string;
  deterministic_signal: string;
  assigned_role: string;
}

export interface PlanItem {
  id: string;
  surface: string;
  goal: string;
  technique: string;
  success_criteria: string;
  assigned_role: string;
  attempt?: number;
  max_attempts?: number;
  prompt?: string;
  multi_turn_prompts?: string[];
}

export interface TraceStep {
  idx: number;
  role: string;
  type: string;
  content?: string;
  tool?: string;
  args?: Record<string, unknown>;
  security_events?: SecurityEventRecord[];
}

export interface AttackTrace {
  trace_id: string;
  run_id?: string;
  timestamp: string;
  target: {
    agent_id: string;
    defense_config: string;
  };
  model: {
    name: string;
    temperature: number;
    seed: number;
  };
  plan_item: {
    id: string;
    surface: string;
    technique: string;
    goal: string;
    assigned_role: string;
  };
  attempt: number;
  steps: TraceStep[];
  verdict: {
    success: boolean;
    evidence: string;
    severity: string;
    surface?: string;
    method?: string;
    reasoning?: string;
  };
  state_snapshot?: {
    memory?: Record<string, string>;
    event_log?: unknown[];
  };
}

export interface ReplayResult {
  trace_id: string;
  original_defense: string;
  replayed_defense: string;
  original_verdict: Record<string, unknown>;
  replayed_verdict: Record<string, unknown>;
  is_consistent: boolean;
  replayed_steps: TraceStep[];
  timestamp: string;
}

export interface BenignTaskResult {
  task_id: string;
  name: string;
  category: string;
  success: boolean;
  response?: string;
  status?: string;
}

export interface DefenseConfigEvalResult {
  config_key: string;
  label: string;
  asr: number;
  baseline_asr: number;
  defense_block_rate: number;
  btsr: number;
  baseline_btsr: number;
  utility_cost: number;
  total_attacks: number;
  successful_attacks: number;
  benign_summary: {
    total_tasks: number;
    completed_tasks: number;
    btsr: number;
    results: BenignTaskResult[];
  };
  surface_breakdown: Record<
    string,
    {
      total: number;
      vulnerable: number;
      asr: number;
    }
  >;
}

export interface DefenseEvaluationResponse {
  matrix: Record<string, DefenseConfigEvalResult>;
  replay_consistency: number;
  surfaces: string[];
}

export interface BenignTask {
  task_id: string;
  name: string;
  category: string;
  actor_id: string;
  prompt: string;
  expected_tool?: string;
  description: string;
}
