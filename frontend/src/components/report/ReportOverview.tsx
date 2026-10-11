import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { AttackItem, ScanReportData, ScanRun } from '@/types';
import {
  Globe,
  Shield,
  Clock,
  Crosshair,
  Hash,
  Radar,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  XCircle,
  Cpu,
  Layers,
  StopCircle,
} from 'lucide-react';

interface ReportOverviewProps {
  run: ScanRun | null;
  report: ScanReportData | null;
  attacks: AttackItem[];
}

export function ReportOverview({ run, report, attacks }: ReportOverviewProps) {
  const counts = run?.counts ||
    report?.counts || {
      vulnerable: 0,
      passed: 0,
      inconclusive: 0,
      error: 0,
    };

  const total =
    run?.total || run?.completed || attacks.length || Math.max(counts.vulnerable + counts.passed + counts.inconclusive + counts.error, 1);
  const executed = run?.completed || attacks.length || 0;

  // Calculate score out of 10
  const score =
    total > 0
      ? Math.max(0, 10 - (counts.vulnerable / Math.max(executed, 1)) * 10)
      : 10;

  const scoreFormatted = score.toFixed(1);

  const getScoreColor = () => {
    if (score >= 8) return 'text-success-400 border-success-500/30 bg-success-500/10';
    if (score >= 6) return 'text-warning-400 border-warning-500/30 bg-warning-500/10';
    return 'text-danger-400 border-danger-500/30 bg-danger-500/10';
  };

  const durationSec =
    run?.created_at && run?.completed_at
      ? Math.max(
          1,
          Math.round(
            (new Date(run.completed_at).getTime() -
              new Date(run.created_at).getTime()) /
              1000
          )
        )
      : null;

  return (
    <div className="space-y-6">
      {/* Top score & key metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* Robustness Score Card */}
        <Card className={`flex flex-col items-center justify-center p-5 text-center ${getScoreColor()}`}>
          <div className="text-xs font-semibold uppercase tracking-wider">
            Robustness Score
          </div>
          <div className="mt-2 text-4xl font-black">{scoreFormatted}</div>
          <div className="mt-1 text-[11px] opacity-80">out of 10.0</div>
        </Card>

        <OverviewStat
          icon={<Radar className="h-5 w-5" />}
          label="Scan Status"
          value={run?.status || 'Unknown'}
          badge={
            run?.status === 'completed' ? (
              <Badge variant="success">Completed</Badge>
            ) : run?.status === 'running' ? (
              <Badge variant="accent" dot>
                Running
              </Badge>
            ) : (
              <Badge variant="muted">{run?.status || '—'}</Badge>
            )
          }
        />

        <OverviewStat
          icon={<Crosshair className="h-5 w-5" />}
          label="Tests Executed"
          value={`${executed}`}
          subtext={`of ${total} total planned`}
        />

        <OverviewStat
          icon={<Shield className="h-5 w-5" />}
          label="Vulnerabilities"
          value={`${counts.vulnerable}`}
          badge={
            counts.vulnerable > 0 ? (
              <Badge variant="danger">Breached</Badge>
            ) : (
              <Badge variant="success">Hardened</Badge>
            )
          }
        />

        <OverviewStat
          icon={<Clock className="h-5 w-5" />}
          label="Execution Time"
          value={durationSec ? `${durationSec}s` : '—'}
          subtext={run?.completed_at ? 'Finished' : 'In Progress'}
        />
      </div>

      {/* Breakdown stat bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="flex items-center gap-3 rounded-xl border border-danger-500/20 bg-danger-500/5 p-4">
          <div className="rounded-lg bg-danger-500/10 p-2 text-danger-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-danger-400">
              {counts.vulnerable}
            </div>
            <div className="text-xs text-slate-400">Vulnerabilities Found</div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-success-500/20 bg-success-500/5 p-4">
          <div className="rounded-lg bg-success-500/10 p-2 text-success-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-success-400">
              {counts.passed}
            </div>
            <div className="text-xs text-slate-400">Attacks Defended</div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-warning-500/20 bg-warning-500/5 p-4">
          <div className="rounded-lg bg-warning-500/10 p-2 text-warning-400">
            <HelpCircle className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-warning-400">
              {counts.inconclusive}
            </div>
            <div className="text-xs text-slate-400">Inconclusive Probes</div>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-base-700 bg-base-800/40 p-4">
          <div className="rounded-lg bg-base-700 p-2 text-slate-400">
            <XCircle className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-300">
              {counts.error}
            </div>
            <div className="text-xs text-slate-400">Execution Errors</div>
          </div>
        </div>
      </div>

      {/* Target info */}
      <Card>
        <div className="border-b border-base-700/60 px-5 py-4">
          <h3 className="text-sm font-semibold tracking-wide text-slate-200">
            Audit Session Information
          </h3>
        </div>
        <div className="grid grid-cols-1 gap-px bg-base-700/40 sm:grid-cols-2 lg:grid-cols-3">
          <InfoRow
            icon={<Hash className="h-4 w-4" />}
            label="Scan Session ID"
            value={run?.run_id || '—'}
          />
          <InfoRow
            icon={<Cpu className="h-4 w-4" />}
            label="Target Agent"
            value={run?.target_name || 'CustomerSupportAgent'}
          />
          <InfoRow
            icon={<Layers className="h-4 w-4" />}
            label="Adversarial Mode"
            value={run?.scan_mode ? `${run.scan_mode.toUpperCase()}` : 'Deterministic'}
          />
          <InfoRow
            icon={<Shield className="h-4 w-4" />}
            label="Sandbox Security Posture"
            value={
              run?.vulnerable_mode
                ? 'Vulnerable Profile (Intentionally flawed)'
                : 'Secure Profile (Enforced invariants)'
            }
          />
          <InfoRow
            icon={<Clock className="h-4 w-4" />}
            label="Started Timestamp"
            value={run?.created_at ? new Date(run.created_at).toLocaleString() : '—'}
          />
          <InfoRow
            icon={<Shield className="h-4 w-4" />}
            label="Defense Layer"
            value={
              (run?.defense_config || report?.defense_config) === 'all_defenses'
                ? 'All Defenses Combined (Hardened)'
                : (run?.defense_config || report?.defense_config) === 'tool_policy'
                ? 'Tool Policy Layer'
                : (run?.defense_config || report?.defense_config) === 'input_filter'
                ? 'Input & Content Filter'
                : (run?.defense_config || report?.defense_config) === 'spotlighting_output'
                ? 'Spotlighting & Output Filter'
                : 'Baseline (Undefended)'
            }
          />
          <InfoRow
            icon={<StopCircle className="h-4 w-4" />}
            label="Stop Reason"
            value={
              run?.stop_reason
                ? run.stop_reason.replace(/_/g, ' ')
                : run?.status === 'completed'
                ? 'Scan budget finished'
                : 'In execution'
            }
          />
        </div>
      </Card>

      {/* Executive Summary */}
      <Card>
        <div className="border-b border-base-700/60 px-5 py-4">
          <h3 className="text-sm font-semibold tracking-wide text-slate-200">
            Executive Security Summary
          </h3>
        </div>
        <div className="p-5 text-sm text-slate-300 leading-relaxed">
          {counts.vulnerable > 0 ? (
            <div className="space-y-3">
              <p>
                During this adversarial audit of{' '}
                <strong className="text-white">
                  {run?.target_name || 'CustomerSupportAgent'}
                </strong>
                , a total of{' '}
                <strong className="text-danger-400">
                  {counts.vulnerable} policy violation(s)
                </strong>{' '}
                were surfaced across {executed} executed test scenarios.
              </p>
              <p className="text-slate-400">
                {run?.vulnerable_mode
                  ? 'The target agent was evaluated under the Vulnerable Sandbox Profile, confirming that deliberate authorization flaws (BOLA/IDOR) and untrusted prompt injection pathways were successfully triggered and verified.'
                  : 'Vulnerabilities were detected under the standard security configuration. Review the Findings and Defense Validation tabs for targeted remediation guidance.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p>
                The target agent successfully defended against all {executed}{' '}
                adversarial attack vectors executed in this session.
              </p>
              <p className="text-slate-400">
                No canary token leaks, unauthorized customer record queries, or
                untrusted tool invocations were observed. Security invariants
                held across all evaluated test prompts.
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function OverviewStat({
  icon,
  label,
  value,
  badge,
  subtext,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  badge?: React.ReactNode;
  subtext?: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
        <span className="text-accent-400">{icon}</span>
        <span>{label}</span>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-2xl font-bold text-white capitalize">{value}</span>
        {badge}
      </div>
      {subtext && <div className="mt-1 text-[11px] text-slate-500">{subtext}</div>}
    </Card>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 bg-base-850 px-5 py-4">
      <span className="text-slate-500">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </div>
        <div className="mt-0.5 text-xs text-slate-300 font-medium break-words">
          {value}
        </div>
      </div>
    </div>
  );
}
