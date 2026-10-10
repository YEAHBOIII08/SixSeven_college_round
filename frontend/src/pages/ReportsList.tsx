import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { ButtonLink } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { api } from '@/services/api';
import type { ScanRun } from '@/types';
import {
  FileText,
  Clock,
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';

export function ReportsList() {
  const [runs, setRuns] = useState<ScanRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadRuns() {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getRuns();
      setRuns(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRuns();
  }, []);

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
      title="Security Reports"
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={loadRuns}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-base-700 bg-base-800 px-3 py-2 text-xs font-medium text-slate-300 transition-all hover:bg-base-700 hover:text-white disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <ButtonLink to="/workspace" size="sm">
            <Plus className="h-3.5 w-3.5" />
            New Scan
          </ButtonLink>
        </div>
      }
    >
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">
              Scan Reports History
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Audit results, vulnerability assessments, and mitigation records for
              all evaluated targets.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-danger-500/30 bg-danger-500/10 p-4 text-sm text-danger-300">
            {error}
          </div>
        )}

        <Card>
          <div className="flex items-center justify-between border-b border-base-700/60 px-5 py-4">
            <div className="flex items-center gap-2.5">
              <FileText className="h-4 w-4 text-accent-400" />
              <h3 className="text-sm font-semibold tracking-wide text-slate-200">
                All Completed & In-Progress Audits ({runs.length})
              </h3>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center p-12 text-slate-400">
              <RefreshCw className="mr-2 h-5 w-5 animate-spin text-accent-400" />
              Loading security reports...
            </div>
          ) : runs.length === 0 ? (
            <EmptyState
              icon={<Shield className="h-7 w-7" />}
              title="No reports generated yet"
              description="Launch a security scan in the workspace to evaluate a sandbox agent and generate reports."
              action={
                <ButtonLink to="/workspace" size="md">
                  <Plus className="h-4 w-4" />
                  Launch First Scan
                </ButtonLink>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-base-700/60 bg-base-850/60 text-xs uppercase tracking-wider text-slate-400">
                    <th className="px-5 py-3 font-medium">Scan ID / Target</th>
                    <th className="px-5 py-3 font-medium">Mode</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Results</th>
                    <th className="px-5 py-3 font-medium">Date & Time</th>
                    <th className="px-5 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-base-700/40 text-slate-300">
                  {runs.map((run) => {
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
                              Vulnerable Profile
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
                              / {total} total
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-slate-500" />
                            {new Date(run.created_at).toLocaleString()}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <ButtonLink
                            to={`/reports/${run.run_id}`}
                            variant="secondary"
                            size="sm"
                          >
                            <span>View Report</span>
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
