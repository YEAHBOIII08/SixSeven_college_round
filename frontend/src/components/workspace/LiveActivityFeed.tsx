import { Link } from 'react-router-dom';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import type { AttackItem, ScanRun } from '@/types';
import {
  ListTree,
  Activity,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  XCircle,
  ArrowRight,
  Sparkles,
  Shield,
  Loader2,
} from 'lucide-react';

interface LiveActivityFeedProps {
  activeRun: ScanRun | null;
  attempts: AttackItem[];
  selectedAttackId: string | null;
  onSelectAttack: (attack: AttackItem) => void;
  isScanning: boolean;
}

export function LiveActivityFeed({
  activeRun,
  attempts,
  selectedAttackId,
  onSelectAttack,
  isScanning,
}: LiveActivityFeedProps) {
  const completed = activeRun?.completed ?? 0;
  const total = activeRun?.total ?? Math.max(attempts.length, 1);
  const progressPercent =
    total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;

  const counts = activeRun?.counts ?? {
    vulnerable: 0,
    passed: 0,
    inconclusive: 0,
    error: 0,
  };

  const isTerminal =
    activeRun &&
    ['completed', 'failed', 'cancelled', 'timed_out'].includes(activeRun.status);

  const getVerdictBadge = (outcome?: string) => {
    switch (outcome) {
      case 'vulnerable':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-danger-500/10 px-2 py-0.5 text-xs font-semibold text-danger-400 border border-danger-500/20">
            <AlertTriangle className="h-3 w-3" />
            Vulnerable
          </span>
        );
      case 'passed':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-success-500/10 px-2 py-0.5 text-xs font-semibold text-success-400 border border-success-500/20">
            <CheckCircle2 className="h-3 w-3" />
            Passed
          </span>
        );
      case 'inconclusive':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-warning-500/10 px-2 py-0.5 text-xs font-semibold text-warning-400 border border-warning-500/20">
            <HelpCircle className="h-3 w-3" />
            Inconclusive
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-danger-500/10 px-2 py-0.5 text-xs font-semibold text-danger-400 border border-danger-500/20">
            <XCircle className="h-3 w-3" />
            Error
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded bg-base-700/60 px-2 py-0.5 text-xs text-slate-400">
            Recorded
          </span>
        );
    }
  };

  return (
    <Card className="flex h-full flex-col">
      <CardHeader
        title="Live Activity & Attack Stream"
        icon={<ListTree className="h-4 w-4" />}
        action={
          activeRun ? (
            <Badge
              variant={
                isScanning
                  ? 'accent'
                  : activeRun.status === 'completed'
                  ? 'success'
                  : 'danger'
              }
              dot={isScanning}
            >
              {isScanning ? 'Executing Scan' : activeRun.status}
            </Badge>
          ) : (
            <Badge variant="muted">Idle</Badge>
          )
        }
      />

      {/* Progress & Stat Banner */}
      {activeRun && (
        <div className="border-b border-base-700/60 bg-base-850/60 px-4 py-3">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-mono text-slate-400">
              {activeRun.target_name} ({activeRun.run_id})
            </span>
            <span className="font-semibold text-accent-400">
              {completed} / {total} tests ({progressPercent}%)
            </span>
          </div>

          <div className="h-1.5 w-full overflow-hidden rounded-full bg-base-800">
            <div
              className={`h-full transition-all duration-300 ${
                counts.vulnerable > 0 ? 'bg-danger-500' : 'bg-accent-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
            <div className="rounded border border-danger-500/20 bg-danger-500/5 py-1 text-danger-400">
              <span className="block font-bold">{counts.vulnerable}</span>
              <span className="text-[10px] text-slate-500">Vulnerable</span>
            </div>
            <div className="rounded border border-success-500/20 bg-success-500/5 py-1 text-success-400">
              <span className="block font-bold">{counts.passed}</span>
              <span className="text-[10px] text-slate-500">Passed</span>
            </div>
            <div className="rounded border border-warning-500/20 bg-warning-500/5 py-1 text-warning-400">
              <span className="block font-bold">{counts.inconclusive}</span>
              <span className="text-[10px] text-slate-500">Inconclusive</span>
            </div>
            <div className="rounded border border-base-700 bg-base-800/40 py-1 text-slate-400">
              <span className="block font-bold">{counts.error}</span>
              <span className="text-[10px] text-slate-500">Errors</span>
            </div>
          </div>
        </div>
      )}

      {/* Completion CTA */}
      {isTerminal && activeRun && (
        <div className="border-b border-accent-500/30 bg-accent-500/10 px-4 py-3 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-accent-200">
              <CheckCircle2 className="h-4 w-4 text-accent-400" />
              <span>
                Scan {activeRun.status}!{' '}
                {activeRun.stop_reason
                  ? `(${activeRun.stop_reason.replace(/_/g, ' ')})`
                  : ''}
              </span>
            </div>
            <Link
              to={`/reports/${activeRun.run_id}`}
              className="inline-flex items-center gap-1 rounded bg-accent-600 px-3 py-1 font-semibold text-white shadow-glow-accent hover:bg-accent-500"
            >
              View Full Report
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      )}

      {/* Feed list */}
      <div className="flex-1 overflow-y-auto p-3 scrollbar-thin">
        {!activeRun ? (
          <EmptyState
            icon={<Activity className="h-7 w-7" />}
            title="Scan workspace is ready"
            description="Configure parameters on the left and click 'Launch Security Scan' to stream real-time adversarial evaluation events."
          />
        ) : attempts.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center text-center text-slate-400">
            <Loader2 className="mb-2 h-6 w-6 animate-spin text-accent-400" />
            <p className="text-sm font-medium text-slate-300">
              Executing attack generator & probes...
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Target execution results will stream in momentarily.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {attempts.map((item, idx) => {
              const isSelected = selectedAttackId === item.attack_id;
              const outcome = item.outcome || item.verdict;

              return (
                <div
                  key={item.attack_id || idx}
                  onClick={() => onSelectAttack(item)}
                  className={`cursor-pointer rounded-lg border p-3 transition-all ${
                    isSelected
                      ? 'border-accent-500/80 bg-accent-500/15 shadow-glow-accent'
                      : 'border-base-700/60 bg-base-850/70 hover:border-base-600 hover:bg-base-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[10px] text-slate-500">
                          #{idx + 1}
                        </span>
                        <h4 className="text-xs font-semibold text-white break-words">
                          {item.name || item.attack_name || item.attack_id}
                        </h4>
                        {item.category && (
                          <span className="rounded bg-base-800 px-1.5 py-0.5 text-[10px] text-slate-400 capitalize">
                            {item.category.replace(/_/g, ' ')}
                          </span>
                        )}
                        {item.source === 'llm' && (
                          <span className="flex items-center gap-0.5 rounded bg-accent-500/10 px-1 py-0.5 text-[9px] font-medium text-accent-300">
                            <Sparkles className="h-2.5 w-2.5" />
                            LLM
                          </span>
                        )}
                      </div>
                      <div className="mt-1.5 rounded bg-base-900/60 p-2 font-mono text-[11px] text-slate-300 break-words whitespace-pre-wrap border border-base-800/80">
                        {item.prompt || 'No prompt recorded'}
                      </div>
                    </div>

                    <div className="shrink-0">{getVerdictBadge(outcome)}</div>
                  </div>

                  {item.explanation && (
                    <div className="mt-2 rounded bg-base-900/40 p-2 text-[11px] text-slate-300 break-words whitespace-pre-wrap border border-base-800/60">
                      <span className="font-semibold text-slate-400">Verdict: </span>
                      {item.explanation}
                    </div>
                  )}

                  {item.mitigated_by && (
                    <div className="mt-2 flex items-start gap-1.5 rounded bg-emerald-500/10 p-2 text-[11px] font-medium text-emerald-300 border border-emerald-500/20">
                      <Shield className="h-3.5 w-3.5 shrink-0 text-emerald-400 mt-0.5" />
                      <span className="break-words">Mitigated by: {item.mitigated_by}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}
