import { useState } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import type { AttackItem } from '@/types';
import {
  GitBranch,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  XCircle,
  Terminal,
  Cpu,
  Wrench,
  Sparkles,
} from 'lucide-react';

interface ReportAttackTimelineProps {
  attacks: AttackItem[];
}

export function ReportAttackTimeline({ attacks }: ReportAttackTimelineProps) {
  const [filter, setFilter] = useState<'all' | 'vulnerable' | 'passed'>('all');
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({
    [attacks[0]?.attack_id]: true,
  });

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredAttacks = attacks.filter((atk) => {
    const outcome = atk.outcome || atk.verdict;
    if (filter === 'vulnerable') return outcome === 'vulnerable';
    if (filter === 'passed') return outcome === 'passed';
    return true;
  });

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
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded bg-base-700/60 px-2 py-0.5 text-xs text-slate-400">
            Recorded
          </span>
        );
    }
  };

  return (
    <Card>
      <CardHeader
        title={`Adversarial Attack Timeline (${attacks.length} steps)`}
        icon={<GitBranch className="h-4 w-4" />}
        action={
          <div className="flex items-center rounded-lg border border-base-700 bg-base-850 p-0.5 text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`rounded-md px-2.5 py-1 ${
                filter === 'all'
                  ? 'bg-accent-600 text-white font-medium'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All ({attacks.length})
            </button>
            <button
              onClick={() => setFilter('vulnerable')}
              className={`rounded-md px-2.5 py-1 ${
                filter === 'vulnerable'
                  ? 'bg-danger-600 text-white font-medium'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Vulnerable (
              {
                attacks.filter(
                  (a) => (a.outcome || a.verdict) === 'vulnerable'
                ).length
              }
              )
            </button>
            <button
              onClick={() => setFilter('passed')}
              className={`rounded-md px-2.5 py-1 ${
                filter === 'passed'
                  ? 'bg-success-600 text-white font-medium'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Passed (
              {
                attacks.filter(
                  (a) => (a.outcome || a.verdict) === 'passed'
                ).length
              }
              )
            </button>
          </div>
        }
      />

      {attacks.length === 0 ? (
        <EmptyState
          icon={<GitBranch className="h-7 w-7" />}
          title="No attack attempts recorded"
          description="A chronological timeline of adversarial attack steps will appear here after a scan executes."
        />
      ) : (
        <div className="divide-y divide-base-700/60 p-2">
          {filteredAttacks.map((atk, index) => {
            const isExpanded = !!expandedIds[atk.attack_id];
            const outcome = atk.outcome || atk.verdict;

            return (
              <div key={atk.attack_id || index} className="p-3">
                {/* Header row */}
                <button
                  onClick={() => toggleExpand(atk.attack_id)}
                  className="flex w-full items-center justify-between text-left hover:opacity-90"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-base-800 text-[10px] font-mono text-slate-400">
                      {index + 1}
                    </span>
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white truncate">
                          {atk.name || atk.attack_name || atk.attack_id}
                        </span>
                        {atk.source === 'llm' && (
                          <span className="flex items-center gap-0.5 rounded bg-accent-500/10 px-1.5 py-0.5 text-[9px] font-medium text-accent-300">
                            <Sparkles className="h-2.5 w-2.5" />
                            LLM
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 capitalize">
                        {atk.category || 'General'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {getVerdictBadge(outcome)}
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="mt-3 ml-9 space-y-3 rounded-xl border border-base-700/60 bg-base-950 p-4 text-xs">
                    {/* Verdict description */}
                    {atk.explanation && (
                      <div className="text-slate-300">
                        <span className="font-semibold text-slate-400">
                          Verdict:
                        </span>{' '}
                        {atk.explanation}
                      </div>
                    )}

                    {/* Prompt */}
                    <div>
                      <div className="mb-1 flex items-center gap-1 font-semibold uppercase tracking-wider text-[10px] text-slate-400">
                        <Terminal className="h-3 w-3 text-accent-400" />
                        Prompt Payload
                      </div>
                      <pre className="max-h-32 overflow-y-auto rounded-lg border border-base-800 bg-base-900/60 p-2.5 font-mono text-xs text-amber-200/90 whitespace-pre-wrap break-words scrollbar-thin">
                        {atk.prompt || 'No prompt recorded'}
                      </pre>
                    </div>

                    {/* Target Response */}
                    <div>
                      <div className="mb-1 flex items-center gap-1 font-semibold uppercase tracking-wider text-[10px] text-slate-400">
                        <Cpu className="h-3 w-3 text-accent-400" />
                        Target Agent Response
                      </div>
                      <pre className="max-h-32 overflow-y-auto rounded-lg border border-base-800 bg-base-900/60 p-2.5 font-mono text-xs text-slate-200 whitespace-pre-wrap break-words scrollbar-thin">
                        {atk.target_response || '(No response text)'}
                      </pre>
                    </div>

                    {/* Tools */}
                    {atk.tool_calls && atk.tool_calls.length > 0 && (
                      <div>
                        <div className="mb-1 flex items-center gap-1 font-semibold uppercase tracking-wider text-[10px] text-slate-400">
                          <Wrench className="h-3 w-3 text-accent-400" />
                          Tool Execution
                        </div>
                        <div className="space-y-1 font-mono text-[11px]">
                          {atk.tool_calls.map((tc, tidx) => (
                            <div
                              key={tidx}
                              className="rounded border border-base-800 bg-base-900/40 p-2"
                            >
                              <span className="text-accent-400">
                                {tc.tool_name}()
                              </span>
                              <pre className="mt-0.5 text-slate-400">
                                {JSON.stringify(tc.arguments, null, 2)}
                              </pre>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
