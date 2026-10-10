import { motion } from 'framer-motion';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Plus,
  RotateCw,
  ArrowRight,
  Activity,
  Cpu,
  Zap,
  TrendingUp,
} from 'lucide-react';
import { PREVIOUS_MODELS } from '../data/mockData';
import { riskColors, scoreColor } from '../utils/ui';
import type { PreviousModel } from '../types';

interface DashboardProps {
  onCheckNewModel: () => void;
  onRetestModel: (model?: PreviousModel) => void;
  onTestAgent: () => void;
  models?: PreviousModel[];
}

export default function Dashboard({
  onCheckNewModel,
  onRetestModel,
  onTestAgent,
  models = PREVIOUS_MODELS,
}: DashboardProps) {
  const modelList = models ?? [];
  const avgRobustness =
    modelList.length > 0
      ? (modelList.reduce((acc, m) => acc + m.score, 0) / modelList.length).toFixed(1)
      : '—';
  const critCount = modelList.filter((m) => m.status === 'crit').length;

  const stats = [
    { label: 'Models Audited', value: modelList.length.toString(), icon: Cpu },
    { label: 'Avg. Robustness', value: avgRobustness, icon: TrendingUp },
    { label: 'Critical Findings', value: critCount.toString(), icon: ShieldAlert },
    { label: 'Active Agents', value: '3', icon: Activity },
  ];
  return (
    <div className="min-h-screen bg-slate-950 bg-grid bg-radial-glow">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight">
                Agent<span className="text-blue-500">Break</span>
              </h1>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Red-Teaming Console</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-glow text-emerald-400" />
              <span className="text-zinc-400">System Operational</span>
            </div>
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-zinc-800/50 rounded-lg text-xs text-zinc-400">
              <Zap className="w-3.5 h-3.5 text-blue-500" />
              Agent Cluster: Online
            </div>
            <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-medium text-zinc-300">
              SA
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-white mb-1">Welcome back, Analyst</h2>
          <p className="text-zinc-500 text-sm">
            Select an operation to begin a security evaluation on your AI agent.
          </p>
          <button onClick={onTestAgent} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-cyan-700 hover:bg-cyan-600 px-4 py-2.5 text-sm font-medium text-white"><Zap className="w-4 h-4" />Test Agent</button>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <stat.icon className="w-5 h-5 text-blue-500/70" />
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-zinc-500 mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Main Action Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          {/* Check New Model */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            whileHover={{ y: -4 }}
            onClick={onCheckNewModel}
            className="group bg-zinc-900 border border-zinc-800 hover:border-blue-500/50 rounded-2xl p-7 text-left transition-colors relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/0 to-blue-600/0 group-hover:from-blue-600/5 group-hover:to-blue-600/0 transition-all duration-500" />
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center mb-5">
                <Plus className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Check New Model</h3>
              <p className="text-sm text-zinc-500 mb-6">
                Configure and audit a new AI agent from scratch. Define the target model,
                system prompt, and mock tools to begin a full red-team evaluation.
              </p>
              <span className="inline-flex items-center gap-2 text-sm text-blue-500 group-hover:gap-3 transition-all">
                Start Audit Setup
                <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </motion.button>

          {/* Retest Used Model */}
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            whileHover={{ y: -4 }}
            onClick={() => onRetestModel()}
            className="group bg-zinc-900 border border-zinc-800 hover:border-blue-500/50 rounded-2xl p-7 text-left transition-colors relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/0 to-blue-600/0 group-hover:from-blue-600/5 group-hover:to-blue-600/0 transition-all duration-500" />
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center mb-5">
                <RotateCw className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Retest Used Model</h3>
              <p className="text-sm text-zinc-500 mb-6">
                Load a previously tested model for regression verification. Compare results
                against prior audits to confirm patches hold under new attack vectors.
              </p>
              <span className="inline-flex items-center gap-2 text-sm text-blue-500 group-hover:gap-3 transition-all">
                Select Previous Model
                <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </motion.button>
        </div>

        {/* Previous Models */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
              Recently Tested Models
            </h3>
            <span className="text-xs text-zinc-600">{modelList.length} models</span>
          </div>

          {modelList.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
              <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-3">
                <Shield className="w-6 h-6 text-blue-500" />
              </div>
              <h4 className="text-sm font-medium text-white mb-1">No models audited yet</h4>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto mb-4">
                Configure and run your first AI security evaluation to see results and vulnerabilities here.
              </p>
              <button
                onClick={onCheckNewModel}
                className="inline-flex items-center gap-2 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Start First Audit
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {modelList.map((model, i) => {
                const colors = riskColors[model.status];
                return (
                  <motion.div
                    key={model.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + i * 0.06, duration: 0.3 }}
                    className="group flex items-center gap-4 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl px-5 py-4 transition-colors cursor-pointer"
                    onClick={() => onRetestModel(model)}
                  >
                    <div className={`w-10 h-10 rounded-lg ${colors.bg} ${colors.border} border flex items-center justify-center shrink-0`}>
                      {model.status === 'safe' ? (
                        <ShieldCheck className={`w-5 h-5 ${colors.text}`} />
                      ) : (
                        <ShieldAlert className={`w-5 h-5 ${colors.text}`} />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <p className="text-sm font-medium text-white truncate">{model.name}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${colors.bg} ${colors.text} font-medium uppercase tracking-wider`}>
                          {colors.label}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {model.engine} · Last tested {model.lastTested}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className={`text-lg font-bold ${scoreColor(model.score)}`}>
                        {model.score.toFixed(1)}
                      </p>
                      <p className="text-[10px] text-zinc-600 uppercase tracking-wider">Score</p>
                    </div>

                    <ArrowRight className="w-4 h-4 text-zinc-700 group-hover:text-blue-500 group-hover:translate-x-1 transition-all shrink-0" />
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
