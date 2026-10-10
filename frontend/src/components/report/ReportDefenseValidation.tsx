import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import type { AttackItem, FindingRecord, ScanRun } from '@/types';
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Lock,
  FileCode,
  Layers,
  Key,
} from 'lucide-react';

interface ReportDefenseValidationProps {
  run: ScanRun | null;
  attacks: AttackItem[];
  findings: FindingRecord[];
}

export function ReportDefenseValidation({
  run,
  attacks,
  findings,
}: ReportDefenseValidationProps) {
  const passedAttacks = attacks.filter(
    (a) => (a.outcome || a.verdict) === 'passed'
  );
  const breachedAttacks = attacks.filter(
    (a) => (a.outcome || a.verdict) === 'vulnerable'
  );

  return (
    <div className="space-y-6">
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
            neutralized prompt injection or blocked unauthorized tool operations.
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
              <code className="text-accent-300">CANARY-999</code>) in backend databases
              and instrument egress monitoring. Any response containing canary tokens
              triggers an immediate kill-switch and security alert.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
