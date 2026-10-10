import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import type { FindingRecord, Severity } from '@/types';
import {
  ShieldAlert,
  Search,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Tag,
  ShieldCheck,
} from 'lucide-react';

interface ReportFindingsProps {
  findings: FindingRecord[];
}

export function ReportFindings({ findings }: ReportFindingsProps) {
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const filteredFindings = findings.filter((f) => {
    const matchesFilter =
      filter === 'all' || f.severity?.toLowerCase() === filter.toLowerCase();
    const matchesSearch =
      search === '' ||
      f.title?.toLowerCase().includes(search.toLowerCase()) ||
      f.description?.toLowerCase().includes(search.toLowerCase()) ||
      f.category?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getSeverityBadge = (severity?: Severity) => {
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
        return <Badge variant="muted">{severity || 'Info'}</Badge>;
    }
  };

  return (
    <Card>
      <div className="flex flex-col gap-3 border-b border-base-700/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <ShieldAlert className="h-4 w-4 text-accent-400" />
          <h3 className="text-sm font-semibold tracking-wide text-slate-200">
            Identified Vulnerability Findings ({findings.length})
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Severity filter buttons */}
          <div className="flex items-center rounded-lg border border-base-700 bg-base-850 p-0.5 text-xs">
            {['all', 'critical', 'high', 'medium', 'low'].map((sev) => (
              <button
                key={sev}
                onClick={() => setFilter(sev)}
                className={`rounded-md px-2.5 py-1 capitalize transition-all ${
                  filter === sev
                    ? 'bg-accent-600 text-white font-medium'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter findings..."
              className="w-48 rounded-lg border border-base-700 bg-base-800 py-1.5 pl-8 pr-3 text-xs text-slate-300 placeholder-slate-500 focus:border-accent-500/50 focus:outline-none focus:ring-1 focus:ring-accent-500/30"
            />
          </div>
        </div>
      </div>

      {findings.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck className="h-7 w-7 text-success-400" />}
          title="Zero vulnerability findings"
          description="The sandboxed AI agent successfully defended against all tested adversarial prompts without policy violations."
        />
      ) : filteredFindings.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-400">
          No findings match the selected severity or search filter.
        </div>
      ) : (
        <div className="divide-y divide-base-700/60">
          {filteredFindings.map((finding, idx) => {
            const mitigation =
              finding.recommended_mitigation ||
              finding.recommendation ||
              'Implement input sanitization guardrails and enforce strict parameter schemas on all tools.';

            return (
              <div key={finding.finding_id || idx} className="p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-slate-500">
                      #{idx + 1}
                    </span>
                    <h4 className="text-sm font-bold text-white">
                      {finding.title || 'Security Invariant Breach'}
                    </h4>
                    {getSeverityBadge(finding.severity)}
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 rounded bg-base-800 px-2 py-0.5 text-[11px] text-slate-300 border border-base-700">
                      <Tag className="h-3 w-3 text-accent-400" />
                      {finding.category}
                    </span>
                    {finding.reproducibility_status && (
                      <Badge variant="accent">
                        {finding.reproducibility_status}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-300 leading-relaxed">
                  {finding.description}
                </p>

                {/* Evidence */}
                {finding.evidence && finding.evidence.length > 0 && (
                  <div className="rounded-lg border border-danger-500/20 bg-danger-500/5 p-3 text-xs">
                    <div className="font-semibold uppercase tracking-wider text-[10px] text-danger-400 mb-1 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Recorded Violation Evidence
                    </div>
                    <pre className="font-mono text-[11px] text-danger-300 whitespace-pre-wrap break-words">
                      {JSON.stringify(finding.evidence, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Remediation */}
                <div className="rounded-lg border border-accent-500/30 bg-accent-500/10 p-3 text-xs">
                  <div className="font-semibold uppercase tracking-wider text-[10px] text-accent-300 mb-1 flex items-center gap-1">
                    <Wrench className="h-3 w-3 text-accent-400" />
                    Recommended Remediation
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    {mitigation}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
