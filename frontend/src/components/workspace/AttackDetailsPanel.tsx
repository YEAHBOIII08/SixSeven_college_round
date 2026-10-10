import { useState } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import type { AttackItem } from '@/types';
import {
  FileSearch,
  Copy,
  Check,
  ShieldAlert,
  Terminal,
  Cpu,
  Brain,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  XCircle,
  Sparkles,
} from 'lucide-react';

interface AttackDetailsPanelProps {
  attack: AttackItem | null;
}

export function AttackDetailsPanel({ attack }: AttackDetailsPanelProps) {
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const handleCopyPrompt = () => {
    if (!attack?.prompt) return;
    navigator.clipboard.writeText(attack.prompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const outcome = attack?.outcome || attack?.verdict;

  const getVerdictBadge = () => {
    switch (outcome) {
      case 'vulnerable':
        return <Badge variant="danger">Vulnerable</Badge>;
      case 'passed':
        return <Badge variant="success">Passed</Badge>;
      case 'inconclusive':
        return <Badge variant="warning">Inconclusive</Badge>;
      case 'error':
        return <Badge variant="danger">Error</Badge>;
      default:
        return <Badge variant="muted">{outcome || 'Recorded'}</Badge>;
    }
  };

  const getSeverityBadge = (severity?: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return <Badge variant="danger">Critical</Badge>;
      case 'high':
        return <Badge variant="danger">High</Badge>;
      case 'medium':
        return <Badge variant="warning">Medium</Badge>;
      case 'low':
        return <Badge variant="accent">Low</Badge>;
      default:
        return severity ? <Badge variant="muted">{severity}</Badge> : null;
    }
  };

  return (
    <Card className="flex h-full flex-col">
      <CardHeader
        title="Attack Inspection & Forensics"
        icon={<FileSearch className="h-4 w-4" />}
        action={attack ? getVerdictBadge() : null}
      />
      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
        {!attack ? (
          <EmptyState
            icon={<FileSearch className="h-7 w-7" />}
            title="No attack selected"
            description="Select an attack from the activity feed on the left to inspect the test prompt payload, sandbox target response, tool arguments, and evaluator forensic evidence."
          />
        ) : (
          <div className="space-y-4">
            {/* Metadata Header */}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">
                  {attack.name || attack.attack_name || attack.attack_id}
                </h3>
                {getSeverityBadge(attack.severity)}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <span className="font-mono text-slate-500">
                  ID: {attack.attack_id}
                </span>
                <span>•</span>
                <span className="capitalize text-slate-300">
                  Category: {attack.category || 'General'}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-slate-300">
                  {attack.source === 'llm' ? (
                    <>
                      <Sparkles className="h-3 w-3 text-accent-400" />
                      Adaptive Red-Team LLM
                    </>
                  ) : (
                    'Seed Catalog'
                  )}
                </span>
              </div>
            </div>

            {/* Verdict Box */}
            <div
              className={`rounded-lg border p-3 text-xs ${
                outcome === 'vulnerable'
                  ? 'border-danger-500/30 bg-danger-500/10 text-danger-300'
                  : outcome === 'passed'
                  ? 'border-success-500/30 bg-success-500/10 text-success-300'
                  : 'border-base-700 bg-base-800/60 text-slate-300'
              }`}
            >
              <div className="font-semibold uppercase tracking-wider text-[10px]">
                Deterministic Rule Verdict
              </div>
              <div className="mt-1 text-xs">
                {attack.explanation ||
                  (outcome === 'vulnerable'
                    ? 'Security invariant breached: policy violation detected in sandbox agent execution.'
                    : 'Target maintained expected security boundaries.')}
              </div>
              {attack.affected_data && (
                <div className="mt-2 text-[11px] font-mono">
                  Affected Sensitive Data: {attack.affected_data}
                </div>
              )}
            </div>

            {/* Prompt Payload */}
            <div>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 font-medium uppercase tracking-wider text-slate-400 text-[10px]">
                  <Terminal className="h-3 w-3 text-accent-400" />
                  Test Prompt Payload
                </span>
                <button
                  onClick={handleCopyPrompt}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
                >
                  {copiedPrompt ? (
                    <>
                      <Check className="h-3 w-3 text-success-400" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="max-h-40 overflow-y-auto rounded-lg border border-base-700/60 bg-base-950 p-3 font-mono text-xs text-amber-200/90 whitespace-pre-wrap break-words scrollbar-thin">
                {attack.prompt || 'No prompt recorded'}
              </pre>
            </div>

            {/* Target Response */}
            <div>
              <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Cpu className="h-3 w-3 text-accent-400" />
                Sandbox Target Agent Response
              </div>
              <pre className="max-h-40 overflow-y-auto rounded-lg border border-base-700/60 bg-base-950 p-3 font-mono text-xs text-slate-200 whitespace-pre-wrap break-words scrollbar-thin">
                {attack.target_response || '(No text response from target agent)'}
              </pre>
            </div>

            {/* Tool Calls & Execution */}
            {(attack.tool_calls && attack.tool_calls.length > 0) ||
            attack.execution ? (
              <div>
                <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Wrench className="h-3 w-3 text-accent-400" />
                  Tool Invocations & Execution Data
                </div>
                <div className="rounded-lg border border-base-700/60 bg-base-950 p-3 font-mono text-xs text-slate-300">
                  {attack.tool_calls && attack.tool_calls.length > 0 ? (
                    <div className="space-y-2">
                      {attack.tool_calls.map((tc, idx) => (
                        <div
                          key={idx}
                          className="rounded border border-base-800 bg-base-900/60 p-2"
                        >
                          <div className="text-accent-400 font-semibold">
                            {tc.tool_name}()
                          </div>
                          <pre className="mt-1 text-[11px] text-slate-400 whitespace-pre-wrap">
                            {JSON.stringify(tc.arguments, null, 2)}
                          </pre>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <pre className="max-h-32 overflow-y-auto text-[11px] text-slate-400 whitespace-pre-wrap">
                      {JSON.stringify(attack.execution, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            ) : null}

            {/* Invariant Evidence */}
            {attack.evidence && attack.evidence.length > 0 && (
              <div>
                <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-danger-400 flex items-center gap-1">
                  <ShieldAlert className="h-3 w-3" />
                  Forensic Invariant Evidence
                </div>
                <pre className="rounded-lg border border-danger-500/20 bg-danger-500/5 p-3 font-mono text-xs text-danger-300 whitespace-pre-wrap break-words">
                  {JSON.stringify(attack.evidence, null, 2)}
                </pre>
              </div>
            )}

            {/* Evaluator Assessment */}
            {attack.assessment && (
              <div>
                <div className="mb-1 text-[10px] font-medium uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                  <Brain className="h-3 w-3" />
                  Evaluator Assessment (Advisory)
                </div>
                <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3 text-xs text-cyan-200 space-y-1.5">
                  {attack.assessment.summary && (
                    <div>
                      <span className="font-semibold text-cyan-300">Summary: </span>
                      {attack.assessment.summary}
                    </div>
                  )}
                  {attack.assessment.confidence && (
                    <div>
                      <span className="font-semibold text-cyan-300">Confidence: </span>
                      <span className="capitalize font-mono">
                        {attack.assessment.confidence}
                      </span>
                    </div>
                  )}
                  {attack.assessment.observed_behavior && (
                    <div>
                      <span className="font-semibold text-cyan-300">
                        Observed Behavior:{' '}
                      </span>
                      {attack.assessment.observed_behavior}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Recommended Mitigation */}
            {attack.recommended_mitigation && (
              <div className="rounded-lg border border-accent-500/30 bg-accent-500/10 p-3 text-xs text-accent-200">
                <div className="font-semibold text-[10px] uppercase tracking-wider text-accent-300">
                  Recommended Mitigation
                </div>
                <p className="mt-1 text-slate-300">
                  {attack.recommended_mitigation}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
