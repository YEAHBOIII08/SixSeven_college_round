import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { ButtonLink } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { api } from '@/services/api';
import type { BackendHealth, FindingRecord, ScanRun } from '@/types';
import {
  Plus,
  Radar,
  Shield,
  Crosshair,
  Activity,
  Clock,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Server,
  Zap,
} from 'lucide-react';

export function Dashboard() {
  const [runs, setRuns] = useState<ScanRun[]>([]);
  const [findings, setFindings] = useState<FindingRecord[]>([]);
  const [health, setHealth] = useState<BackendHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadDashboardData() {
    try {
      setLoading(true);
      setError(null);
      const [healthData, runsData, findingsData] = await Promise.allSettled([
        api.getHealth(),
        api.getRuns(),
        api.getFindings(),
      ]);

      if (healthData.status === 'fulfilled') {
        setHealth(healthData.value);
      } else {
        setHealth(null);
      }

      if (runsData.status === 'fulfilled') {
        setRuns(runsData.value);
      }

      if (findingsData.status === 'fulfilled') {
        setFindings(findingsData.value);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading dashboard');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboardData();
  }, []);

  const totalScans = runs.length;
  const activeScans = runs.filter(
    (r) => r.status === 'running' || r.status === 'pending'
  ).length;
  const totalFindings = findings.length;

  const recentRuns = [...runs]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, 5);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">Completed</Badge>;
      case 'running':
        return (
          <Badge variant="accent" dot>
            Running
          </Badge>
        );
      case 'failed':
      case 'cancelled':
      case 'timed_out':
        return <Badge variant="danger">{status}</Badge>;
      default:
        return <Badge variant="muted">{status}</Badge>;
    }
  };

  return (
    <AppLayout
      title="Dashboard"
      actions={
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-base-700/60 bg-base-800/80 px-3 py-1.5 text-xs">
            <span
              className={`h-2 w-2 rounded-full ${
                health
                  ? 'bg-success-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]'
                  : 'bg-danger-400 animate-pulse'
              }`}
            />
            <span className="font-medium text-slate-300">
              {health
                ? `Backend Online (v${health.version})`
                : 'Connecting to Backend...'}
            </span>
          </div>

          <button
            onClick={loadDashboardData}
            disabled={loading}
            aria-label="Refresh dashboard data"
            className="rounded-lg border border-base-700 bg-base-800 p-2 text-slate-400 transition-colors hover:text-white disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      }
    >
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Hero / Branding */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-accent-400/70">
            <Shield className="h-3.5 w-3.5" />
            AI Agent Security Testing Platform
          </div>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-white">
            Welcome to AgentBreak Console
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Evaluate and harden LLM agents against prompt injection, privilege
            escalation, and unauthorized tool invocation in sandboxed environments.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-danger-500/30 bg-danger-500/10 p-4 text-sm text-danger-300">
            {error}
          </div>
        )}

        {/* Quick-start CTA card */}
        <Card className="mb-8 overflow-hidden" hover>
          <div className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-accent-500/30 bg-accent-500/10 text-accent-400">
                <Crosshair className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">
                  Launch Security Scan Workspace
                </h3>
                <p className="text-sm text-slate-400">
                  Configure adversarial tests against local customer support sandbox
                  targets using deterministic rule checks or adaptive Gemini red-teaming.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ButtonLink to="/workspace" size="lg">
                <Plus className="h-5 w-5" />
                Start New Scan
              </ButtonLink>
            </div>
          </div>
        </Card>

        {/* Stats row — live connected data */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            icon={<Radar className="h-5 w-5" />}
            label="Total Audits"
            value={loading ? '...' : totalScans.toString()}
            sublabel={totalScans === 0 ? 'No scans executed yet' : `${totalScans} audit sessions`}
          />
          <StatCard
            icon={<Activity className="h-5 w-5" />}
            label="Active Scans"
            value={loading ? '...' : activeScans.toString()}
            sublabel={activeScans > 0 ? `${activeScans} currently executing` : 'None in progress'}
            badge={
              activeScans > 0 ? (
                <Badge variant="accent" dot>
                  Active
                </Badge>
              ) : null
            }
          />
          <StatCard
            icon={<Shield className="h-5 w-5" />}
            label="Findings Reported"
            value={loading ? '...' : totalFindings.toString()}
            sublabel={
              totalFindings > 0
                ? `${totalFindings} vulnerabilities surfaced`
                : 'Zero vulnerabilities reported'
            }
          />
        </div>

        {/* Recent scans table */}
        <Card>
          <div className="flex items-center justify-between border-b border-base-700/60 px-5 py-4">
            <div className="flex items-center gap-2.5">
              <Clock className="h-4 w-4 text-accent-400" />
              <h3 className="text-sm font-semibold tracking-wide text-slate-200">
                Recent Security Audits
              </h3>
            </div>
            {runs.length > 0 && (
              <ButtonLink to="/reports" variant="ghost" size="sm">
                View All Scans ({runs.length})
                <ArrowRight className="h-3.5 w-3.5" />
              </ButtonLink>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center p-12 text-slate-400">
              <RefreshCw className="mr-2 h-5 w-5 animate-spin text-accent-400" />
              Loading recent scans...
            </div>
          ) : recentRuns.length === 0 ? (
            <EmptyState
              icon={<Radar className="h-7 w-7" />}
              title="No scans executed yet"
              description="Start your first security scan in the workspace to evaluate a sandboxed AI agent."
              action={
                <ButtonLink to="/workspace" variant="secondary" size="md">
                  <Plus className="h-4 w-4" />
                  Start New Scan
                </ButtonLink>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-base-700/60 bg-base-850/60 text-xs uppercase tracking-wider text-slate-400">
                    <th className="px-5 py-3 font-medium">Target Agent</th>
                    <th className="px-5 py-3 font-medium">Mode</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Verdicts</th>
                    <th className="px-5 py-3 font-medium">Timestamp</th>
                    <th className="px-5 py-3 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-base-700/40 text-slate-300">
                  {recentRuns.map((run) => {
                    const vuln = run.counts?.vulnerable ?? 0;
                    const passed = run.counts?.passed ?? 0;
                    const total = run.total || run.completed || 0;

                    return (
                      <tr
                        key={run.run_id}
                        className="transition-colors hover:bg-base-800/40"
                      >
                        <td className="px-5 py-4">
                          <div className="font-medium text-white">
                            {run.target_name || 'CustomerSupportAgent'}
                          </div>
                          <div className="font-mono text-xs text-slate-500">
                            {run.run_id}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="capitalize text-slate-300">
                            {run.scan_mode || 'deterministic'}
                          </span>
                          {run.vulnerable_mode && (
                            <span className="ml-1.5 rounded bg-warning-500/10 px-1.5 py-0.5 text-[10px] font-medium text-warning-400 border border-warning-500/20">
                              Vulnerable
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          {getStatusBadge(run.status)}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3 text-xs">
                            <span className="flex items-center gap-1 text-danger-400">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              {vuln} vuln
                            </span>
                            <span className="flex items-center gap-1 text-success-400">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              {passed} pass
                            </span>
                            <span className="text-slate-500">
                              / {total} tests
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-400">
                          {new Date(run.created_at).toLocaleString()}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <ButtonLink
                            to={`/reports/${run.run_id}`}
                            variant="secondary"
                            size="sm"
                          >
                            <span>Report</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </ButtonLink>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}

function StatCard({
  icon,
  label,
  value,
  sublabel,
  badge,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sublabel: string;
  badge?: React.ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5 text-slate-400">
          <span className="text-accent-400">{icon}</span>
          <span className="text-sm font-medium">{label}</span>
        </div>
        {badge}
      </div>
      <div className="mt-3 text-2xl font-bold text-white">{value}</div>
      <div className="mt-1 text-xs text-slate-400">{sublabel}</div>
    </Card>
  );
}
