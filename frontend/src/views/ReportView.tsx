import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  ArrowLeft,
  Brain,
  Wrench,
  ShieldCheck,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Target,
  Calendar,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Zap,
} from 'lucide-react';
import { REPORT_DATA } from '../data/mockData';
import { riskColors, scoreColor } from '../utils/ui';
import type { AttackStep, CategoryScore, TargetConfig } from '../types';

interface ReportViewProps {
  onBack: () => void;
  onViewDefensive: () => void;
  config?: TargetConfig | null;
}

const iconMap: Record<string, typeof Brain> = {
  Brain,
  Wrench,
  ShieldCheck,
};

function ScoreRing({ score }: { score: number }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 10) * circumference;

  return (
    <div className="relative w-36 h-36 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="144" height="144">
        <circle
          cx="72"
          cy="72"
          r={radius}
          fill="none"
          stroke="#27272a"
          strokeWidth="6"
        />
        <motion.circle
          cx="72"
          cy="72"
          r={radius}
          fill="none"
          stroke={score >= 8 ? '#10b981' : score >= 6 ? '#f59e0b' : '#f43f5e'}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ delay: 0.3, duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <div className="text-center">
        <motion.p
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className={`text-4xl font-bold ${scoreColor(score)}`}
        >
          {score.toFixed(1)}
        </motion.p>
        <p className="text-xs text-zinc-600 mt-1">out of 10</p>
      </div>
    </div>
  );
}

function CategoryCard({ category, index }: { category: CategoryScore; index: number }) {
  const colors = riskColors[category.level];
  const Icon = iconMap[category.icon] ?? Brain;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.12, duration: 0.4 }}
      className={`bg-zinc-900 border ${colors.border} rounded-2xl p-6`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${colors.text}`} />
        </div>
        <div className="text-right">
          <span className={`text-2xl font-bold ${colors.text}`}>
            {category.score}
          </span>
          <span className="text-sm text-zinc-600">/{category.maxScore}</span>
        </div>
      </div>
      <h3 className="text-sm font-semibold text-white mb-1">{category.name}</h3>
      <p className="text-xs text-zinc-500 mb-4">{category.description}</p>

      {/* Mini progress bar */}
      <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${colors.dot}`}
          initial={{ width: 0 }}
          animate={{ width: `${(category.score / category.maxScore) * 100}%` }}
          transition={{ delay: 0.3 + index * 0.12, duration: 0.6, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  );
}

function AttackStepCard({
  step,
  isLast,
  index,
}: {
  step: AttackStep;
  isLast: boolean;
  index: number;
}) {
  const [open, setOpen] = useState(index === 0);
  const colors = riskColors[step.severity];
  const Icon =
    step.severity === 'safe' ? CheckCircle2 : step.severity === 'warn' ? AlertTriangle : AlertOctagon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.15 + index * 0.1, duration: 0.4 }}
      className="relative"
    >
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-[18px] top-12 bottom-0 w-px bg-zinc-800" />
      )}

      <div className="flex gap-4 pb-6">
        {/* Node */}
        <div
          className={`relative shrink-0 w-9 h-9 rounded-full ${colors.bg} ${colors.border} border flex items-center justify-center z-10`}
        >
          <Icon className={`w-4 h-4 ${colors.text}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <button
            onClick={() => setOpen((o) => !o)}
            className="w-full text-left group"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono text-zinc-600">
                    STEP {String(step.id).padStart(2, '0')}
                  </span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${colors.bg} ${colors.text} uppercase tracking-wider`}
                  >
                    {step.severity === 'safe' ? 'Remediated' : step.severity === 'warn' ? 'Warning' : 'Critical'}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">
                  {step.title}
                </h4>
              </div>
              {open ? (
                <ChevronDown className="w-4 h-4 text-zinc-600 shrink-0 mt-1" />
              ) : (
                <ChevronRight className="w-4 h-4 text-zinc-600 shrink-0 mt-1" />
              )}
            </div>
          </button>

          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="mt-3 space-y-3">
                  <p className="text-xs text-zinc-400">{step.description}</p>

                  {/* Payload */}
                  <div className="bg-slate-950 border border-zinc-800 rounded-lg p-3">
                    <p className="text-[10px] text-zinc-600 font-mono mb-1.5 uppercase tracking-wider">
                      Attack Payload
                    </p>
                    <p className="text-xs font-mono text-amber-400/90 italic">{step.payload}</p>
                  </div>

                  {/* Result */}
                  <div className={`bg-slate-950 border rounded-lg p-3 ${colors.border}`}>
                    <p className="text-[10px] text-zinc-600 font-mono mb-1.5 uppercase tracking-wider">
                      Result
                    </p>
                    <p className={`text-xs font-mono ${colors.text}`}>{step.result}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

export default function ReportView({ onBack, onViewDefensive, config }: ReportViewProps) {
  const targetName = config?.name || REPORT_DATA.targetName;
  const engine = config?.engine || REPORT_DATA.engine;
  const testedAt = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';

  const data = {
    ...REPORT_DATA,
    targetName,
    engine,
    testedAt,
    summary: `${targetName} exhibits moderate vulnerability to prompt injection and insufficient tool-level authorization. While data protection controls partially mask sensitive fields, the model discloses its system prompt under adversarial role-hijack payloads and processes high-value refunds without amount verification.`,
  };

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
              <h1 className="text-base font-bold text-white tracking-tight">Security Evaluation Report</h1>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Audit Results & Attack Path</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Target Summary */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6"
        >
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
            {/* Score Ring */}
            <div className="shrink-0">
              <ScoreRing score={data.robustnessScore} />
            </div>

            {/* Details */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-blue-500" />
                <h2 className="text-xl font-bold text-white">{data.targetName}</h2>
              </div>
              <p className="text-sm text-zinc-400 mb-4">{data.summary}</p>
              <div className="flex flex-wrap gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-zinc-500">
                  <Cpu className="w-3.5 h-3.5" />
                  {data.engine}
                </span>
                <span className="flex items-center gap-1.5 text-zinc-500">
                  <Calendar className="w-3.5 h-3.5" />
                  {data.testedAt}
                </span>
                <span className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-blue-500" />
                  <span className="text-zinc-500">Robustness Score:</span>
                  <span className={`font-bold ${scoreColor(data.robustnessScore)}`}>
                    {data.robustnessScore.toFixed(1)}/10
                  </span>
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Category Breakdown */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
            Category Breakdown
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            {data.categories.map((cat, i) => (
              <CategoryCard key={cat.name} category={cat} index={i} />
            ))}
          </div>
        </div>

        {/* Attack Path Timeline */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              Attack Path Timeline
            </h3>
          </div>
          <p className="text-xs text-zinc-500 mb-6">
            Step-by-step reconstruction of the exploit chain. Click each step to expand details.
          </p>

          <div>
            {data.attackPath.map((step, i) => (
              <AttackStepCard
                key={step.id}
                step={step}
                index={i}
                isLast={i === data.attackPath.length - 1}
              />
            ))}
          </div>
        </div>

        {/* Next Button */}
        <motion.button
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          whileHover={{ y: -2 }}
          onClick={onViewDefensive}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm rounded-xl px-6 py-4 transition-colors flex items-center justify-center gap-2"
        >
          Next: View Defensive Measures
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      </main>
    </div>
  );
}
