import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  ArrowLeft,
  Home,
  ChevronRight,
  X,
  Code,
  MessageSquare,
  AlertOctagon,
  AlertTriangle,
  ShieldCheck,
  Lightbulb,
  Copy,
  Check,
} from 'lucide-react';
import { REMEDIATION_ROWS } from '../data/mockData';
import { riskColors } from '../utils/ui';
import type { RemediationRow } from '../types';

interface DefensiveMeasuresProps {
  onBack: () => void;
  onBackToHome: () => void;
}

const severityIcon = {
  crit: AlertOctagon,
  warn: AlertTriangle,
  safe: ShieldCheck,
};

export default function DefensiveMeasures({ onBack, onBackToHome }: DefensiveMeasuresProps) {
  const [selected, setSelected] = useState<RemediationRow | null>(null);
  const [filter, setFilter] = useState<'all' | 'crit' | 'warn' | 'safe'>('all');
  const [copiedTab, setCopiedTab] = useState<string | null>(null);

  const filteredRows =
    filter === 'all'
      ? REMEDIATION_ROWS
      : REMEDIATION_ROWS.filter((r) => r.severity === filter);

  function copyToClipboard(text: string, tab: string) {
    navigator.clipboard.writeText(text);
    setCopiedTab(tab);
    setTimeout(() => setCopiedTab(null), 1500);
  }

  return (
    <div className="min-h-screen bg-slate-950 bg-grid bg-radial-glow">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight">Defensive Measures</h1>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Remediation Actions & Patches</p>
            </div>
          </div>
          <button
            onClick={onBackToHome}
            className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white px-3 py-2 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-blue-500" />
            <h2 className="text-lg font-semibold text-white">Remediation Table</h2>
          </div>
          <p className="text-sm text-zinc-500 mb-6">
            Each row matches a detected flaw with an actionable fix. Tap any row to view the
            code patch and updated prompt guidelines.
          </p>
        </motion.div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {(['all', 'crit', 'warn', 'safe'] as const).map((f) => {
            const labels = { all: 'All Issues', crit: 'Critical', warn: 'Warnings', safe: 'Remediated' };
            const counts = {
              all: REMEDIATION_ROWS.length,
              crit: REMEDIATION_ROWS.filter((r) => r.severity === 'crit').length,
              warn: REMEDIATION_ROWS.filter((r) => r.severity === 'warn').length,
              safe: REMEDIATION_ROWS.filter((r) => r.severity === 'safe').length,
            };
            const isActive = filter === f;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30'
                    : 'bg-zinc-900 text-zinc-500 border border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {labels[f]}
                <span className={`text-[10px] px-1.5 rounded-full ${
                  isActive ? 'bg-blue-500/20' : 'bg-zinc-800'
                }`}>
                  {counts[f]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Table */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          {/* Header row (desktop) */}
          <div className="hidden md:grid grid-cols-[1fr_180px_120px_140px] gap-4 px-6 py-3 border-b border-zinc-800 bg-zinc-900/50">
            <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Detected Flaw</span>
            <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Category</span>
            <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Severity</span>
            <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider text-right">Action</span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-zinc-800">
            {filteredRows.map((row, i) => {
              const colors = riskColors[row.severity];
              const Icon = severityIcon[row.severity];
              return (
                <motion.div
                  key={row.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.3 }}
                  className="group grid grid-cols-1 md:grid-cols-[1fr_180px_120px_140px] gap-4 px-6 py-4 items-center hover:bg-zinc-800/30 transition-colors"
                >
                  {/* Flaw */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg ${colors.bg} ${colors.border} border flex items-center justify-center shrink-0`}>
                      <Icon className={`w-4 h-4 ${colors.text}`} />
                    </div>
                    <p className="text-sm text-white truncate">{row.flaw}</p>
                  </div>

                  {/* Category */}
                  <span className="text-xs text-zinc-500 hidden md:block">{row.category}</span>

                  {/* Severity */}
                  <div className="hidden md:flex">
                    <span className={`text-[10px] font-mono px-2 py-1 rounded-full ${colors.bg} ${colors.text} uppercase tracking-wider border ${colors.border}`}>
                      {colors.label}
                    </span>
                  </div>

                  {/* Action */}
                  <div className="flex md:justify-end">
                    <button
                      onClick={() => setSelected(row)}
                      className="flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-400 font-medium px-3 py-1.5 rounded-lg hover:bg-blue-500/10 transition-colors w-full md:w-auto justify-center md:justify-start"
                    >
                      Tap to get info
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Summary footer */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-xs text-zinc-500">
            <span className="flex items-center gap-1.5">
              <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
              {REMEDIATION_ROWS.filter((r) => r.severity === 'crit').length} Critical
            </span>
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              {REMEDIATION_ROWS.filter((r) => r.severity === 'warn').length} Warnings
            </span>
          </div>
          <button
            onClick={onBackToHome}
            className="flex items-center gap-2 text-sm bg-blue-600 hover:bg-blue-500 text-white font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            <Home className="w-4 h-4" />
            Back to Home — Retest Model
          </button>
        </div>
      </main>

      {/* Slide-over Modal */}
      <AnimatePresence>
        {selected && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-40"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-zinc-900 border-l border-zinc-800 z-50 overflow-y-auto scrollbar-thin"
            >
              {/* Header */}
              <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg ${riskColors[selected.severity].bg} ${riskColors[selected.severity].border} border flex items-center justify-center`}>
                    {(() => {
                      const Icon = severityIcon[selected.severity];
                      return <Icon className={`w-5 h-5 ${riskColors[selected.severity].text}`} />;
                    })()}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Remediation Details</h3>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{selected.category}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="px-6 py-5 space-y-5">
                {/* Flaw */}
                <div>
                  <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                    Detected Flaw
                  </p>
                  <p className="text-sm text-white">{selected.flaw}</p>
                </div>

                {/* Fix Title */}
                <div>
                  <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                    Recommended Fix
                  </p>
                  <p className="text-sm font-semibold text-blue-400 mb-2">{selected.fixTitle}</p>
                  <p className="text-sm text-zinc-400">{selected.fixDescription}</p>
                </div>

                {/* Code Patch */}
                <div className="bg-slate-950 border border-zinc-800 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900/50 border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                      <Code className="w-3.5 h-3.5 text-blue-500" />
                      <span className="text-xs font-mono text-zinc-400">Code Patch</span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(selected.codePatch, 'code')}
                      className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-blue-400 transition-colors"
                    >
                      {copiedTab === 'code' ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-4 text-xs font-mono text-zinc-300 overflow-x-auto scrollbar-thin leading-relaxed">
                    <code>{selected.codePatch}</code>
                  </pre>
                </div>

                {/* Prompt Patch */}
                <div className="bg-slate-950 border border-zinc-800 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900/50 border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                      <span className="text-xs font-mono text-zinc-400">Prompt Patch</span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(selected.promptPatch, 'prompt')}
                      className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-blue-400 transition-colors"
                    >
                      {copiedTab === 'prompt' ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-4 text-xs font-mono text-zinc-300 overflow-x-auto scrollbar-thin leading-relaxed">
                    <code>{selected.promptPatch}</code>
                  </pre>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
