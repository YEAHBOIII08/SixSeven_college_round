import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { api } from '@/services/api';
import type { DefenseEvaluationResponse, BenignTask } from '@/types';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Percent,
  TrendingDown,
  Layers,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  FileText,
  Activity,
  Cpu,
} from 'lucide-react';

export function DefenseEvaluation() {
  const [data, setData] = useState<DefenseEvaluationResponse | null>(null);
  const [benignSuite, setBenignSuite] = useState<BenignTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'matrix' | 'benign'>('matrix');

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const [evalRes, benignRes] = await Promise.allSettled([
        api.evaluateDefenses(),
        api.getBenignSuite(),
      ]);

      if (evalRes.status === 'fulfilled') {
        setData(evalRes.value);
      } else {
        setError(evalRes.reason?.message || 'Failed to load defense evaluation');
      }

      if (benignRes.status === 'fulfilled') {
        setBenignSuite(benignRes.value);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error evaluating defenses');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleRunEvaluation = async () => {
    try {
      setEvaluating(true);
      setError(null);
      const res = await api.evaluateDefenses();
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Evaluation failed');
    } finally {
      setEvaluating(false);
    }
  };

  const configs = data?.matrix ? Object.values(data.matrix) : [];

  return (
    <AppLayout
      title="Defense Evaluation Matrix"
      actions={
        <Button
          variant="primary"
          onClick={handleRunEvaluation}
          disabled={evaluating}
        >
          {evaluating ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-1.5" />
          )}
          Run Full Defense Evaluation Suite
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Intro Banner */}
        <Card className="border-accent-500/30 bg-accent-500/5 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="h-4.5 w-4.5 text-accent-400" />
                PRD Section 8: Defense Effectiveness vs. Utility Cost Trade-Off
              </h2>
              <p className="mt-1 text-xs text-slate-400 max-w-3xl leading-relaxed">
                AgentBreak re-executes the complete 5-surface attack suite against hardened target configurations,
                and contrasts <strong>Attack Success Rate (ASR)</strong> against the <strong>Benign Task Success Rate (BTSR)</strong> on 10 legitimate customer support tasks to verify defenses do not harm regular agent usability.
              </p>
            </div>
            {data && (
              <div className="flex items-center gap-2">
                <Badge variant="success">
                  Replay Consistency: {Math.round((data.replay_consistency ?? 1) * 100)}%
                </Badge>
                <Badge variant="accent">
                  5 Surfaces Tested
                </Badge>
              </div>
            )}
          </div>
        </Card>

        {error && (
          <div className="rounded-lg border border-danger-500/30 bg-danger-500/10 p-4 flex items-center justify-between gap-4 text-xs text-danger-300">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-danger-400" />
              <span>{error}</span>
            </div>
            <Button variant="secondary" size="sm" onClick={loadData}>
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              Retry
            </Button>
          </div>
        )}

        {/* Tab switch */}
        <div className="flex items-center gap-2 border-b border-base-700/60 pb-3">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'matrix'
                ? 'bg-accent-500/20 text-accent-300 border border-accent-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Defense Effectiveness Matrix
          </button>
          <button
            onClick={() => setActiveTab('benign')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'benign'
                ? 'bg-accent-500/20 text-accent-300 border border-accent-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Benign Task Suite ({benignSuite.length} Tasks)
          </button>
        </div>

        {loading ? (
          <Card className="flex items-center justify-center p-16">
            <div className="flex items-center gap-3 text-sm text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin text-accent-400" />
              Evaluating defenses against attack suite and benign tasks...
            </div>
          </Card>
        ) : activeTab === 'matrix' ? (
          configs.length === 0 ? (
            <Card className="p-12 text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-full bg-base-800 flex items-center justify-center text-slate-400">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">No Defense Evaluation Data Loaded</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  Click below to execute the evaluation suite across all 5 vulnerability surfaces and measure Attack Success Rate (ASR) against hardened defense configurations.
                </p>
              </div>
              <Button variant="primary" onClick={handleRunEvaluation} disabled={evaluating}>
                {evaluating ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-1.5" />
                )}
                Run Defense Evaluation Suite
              </Button>
            </Card>
          ) : (
            <>
              {/* Defense Configurations Table */}
              <Card>
                <CardHeader
                  title="Defense Comparison (ASR, Block Rate, BTSR, Utility Cost)"
                  icon={<Layers className="h-4 w-4 text-accent-400" />}
                />
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-base-700/60 bg-base-850/80 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      <tr>
                        <th className="py-3 px-4">Defense Configuration</th>
                        <th className="py-3 px-4">Attack Success Rate (ASR)</th>
                        <th className="py-3 px-4">Defense Block Rate</th>
                        <th className="py-3 px-4">Benign Task Success (BTSR)</th>
                        <th className="py-3 px-4">Utility Cost</th>
                        <th className="py-3 px-4">Attacks Stopped</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-base-700/40 text-slate-300">
                      {configs
                        .filter((c) => c.config_key !== 'none' && !c.label.toLowerCase().includes('baseline'))
                        .map((c) => {
                        const asrPercent = Math.round((c.asr ?? 0) * 100);
                        const blockPercent = Math.round((c.defense_block_rate ?? 0) * 100);
                        const btsrPercent = Math.round((c.btsr ?? 0) * 100);
                        const costPercent = Math.round((c.utility_cost ?? 0) * 100);
                        const completedTasks = c.benign_summary?.completed_tasks ?? 0;
                        const totalTasks = c.benign_summary?.total_tasks ?? 0;
                        const successfulAttacks = c.successful_attacks ?? 0;
                        const totalAttacks = c.total_attacks ?? 0;
                        const stoppedAttacks = Math.max(0, totalAttacks - successfulAttacks);

                        return (
                          <tr key={c.config_key} className="hover:bg-base-800/40">
                            <td className="py-3.5 px-4 font-medium text-white">
                              <div className="flex items-center gap-2">
                                {c.config_key === 'all_defenses' ? (
                                  <ShieldCheck className="h-4 w-4 text-success-400" />
                                ) : c.config_key === 'none' ? (
                                  <ShieldAlert className="h-4 w-4 text-danger-400" />
                                ) : (
                                  <Shield className="h-4 w-4 text-accent-400" />
                                )}
                                <span>{c.label}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`font-semibold ${
                                  asrPercent > 50 ? 'text-danger-400' : 'text-success-400'
                                }`}
                              >
                                {asrPercent}%
                              </span>
                              <span className="text-[10px] text-slate-500 ml-1.5">
                                ({successfulAttacks}/{totalAttacks})
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="font-semibold text-accent-300">
                                {blockPercent}%
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`font-semibold ${
                                  btsrPercent >= 90 ? 'text-success-400' : 'text-warning-400'
                                }`}
                              >
                                {btsrPercent}%
                              </span>
                              <span className="text-[10px] text-slate-500 ml-1.5">
                                ({completedTasks}/{totalTasks})
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`font-semibold ${
                                  costPercent === 0 ? 'text-success-400' : 'text-warning-400'
                                }`}
                              >
                                {costPercent}%
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <Badge
                                variant={stoppedAttacks > 0 ? 'success' : 'muted'}
                              >
                                {stoppedAttacks} attacks stopped
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Surface Breakdown Matrix */}
              <Card>
                <CardHeader
                  title="ASR Breakdown per Vulnerability Surface"
                  icon={<Activity className="h-4 w-4 text-accent-400" />}
                />
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-base-700/60 bg-base-850/80 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      <tr>
                        <th className="py-3 px-4">Defense Configuration</th>
                        <th className="py-3 px-4">Instructions</th>
                        <th className="py-3 px-4">Memory</th>
                        <th className="py-3 px-4">Retrieved Content</th>
                        <th className="py-3 px-4">Tool Permissions</th>
                        <th className="py-3 px-4">Multi-Step Execution</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-base-700/40 text-slate-300">
                      {configs
                        .filter((c) => c.config_key !== 'none' && !c.label.toLowerCase().includes('baseline'))
                        .map((c) => (
                        <tr key={c.config_key} className="hover:bg-base-800/40">
                          <td className="py-3 px-4 font-medium text-white">{c.label}</td>
                          {['instructions', 'memory', 'retrieved_content', 'tool_permissions', 'multi_step'].map(
                            (surf) => {
                              const sData = c.surface_breakdown?.[surf];
                              const sAsr = sData && typeof sData.asr === 'number' ? Math.round(sData.asr * 100) : 0;
                              return (
                                <td key={surf} className="py-3 px-4">
                                  <span
                                    className={`font-mono font-semibold ${
                                      sAsr > 50
                                        ? 'text-danger-400'
                                        : sAsr > 0
                                        ? 'text-warning-400'
                                        : 'text-success-400'
                                    }`}
                                  >
                                    {sAsr}%
                                  </span>
                                  {sData && (
                                    <span className="text-[10px] text-slate-500 ml-1">
                                      ({sData.vulnerable ?? 0}/{sData.total ?? 0})
                                    </span>
                                  )}
                                </td>
                              );
                            }
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )
        ) : (
          /* Benign Tasks View */
          <Card>
            <CardHeader
              title="Benign Task Suite (Legitimate Agent Utility Validation)"
              icon={<CheckCircle2 className="h-4 w-4 text-success-400" />}
            />
            <div className="p-4 border-b border-base-700/60 text-xs text-slate-400">
              The benign suite verifies that hardened defenses do not falsely block ordinary, authorized customer requests.
            </div>
            <div className="divide-y divide-base-700/40">
              {benignSuite.map((task) => (
                <div key={task.task_id} className="p-4 hover:bg-base-800/30">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-accent-300">
                        {task.task_id}
                      </span>
                      <span className="text-xs font-medium text-white">{task.name}</span>
                      <Badge variant="default">{task.category}</Badge>
                      {task.expected_tool && (
                        <Badge variant="accent" className="font-mono text-[10px]">
                          tool: {task.expected_tool}
                        </Badge>
                      )}
                    </div>
                    <Badge variant="success">Actor: {task.actor_id}</Badge>
                  </div>
                  <div className="text-xs text-slate-300 font-mono bg-base-900/60 p-2.5 rounded border border-base-800">
                    &quot;{task.prompt}&quot;
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
