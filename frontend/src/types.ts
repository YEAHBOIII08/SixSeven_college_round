export type View =
  | 'login'
  | 'dashboard'
  | 'target-setup'
  | 'execution'
  | 'report'
  | 'defensive';

export type RiskLevel = 'safe' | 'warn' | 'crit';

export type SystemStatus = 'operational' | 'degraded' | 'maintenance';

export type AgentName =
  | 'Context Auditor'
  | 'Tool Privilege Auditor'
  | 'Data Leakage Auditor';

export interface LogLine {
  id: number;
  timestamp: string;
  agent: AgentName;
  level: 'info' | 'warn' | 'crit' | 'success';
  message: string;
}

export interface MockTool {
  id: 'query_db' | 'lookup_order' | 'issue_refund';
  label: string;
  description: string;
}

export interface PreviousModel {
  id: string;
  name: string;
  engine: string;
  lastTested: string;
  score: number;
  status: RiskLevel;
}

export interface AttackStep {
  id: number;
  title: string;
  description: string;
  payload: string;
  result: string;
  severity: RiskLevel;
}

export interface CategoryScore {
  name: string;
  score: number;
  maxScore: number;
  icon: string;
  description: string;
  level: RiskLevel;
}

export interface RemediationRow {
  id: string;
  flaw: string;
  category: string;
  severity: RiskLevel;
  fixTitle: string;
  fixDescription: string;
  codePatch: string;
  promptPatch: string;
}

export interface ReportData {
  targetName: string;
  engine: string;
  testedAt: string;
  robustnessScore: number;
  categories: CategoryScore[];
  attackPath: AttackStep[];
  summary: string;
}

export interface TargetConfig {
  name: string;
  engine: string;
  systemPrompt: string;
  mockTools: Record<string, boolean>;
}
