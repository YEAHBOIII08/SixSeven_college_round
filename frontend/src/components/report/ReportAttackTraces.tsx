import { useState, useEffect } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { api } from '@/services/api';
import type { AttackTrace, ReplayResult } from '@/types';
import {
  RefreshCw,
  Play,
  CheckCircle2,
  AlertTriangle,
  Code,
  Shield,
  Layers,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Database,
  ArrowRight,
  Loader2,
} from 'lucide-react';

interface ReportAttackTracesProps {
  runId?: string;
  initialTraces?: AttackTrace[];
}

export function ReportAttackTraces({ runId, initialTraces }: ReportAttackTracesProps) {
  const [traces, setTraces] = useState<AttackTrace[]>(initialTraces || []);
  const [loading, setLoading] = useState(!initialTraces);
  const [selectedSurface, setSelectedSurface] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedTraceId, setExpandedTraceId] = useState<string | null>(null);
  const [showJsonTraceId, setShowJsonTraceId] = useState<string | null>(null);

  // Replay states
  const [replayingTraceId, setReplayingTraceId] = useState<string | null>(null);
  const [replayDefenseOverrides, setReplayDefenseOverrides] = useState<Record<string, string>>({});
  const [replayResults, setReplayResults] = useState<Record<string, ReplayResult>>({});
  const [replayError, setReplayError] = useState<string | null>(null);

  useEffect(() => {
    if (initialTraces && initialTraces.length > 0) {
      setTraces(initialTraces);
      setLoading(false);
      return;
    }

    setLoading(true);
    api
      .getTraces({ run_id: runId })
      .then((data) => {
        setTraces(data);
      })
      .catch((err) => {
        console.error('Failed to load attack traces', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [runId, initialTraces]);

  const handleReplay = async (traceId: string) => {
    setReplayError(null);
    setReplayingTraceId(traceId);
    const override = replayDefenseOverrides[traceId] || undefined;

    try {
      const result = await api.replayTrace(traceId, override);
      setReplayResults((prev) => ({ ...prev, [traceId]: result }));
    } catch (err) {
      setReplayError(err instanceof Error ? err.message : 'Failed to replay trace');
    } finally {
      setReplayingTraceId(null);
    }
  };

  const filteredTraces = traces.filter((t) => {
    const surfaceMatch =
      selectedSurface === 'all' || t.plan_item?.surface === selectedSurface;
    const term = searchTerm.toLowerCase();
    const searchMatch =
      !term ||
      t.trace_id.toLowerCase().includes(term) ||
      t.plan_item?.goal?.toLowerCase().includes(term) ||
      t.plan_item?.technique?.toLowerCase().includes(term) ||
      t.verdict?.evidence?.toLowerCase().includes(term);
    return surfaceMatch && searchMatch;
  });

  const surfaces = [
    { id: 'all', label: 'All Surfaces' },
    { id: 'instructions', label: 'Instructions' },
    { id: 'memory', label: 'Memory' },
    { id: 'retrieved_content', label: 'Retrieved Content' },
    { id: 'tool_permissions', label: 'Tool Permissions' },
    { id: 'multi_step', label: 'Multi-Step Execution' },
  ];

  const surfaceBadgeColors: Record<string, 'accent' | 'warning' | 'danger' | 'default'> = {
    instructions: 'accent',
    memory: 'warning',
    retrieved_content: 'danger',
    tool_permissions: 'accent',
    multi_step: 'warning',
  };

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <Card>
        <CardHeader
          title="Reproducible Attack Traces (PRD Section 7)"
          icon={<RefreshCw className="h-4 w-4 text-accent-400" />}
          action={
            <div className="flex items-center gap-2">
              <Badge variant="accent">
                {traces.length} Recorded Traces
              </Badge>
              <Badge variant="success">
                Deterministic Seed: 42 (Temp 0)
              </Badge>
            </div>
          }
        />
        <div className="border-b border-base-700/60 p-4">
          <p className="text-xs text-slate-400 leading-relaxed">
            Every attack probe is captured as a self-contained, reproducible JSON trace containing
            the exact attacker prompts, sandboxed target tool calls, initial state snapshot, and deterministic
            judge verdict. Use <strong>1-Click Replay</strong> to re-run inputs against fresh sandbox instances
            or test with hardened defense layers.
          </p>
        </div>

        {/* Filters and search */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex flex-wrap items-center gap-1.5">
            {surfaces.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedSurface(s.id)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                  selectedSurface === s.id
                    ? 'bg-accent-500/20 text-accent-300 border border-accent-500/40'
                    : 'bg-base-800 text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search traces, techniques, evidence..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-base-700 bg-base-800 py-1.5 pl-8 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:border-accent-500/50 focus:outline-none"
            />
          </div>
        </div>
      </Card>

      {replayError && (
        <div className="rounded-lg border border-danger-500/30 bg-danger-500/10 p-3 text-xs text-danger-300">
          Replay error: {replayError}
        </div>
      )}

      {/* Traces List */}
      {loading ? (
        <Card className="flex items-center justify-center p-12">
          <div className="flex items-center gap-3 text-sm text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin text-accent-400" />
            Loading attack traces...
          </div>
        </Card>
      ) : filteredTraces.length === 0 ? (
        <Card className="p-8 text-center text-sm text-slate-500">
          No attack traces found matching the selected filters.
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredTraces.map((trace) => {
            const isExpanded = expandedTraceId === trace.trace_id;
            const isJsonVisible = showJsonTraceId === trace.trace_id;
            const isReplaying = replayingTraceId === trace.trace_id;
            const replay = replayResults[trace.trace_id];
            const isVuln = trace.verdict?.success;

            return (
              <Card key={trace.trace_id} className="overflow-hidden border border-base-700/60">
                {/* Header row */}
                <div
                  className="flex flex-wrap items-center justify-between gap-3 bg-base-850/60 p-4 transition-colors hover:bg-base-800/40 cursor-pointer"
                  onClick={() => setExpandedTraceId(isExpanded ? null : trace.trace_id)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      className="text-slate-400 hover:text-slate-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedTraceId(isExpanded ? null : trace.trace_id);
                      }}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-accent-300">
                          {trace.trace_id}
                        </span>
                        <Badge
                          variant={surfaceBadgeColors[trace.plan_item?.surface] || 'default'}
                        >
                          {trace.plan_item?.surface}
                        </Badge>
                        <Badge variant={isVuln ? 'danger' : 'success'}>
                          {isVuln ? 'Exploit Succeeded' : 'Neutralized / Passed'}
                        </Badge>
                        <Badge variant="default" className="text-[10px]">
                          {trace.plan_item?.assigned_role}
                        </Badge>
                      </div>
                      <div className="mt-1 text-xs text-slate-300">
                        <strong>Goal:</strong> {trace.plan_item?.goal || 'Security invariant test'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-slate-500">
                      {trace.steps?.length || 0} steps
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowJsonTraceId(isJsonVisible ? null : trace.trace_id);
                      }}
                    >
                      <Code className="h-3.5 w-3.5 mr-1" />
                      {isJsonVisible ? 'Hide JSON' : 'Trace JSON'}
                    </Button>
                  </div>
                </div>

                {/* JSON Drawer */}
                {isJsonVisible && (
                  <div className="border-t border-base-700/60 bg-base-950 p-4 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-96">
                    <pre>{JSON.stringify(trace, null, 2)}</pre>
                  </div>
                )}

                {/* Expanded Details & Replay Section */}
                {isExpanded && (
                  <div className="border-t border-base-700/60 p-5 space-y-5 bg-base-900/60">
                    {/* Meta grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      <div className="rounded-lg border border-base-700 bg-base-800/60 p-3">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                          Technique & Surface
                        </span>
                        <div className="text-slate-200 font-medium">
                          {trace.plan_item?.technique}
                        </div>
                        <div className="text-slate-400 text-[11px] mt-0.5">
                          Attempt #{trace.attempt}
                        </div>
                      </div>

                      <div className="rounded-lg border border-base-700 bg-base-800/60 p-3">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                          Judge Verdict ({trace.verdict?.method || 'deterministic'})
                        </span>
                        <div className="flex items-center gap-1.5 font-medium text-slate-200">
                          {isVuln ? (
                            <AlertTriangle className="h-3.5 w-3.5 text-danger-400" />
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5 text-success-400" />
                          )}
                          Severity: <span className="uppercase">{trace.verdict?.severity}</span>
                        </div>
                        <div className="text-slate-400 text-[11px] mt-0.5 break-words whitespace-pre-wrap">
                          {trace.verdict?.evidence || trace.verdict?.reasoning}
                        </div>
                      </div>

                      <div className="rounded-lg border border-base-700 bg-base-800/60 p-3">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                          Target & Environment
                        </span>
                        <div className="text-slate-200 font-medium">
                          {trace.target?.agent_id}
                        </div>
                        <div className="text-slate-400 text-[11px] mt-0.5">
                          Defense: {trace.target?.defense_config || 'none'}
                        </div>
                      </div>
                    </div>

                    {/* Transcript steps */}
                    <div>
                      <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                        Execution Step Transcript
                      </h4>
                      <div className="space-y-2 rounded-lg border border-base-700 bg-base-850 p-3">
                        {trace.steps?.map((step, idx) => (
                          <div
                            key={idx}
                            className={`rounded border p-2.5 text-xs font-mono ${
                              step.role?.startsWith('attacker')
                                ? 'border-accent-500/30 bg-accent-500/5 text-accent-200'
                                : step.type === 'tool_call'
                                ? 'border-warning-500/30 bg-warning-500/5 text-warning-200'
                                : 'border-base-700 bg-base-800 text-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-between text-[10px] opacity-75 mb-1">
                              <span className="uppercase font-bold">
                                Step #{step.idx} — {step.role} ({step.type})
                              </span>
                              {step.tool && <span className="text-warning-300">Tool: {step.tool}</span>}
                            </div>
                            <div className="whitespace-pre-wrap">
                              {step.content || JSON.stringify(step.args || {})}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 1-Click Replay Controls */}
                    <div className="rounded-lg border border-accent-500/30 bg-accent-500/5 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                            <Play className="h-3.5 w-3.5 text-accent-400" />
                            1-Click Deterministic Replay Engine
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Replays recorded inputs against fresh target sandbox to verify verdict consistency or evaluate defenses.
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <select
                            value={replayDefenseOverrides[trace.trace_id] || ''}
                            onChange={(e) =>
                              setReplayDefenseOverrides((prev) => ({
                                ...prev,
                                [trace.trace_id]: e.target.value,
                              }))
                            }
                            className="rounded-lg border border-base-700 bg-base-800 py-1.5 px-2.5 text-xs text-slate-300 focus:outline-none"
                          >
                            <option value="">Replay with Original Defense</option>
                            <option value="none">Override: Baseline (None)</option>
                            <option value="input_filter">Override: Input Filter</option>
                            <option value="tool_policy">Override: Tool Policy</option>
                            <option value="spotlighting_output">Override: Spotlighting Output</option>
                            <option value="all_defenses">Override: All Defenses Combined</option>
                          </select>

                          <Button
                            size="sm"
                            variant="primary"
                            disabled={isReplaying}
                            onClick={() => handleReplay(trace.trace_id)}
                          >
                            {isReplaying ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                            ) : (
                              <RefreshCw className="h-3.5 w-3.5 mr-1" />
                            )}
                            Replay Trace
                          </Button>
                        </div>
                      </div>

                      {/* Replay outcome preview */}
                      {replay && (
                        <div className="mt-3 rounded border border-base-700 bg-base-900 p-3 text-xs">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant={replay.is_consistent ? 'success' : 'warning'}>
                                {replay.is_consistent
                                  ? 'Verdict Consistent with Baseline'
                                  : 'Verdict Diverged (Defense Intervened)'}
                              </Badge>
                              <span className="text-[11px] text-slate-400">
                                Defense tested: <strong>{replay.replayed_defense}</strong>
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono">
                              Replayed {replay.replayed_steps?.length || 0} turns
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-300">
                            <strong>Replayed Verdict:</strong>{' '}
                            {replay.replayed_verdict?.success ? (
                              <span className="text-danger-400">Vulnerable ({String(replay.replayed_verdict?.evidence ?? '')})</span>
                            ) : (
                              <span className="text-success-400">Neutralized / Blocked ({String(replay.replayed_verdict?.evidence ?? '')})</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
