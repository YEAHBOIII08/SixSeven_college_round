import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { AttackItem, FindingRecord, ScanReportData, ScanRun } from '@/types';
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Lock,
  Layers,
  Key,
  Shield,
  Activity,
  Check,
} from 'lucide-react';

interface ReportDefenseValidationProps {
  run: ScanRun | null;
  report?: ScanReportData | null;
  attacks: AttackItem[];
  findings: FindingRecord[];
}

export function ReportDefenseValidation({
  run,
  report,
  attacks,
  findings,
}: ReportDefenseValidationProps) {
  const passedAttacks = attacks.filter(
    (a) => (a.outcome || a.verdict) === 'passed'
  );
  const breachedAttacks = attacks.filter(
    (a) => (a.outcome || a.verdict) === 'vulnerable'
  );

  const defenseMetrics = report?.defense_metrics || run?.defense_metrics;
  const defenseConfigKey = run?.defense_config || report?.defense_config || defenseMetrics?.defense_config || 'none';

  const formatConfigName = (key: string) => {
    switch (key) {
      case 'all_defenses':
      case 'all_combined':
      case 'hardened':
        return 'All Defenses Combined (Hardened Agent)';
      case 'input_filter':
        return 'Input & Content Filter';
      case 'tool_policy':
        return 'Tool Policy Layer (RBAC & BOLA Gate)';
      case 'spotlighting':
      case 'spotlighting_output':
        return 'Spotlighting & Output Filter';
      case 'none':
      case 'baseline':
      default:
        return 'Baseline (Undefended Target)';
    }
  };

  const isHardened = defenseConfigKey !== 'none' && defenseConfigKey !== 'baseline';

  return (
    <div className="space-y-6">
      {/* Target Defense Configuration & Quantitative Metrics */}
      <Card className="border-accent-500/30 bg-accent-500/5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-accent-400" />
              <h3 className="text-sm font-bold text-white">
                Active Defense Configuration:{' '}
                <span className="text-accent-300">{formatConfigName(defenseConfigKey)}</span>
              </h3>
            </div>
            <p className="mt-1 text-xs text-slate-400 max-w-2xl leading-relaxed">
              Evaluating whether target defense layers prevent discovered attacks
              without breaking legitimate customer agent functionality.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isHardened ? 'success' : 'muted'}>
              {isHardened ? 'Active Safeguards Enabled' : 'No Defense Active (Baseline)'}
            </Badge>
          </div>
        </div>

        {/* Quantitative Defense Metrics Grid */}
        {defenseMetrics ? (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-base-700 bg-base-850 p-3.5">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Attack Success Rate (ASR)
              </div>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="text-xl font-black text-danger-400">
                  {Math.round(defenseMetrics.defended_asr * 100)}%
                </span>
                <span className="text-xs text-slate-500 line-through">
                  {Math.round(defenseMetrics.baseline_asr * 100)}% base
                </span>
              </div>
              <div className="mt-1 text-[10px] text-slate-400">
                Adversarial exploit rate
              </div>
            </div>

            <div className="rounded-xl border border-success-500/30 bg-success-500/10 p-3.5">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-success-400">
                Defense Efficacy
              </div>
              <div className="mt-1.5 text-xl font-black text-success-300">
                {Math.round(defenseMetrics.defense_efficacy * 100)}%
              </div>
              <div className="mt-1 text-[10px] text-success-400/80">
                Exploits neutralized
              </div>
            </div>

            <div className="rounded-xl border border-accent-500/30 bg-accent-500/10 p-3.5">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-accent-400">
                Utility Preservation (BTSR)
              </div>
              <div className="mt-1.5 text-xl font-black text-accent-300">
                {Math.round(defenseMetrics.utility_preservation * 100)}%
              </div>
              <div className="mt-1 text-[10px] text-accent-400/80">
                Benign tasks succeeded
              </div>
            </div>

            <div className="rounded-xl border border-base-700 bg-base-850 p-3.5">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                False Positive Rate
              </div>
              <div className="mt-1.5 text-xl font-black text-emerald-400">
                {Math.round(defenseMetrics.false_positive_rate * 100)}%
              </div>
              <div className="mt-1 text-[10px] text-slate-400">
                0% legitimate tasks blocked
              </div>
            </div>
          </div>
        ) : null}
      </Card>

      {/* Benign Benchmark Suite Card */}
      {defenseMetrics?.benign_summary && (
        <Card>
          <CardHeader
            title={`Benign Utility Benchmark (${defenseMetrics.benign_summary.completed_tasks}/${defenseMetrics.benign_summary.total_tasks} Tasks Preserved)`}
            icon={<CheckCircle2 className="h-4 w-4 text-emerald-400" />}
          />
          <div className="p-4 space-y-2">
            <p className="text-xs text-slate-400 mb-3">
              Legitimate user interactions executed under the active defense layer to verify zero false positives (normal operations are never blocked):
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {defenseMetrics.benign_summary.results.map((task) => (
                <div
                  key={task.task_id}
                  className="flex items-center justify-between rounded-lg border border-base-700/60 bg-base-850/60 p-2.5 text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <span className="font-mono text-[10px] text-slate-500">{task.task_id}</span>
                    <h5 className="font-semibold text-slate-200 break-words">{task.name}</h5>
                    <span className="text-[10px] text-slate-400 capitalize">{task.category.replace(/_/g, ' ')}</span>
                  </div>
                  <Badge variant={task.success ? 'success' : 'danger'}>
                    {task.success ? 'Passed (Preserved)' : 'Blocked (FP)'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="p-5 border-success-500/30 bg-success-500/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-success-400 font-semibold text-sm">
              <CheckCircle2 className="h-5 w-5" />
              Safeguards Enforced & Maintained
            </div>
            <span className="text-2xl font-bold text-success-400">
              {passedAttacks.length}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-300">
            Adversarial attempts where the agent's guardrails successfully
            neutralized prompt injection, scrubbed canaries, or blocked unauthorized tool operations.
          </p>
        </Card>

        <Card className="p-5 border-danger-500/30 bg-danger-500/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-danger-400 font-semibold text-sm">
              <XCircle className="h-5 w-5" />
              Defense Safeguards Breached
            </div>
            <span className="text-2xl font-bold text-danger-400">
              {breachedAttacks.length}
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-300">
            Attack scenarios where security invariants failed, resulting in
            unauthorized data exposure, privilege escalation, or tool abuse.
          </p>
        </Card>
      </div>

      {/* Held vs Breached Invariants */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Held Defenses */}
        <Card>
          <CardHeader
            title={`Protected Boundaries (${passedAttacks.length})`}
            icon={<ShieldCheck className="h-4 w-4 text-success-400" />}
          />
          <div className="p-4 space-y-2.5 max-h-96 overflow-y-auto scrollbar-thin">
            {passedAttacks.length === 0 ? (
              <p className="text-xs text-slate-500 p-2">
                No verified defense holds recorded in this scan.
              </p>
            ) : (
              passedAttacks.map((atk, idx) => (
                <div
                  key={atk.attack_id || idx}
                  className="rounded-lg border border-base-700/60 bg-base-850/60 p-3 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">
                      {atk.name || atk.attack_name || atk.attack_id}
                    </span>
                    <Badge variant="success">Held</Badge>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {atk.explanation ||
                      'Agent maintained policy boundaries and refused unauthorized actions.'}
                  </p>
                  {atk.mitigated_by && (
                    <div className="mt-2 flex items-center gap-1.5 rounded bg-emerald-500/10 px-2 py-1 text-[10px] font-medium text-emerald-400 border border-emerald-500/20">
                      <Shield className="h-3 w-3 shrink-0 text-emerald-400" />
                      <span className="break-words">Mitigated by: {atk.mitigated_by}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Breached Defenses */}
        <Card>
          <CardHeader
            title={`Breached Boundaries (${breachedAttacks.length})`}
            icon={<ShieldAlert className="h-4 w-4 text-danger-400" />}
          />
          <div className="p-4 space-y-2.5 max-h-96 overflow-y-auto scrollbar-thin">
            {breachedAttacks.length === 0 ? (
              <p className="text-xs text-success-400 p-2 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                Zero defenses breached. Target agent is fully resilient across
                evaluated vectors.
              </p>
            ) : (
              breachedAttacks.map((atk, idx) => (
                <div
                  key={atk.attack_id || idx}
                  className="rounded-lg border border-danger-500/30 bg-danger-500/10 p-3 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-danger-300">
                      {atk.name || atk.attack_name || atk.attack_id}
                    </span>
                    <Badge variant="danger">Bypassed</Badge>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-300">
                    {atk.explanation ||
                      'Security invariant was violated during tool invocation or output generation.'}
                  </p>
                  {atk.recommended_mitigation && (
                    <div className="mt-2 text-[10px] text-accent-300">
                      Fix: {atk.recommended_mitigation}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Recommended Hardening Blueprint */}
      <Card>
        <CardHeader
          title="Recommended AI Agent Hardening Architecture"
          icon={<Lock className="h-4 w-4" />}
        />
        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-base-700 bg-base-850 p-4 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-accent-400">
              <Lock className="h-4 w-4" />
              1. Deterministic Tool ACLs
            </div>
            <p className="text-slate-400 leading-relaxed">
              Never rely solely on LLM judgment to enforce permissions. Bind
              authenticated session context (e.g.{' '}
              <code className="text-accent-300">user_id</code>) at the tool execution
              layer so the agent cannot read foreign customer records even if
              injected.
            </p>
          </div>

          <div className="rounded-xl border border-base-700 bg-base-850 p-4 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-accent-400">
              <Layers className="h-4 w-4" />
              2. Untrusted Content Sandboxing
            </div>
            <p className="text-slate-400 leading-relaxed">
              Enclose retrieved tickets and third-party data within explicit XML
              boundary delimiters (e.g.{' '}
              <code className="text-accent-300">&lt;untrusted_content&gt;</code>)
              and instruct the agent to treat enclosed strings strictly as passive data.
            </p>
          </div>

          <div className="rounded-xl border border-base-700 bg-base-850 p-4 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-accent-400">
              <Key className="h-4 w-4" />
              3. Canary Token Monitoring
            </div>
            <p className="text-slate-400 leading-relaxed">
              Embed synthetic canary records (e.g.{' '}
              <code className="text-accent-300">CANARY-7F3A</code>) in backend databases
              and instrument egress monitoring. Any response containing canary tokens
              triggers an immediate kill-switch and security alert.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
