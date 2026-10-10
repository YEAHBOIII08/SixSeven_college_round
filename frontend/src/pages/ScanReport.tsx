import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ButtonLink } from '@/components/ui/Button';
import { ReportOverview } from '@/components/report/ReportOverview';
import { ReportFindings } from '@/components/report/ReportFindings';
import { ReportAttackTimeline } from '@/components/report/ReportAttackTimeline';
import { ReportDefenseValidation } from '@/components/report/ReportDefenseValidation';
import { api } from '@/services/api';
import type { AttackItem, FindingRecord, ScanReportData, ScanRun } from '@/types';
import {
  LayoutDashboard,
  List,
  ShieldAlert,
  GitBranch,
  ShieldCheck,
  ArrowLeft,
  RefreshCw,
  Crosshair,
} from 'lucide-react';

type TabId = 'overview' | 'findings' | 'timeline' | 'defense';

interface TabDef {
  id: TabId;
  label: string;
  icon: typeof List;
}

export function ScanReport() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const [run, setRun] = useState<ScanRun | null>(null);
  const [report, setReport] = useState<ScanReportData | null>(null);
  const [attacks, setAttacks] = useState<AttackItem[]>([]);
  const [findings, setFindings] = useState<FindingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadReportData() {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);

      const [runData, reportData, attacksData, findingsData] =
        await Promise.allSettled([
          api.getRun(id),
          api.getRunReport(id),
          api.getRunAttacks(id),
          api.getFindings({ run_id: id }),
        ]);

      if (runData.status === 'fulfilled') {
        setRun(runData.value);
      }
      if (reportData.status === 'fulfilled') {
        setReport(reportData.value);
      }
      if (attacksData.status === 'fulfilled') {
        setAttacks(attacksData.value);
      }
      if (findingsData.status === 'fulfilled') {
        setFindings(findingsData.value);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load report');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReportData();
  }, [id]);

  const tabs: TabDef[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
    },
    {
      id: 'findings',
      label: `Findings (${findings.length})`,
      icon: ShieldAlert,
    },
    {
      id: 'timeline',
      label: `Attack Timeline (${attacks.length})`,
      icon: GitBranch,
    },
    {
      id: 'defense',
      label: 'Defense Validation',
      icon: ShieldCheck,
    },
  ];

  return (
    <AppLayout
      title={`Scan Report — ${run?.target_name || id || 'Security Audit'}`}
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={loadReportData}
            aria-label="Refresh report data"
            className="rounded-lg border border-base-700 bg-base-800 p-2 text-slate-400 hover:text-white"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <ButtonLink to="/workspace" variant="secondary" size="sm">
            <Crosshair className="h-3.5 w-3.5" />
            New Scan
          </ButtonLink>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-base-700 bg-base-800 px-3 py-1.5 text-xs font-medium text-slate-300 transition-all hover:border-accent-500/40 hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>
        </div>
      }
    >
      <div className="mx-auto max-w-6xl px-6 py-6">
        {/* Scan ID breadcrumb */}
        <div className="mb-5 flex items-center gap-2 text-xs text-slate-500">
          <ButtonLink to="/" variant="ghost" size="sm">
            Dashboard
          </ButtonLink>
          <span>/</span>
          <ButtonLink to="/reports" variant="ghost" size="sm">
            Reports
          </ButtonLink>
          <span>/</span>
          <span className="font-mono text-accent-400">{id ?? 'unknown'}</span>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-danger-500/30 bg-danger-500/10 p-4 text-xs text-danger-300">
            {error}
          </div>
        )}

        {/* Tab bar */}
        <div className="mb-6 flex flex-wrap gap-1 border-b border-base-700/60">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-semibold transition-all ${
                  isActive
                    ? 'border-accent-500 text-accent-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        {loading ? (
          <div className="flex items-center justify-center p-20 text-slate-400">
            <RefreshCw className="mr-2 h-5 w-5 animate-spin text-accent-400" />
            Loading security scan report...
          </div>
        ) : (
          <div className="pb-8">
            {activeTab === 'overview' && (
              <ReportOverview run={run} report={report} attacks={attacks} />
            )}
            {activeTab === 'findings' && <ReportFindings findings={findings} />}
            {activeTab === 'timeline' && (
              <ReportAttackTimeline attacks={attacks} />
            )}
            {activeTab === 'defense' && (
              <ReportDefenseValidation
                run={run}
                attacks={attacks}
                findings={findings}
              />
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
