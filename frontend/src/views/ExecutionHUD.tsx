import { useEffect, useState } from 'react';
import { ArrowLeft, Shield, Terminal, CheckCircle2, XCircle, LoaderCircle } from 'lucide-react';
import type { TargetConfig } from '../types';

export interface ScanAttempt {
  attack_id: string;
  name?: string;
  attack_name?: string;
  category?: string;
  severity?: string;
  source?: string;
  status?: string;
  prompt?: string;
  outcome?: string;
  verdict?: string;
  explanation?: string;
  evidence?: unknown[];
  execution?: Record<string, unknown> | null;
  target_response?: string | null;
  assessment?: Record<string, unknown> | null;
  assessment_error?: string | null;
  rejection_reason?: string;
  recommended_mitigation?: string;
  affected_data?: string | null;
}

export interface Scan {
  run_id: string;
  target_name?: string;
  status: string;
  scan_mode?: string;
  completed: number;
  attempted?: number;
  total: number;
  counts: Record<string, number>;
  results: ScanAttempt[];
  attempts?: ScanAttempt[];
  findings?: Record<string, unknown>[];
  llm_usage?: Record<string, unknown>[];
  budgets?: Record<string, number>;
  rounds_completed?: number;
  stop_reason?: string | null;
  error?: { type?: string; message?: string };
  created_at: string;
}
interface Props { config: TargetConfig; onComplete: (scan: Scan) => void; onBack: () => void }

const terminalStates = ['completed', 'failed', 'cancelled', 'timed_out'];
const pretty = (value: unknown) => JSON.stringify(value ?? {}, null, 2);

export default function ExecutionHUD({ config, onComplete, onBack }: Props) {
  const [scan, setScan] = useState<Scan | null>(null);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    let alive = true;
    let source: EventSource | undefined;
    let poll: ReturnType<typeof setInterval> | undefined;
    let currentId = '';

    const refresh = async (id: string) => {
      try {
        const response = await fetch(`/api/runs/${id}`);
        const data = await response.json();
        if (!response.ok) throw new Error(typeof data.detail === 'string' ? data.detail : 'Could not load scan status');
        if (!alive) return;
        if (terminalStates.includes(data.status)) {
          const [attemptResponse, reportResponse] = await Promise.all([
            fetch(`/api/runs/${id}/attacks`), fetch(`/api/runs/${id}/report`),
          ]);
          const attempts = attemptResponse.ok ? await attemptResponse.json() : [];
          const report = reportResponse.ok ? await reportResponse.json() : {};
          if (!alive) return;
          data.attempts = attempts;
          data.findings = report.findings ?? [];
          data.llm_usage = data.llm_usage ?? [];
          if (poll) clearInterval(poll);
          source?.close();
        }
        setScan(data);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : 'Scan status unavailable');
      }
    };

    (async () => {
      try {
        const response = await fetch('/api/runs', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            target_name: 'CustomerSupportAgent', scan_mode: config.scanMode ?? 'deterministic',
            max_tests: config.maxTests ?? 10, max_rounds: config.maxRounds ?? 3,
            timeout_seconds: config.timeoutSeconds ?? 180, vulnerable_mode: !!config.vulnerableMode,
          }),
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(typeof payload.detail === 'string' ? payload.detail : 'Could not start sandbox scan');
        if (!alive) return;
        currentId = payload.run_id;
        await refresh(currentId);
        source = new EventSource(`/api/runs/${currentId}/events`);
        source.onmessage = () => refresh(currentId);
        ['scan_progress', 'attack_started', 'attack_completed', 'finding_detected', 'scan_completed', 'scan_failed', 'scan_cancelled'].forEach(event => source?.addEventListener(event, () => refresh(currentId)));
        source.onerror = () => refresh(currentId);
        poll = setInterval(() => refresh(currentId), 1000);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : 'Scan could not start');
      }
    })();

    return () => { alive = false; source?.close(); if (poll) clearInterval(poll); };
  }, [config.scanMode, config.maxTests, config.maxRounds, config.timeoutSeconds, config.vulnerableMode]);

  async function cancelScan() {
    if (!scan?.run_id) return;
    setCancelling(true);
    try {
      const response = await fetch(`/api/runs/${scan.run_id}/cancel`, { method: 'POST' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.detail || 'Could not cancel scan');
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not cancel scan'); }
    finally { setCancelling(false); }
  }

  const progress = scan?.total ? Math.min(100, Math.round(scan.completed / scan.total * 100)) : 0;
  const attempts = scan?.attempts ?? scan?.results ?? [];
  const active = !!scan && !terminalStates.includes(scan.status);

  return <div className="min-h-screen bg-slate-950 bg-grid bg-radial-glow">
    <header className="border-b border-zinc-800 bg-zinc-900/50"><div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-3"><button onClick={onBack} className="text-zinc-400" aria-label="Back to setup"><ArrowLeft /></button><Shield className="text-blue-500" /><div><h1 className="text-white font-bold">Sandbox Security Scan</h1><p className="text-xs text-zinc-500">{config.name} · {config.vulnerableMode ? 'Vulnerable' : 'Secure'} profile · {config.scanMode === 'adaptive' ? 'Adaptive Gemini' : 'Deterministic catalog'}</p></div></div></header>
    <main className="max-w-5xl mx-auto p-6 space-y-5">
      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <div className="flex flex-wrap justify-between gap-2 mb-3 text-sm"><span className="text-white">{scan?.status ?? 'Starting scan'} · {scan?.run_id ?? ''}</span><span className="text-blue-400">{progress}%</span></div>
        <div className="h-2 bg-slate-950 rounded"><div className="h-full bg-blue-500 rounded transition-all" style={{ width: `${progress}%` }} /></div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">{['vulnerable', 'passed', 'inconclusive', 'error'].map(key => <div key={key} className="bg-slate-950 rounded-lg p-3 text-center"><div className="text-xl text-white">{scan?.counts?.[key] ?? 0}</div><div className="text-xs text-zinc-500 capitalize">{key}</div></div>)}</div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-400"><span>{scan?.completed ?? 0} executed · {attempts.length} prompts recorded · {scan?.rounds_completed ?? 0} generation rounds</span>{active && <button type="button" onClick={cancelScan} disabled={cancelling} className="inline-flex items-center gap-2 rounded-lg border border-rose-800 px-3 py-2 text-rose-300 disabled:opacity-50">{cancelling ? <LoaderCircle size={14} className="animate-spin" /> : <XCircle size={14} />} Cancel scan</button>}</div>
        {scan?.stop_reason && <p className="mt-3 text-xs text-zinc-500">Stop reason: {scan.stop_reason.replace(/_/g, ' ')}</p>}
        {scan?.error && <p role="alert" className="mt-3 text-sm text-rose-300">{scan.error.message || scan.error.type}</p>}
        {error && <p role="alert" className="text-rose-400 mt-4">{error}</p>}
      </section>

      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5"><div className="flex gap-2 items-center mb-3 text-blue-400"><Terminal size={16} /> Prompt and execution trace</div>
        <div className="space-y-3">{attempts.map((attempt, index) => <details key={attempt.attack_id} className="bg-slate-950 border border-zinc-800 rounded-xl p-4" open={index === 0}><summary className="cursor-pointer flex flex-wrap items-center justify-between gap-2 text-sm"><span className="text-white">{attempt.name ?? attempt.attack_name ?? attempt.attack_id}</span><span className="text-xs text-zinc-400">{attempt.source ?? 'catalog'} · {attempt.status ?? attempt.outcome ?? 'recorded'}</span></summary>
          <div className="mt-3 space-y-3"><div><p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Generated prompt</p><pre className="text-xs text-amber-200 whitespace-pre-wrap break-words">{attempt.prompt ?? 'Prompt unavailable'}</pre></div>
            {attempt.rejection_reason && <p className="text-xs text-amber-300">Not executed: {attempt.rejection_reason}</p>}
            {attempt.explanation && <p className="text-xs text-zinc-300">Deterministic verdict: {attempt.outcome ?? attempt.verdict} — {attempt.explanation}</p>}
            {attempt.target_response && <div><p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Target response</p><pre className="text-xs text-zinc-300 whitespace-pre-wrap break-words">{attempt.target_response}</pre></div>}
            {attempt.evidence && attempt.evidence.length > 0 && <div><p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Evidence</p><pre className="text-xs text-emerald-200 whitespace-pre-wrap break-words">{pretty(attempt.evidence)}</pre></div>}
            {attempt.assessment && <div><p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1">Evaluator assessment (advisory)</p><pre className="text-xs text-cyan-200 whitespace-pre-wrap break-words">{pretty(attempt.assessment)}</pre></div>}
            {attempt.assessment_error && <p className="text-xs text-amber-300">Evaluator: {attempt.assessment_error}</p>}
            {attempt.execution && <details><summary className="cursor-pointer text-xs text-zinc-400">Full tool execution data</summary><pre className="mt-2 text-xs text-zinc-400 whitespace-pre-wrap break-words">{pretty(attempt.execution)}</pre></details>}
          </div></details>)}{attempts.length === 0 && <p className="text-sm text-zinc-500">Waiting for generated prompts and target execution…</p>}</div>
      </section>
      {scan && terminalStates.includes(scan.status) && <button onClick={() => onComplete(scan)} className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl p-4 flex justify-center gap-2"><CheckCircle2 size={18} /> View full scan report</button>}
    </main>
  </div>;
}
