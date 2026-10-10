import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  ArrowLeft,
  Terminal,
  Brain,
  Wrench,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Info,
} from 'lucide-react';
import { STREAMING_LOGS, AGENT_NAMES } from '../data/mockData';
import type { AgentName, LogLine, TargetConfig } from '../types';

interface ExecutionHUDProps {
  config: TargetConfig;
  onComplete: () => void;
  onBack: () => void;
}

const agentIcons: Record<AgentName, typeof Brain> = {
  'Context Auditor': Brain,
  'Tool Privilege Auditor': Wrench,
  'Data Leakage Auditor': ShieldCheck,
};

const levelConfig = {
  info: { color: 'text-blue-400', icon: Info, label: 'INFO' },
  warn: { color: 'text-amber-400', icon: AlertTriangle, label: 'WARN' },
  crit: { color: 'text-rose-400', icon: AlertOctagon, label: 'CRIT' },
  success: { color: 'text-emerald-400', icon: CheckCircle2, label: 'PASS' },
};

export default function ExecutionHUD({ config, onComplete, onBack }: ExecutionHUDProps) {
  const [progress, setProgress] = useState(0);
  const [visibleLogs, setVisibleLogs] = useState<LogLine[]>([]);
  const [done, setDone] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  const totalDuration = 8000;
  const formattedLogs = STREAMING_LOGS.map((log) => ({
    ...log,
    message: log.message.replace(/SupportBot v2\.1/g, config.name || 'Target Agent'),
  }));
  const logInterval = totalDuration / formattedLogs.length;

  useEffect(() => {
    const progressTimer = setInterval(() => {
      setProgress((p) => {
        const next = p + 100 / (totalDuration / 50);
        return Math.min(next, 100);
      });
    }, 50);

    return () => clearInterval(progressTimer);
  }, []);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    formattedLogs.forEach((log, i) => {
      const t = setTimeout(() => {
        setVisibleLogs((prev) => [...prev, log]);
      }, (i + 1) * logInterval);
      timers.push(t);
    });

    const doneTimer = setTimeout(() => {
      setDone(true);
      setProgress(100);
    }, totalDuration + 500);

    timers.push(doneTimer);

    return () => timers.forEach(clearTimeout);
  }, [logInterval]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [visibleLogs]);

  const agentLogs = (agent: AgentName) =>
    visibleLogs.filter((l) => l.agent === agent);

  return (
    <div className="min-h-screen bg-slate-950 bg-grid bg-radial-glow">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              disabled
              className="p-2 rounded-lg text-zinc-700 cursor-not-allowed"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight font-mono">
                Probing: {config.name || 'Unknown Target'}
              </h1>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">
                {config.engine} · Live Audit in Progress
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                done ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse-glow text-amber-400'
              }`}
            />
            <span className={`font-mono ${done ? 'text-emerald-400' : 'text-amber-400'}`}>
              {done ? 'AUDIT COMPLETE' : 'AUDIT RUNNING'}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-mono text-white">
                Recollecting data &amp; testing parameters...
              </span>
            </div>
            <span className="text-sm font-mono font-bold text-blue-500">
              {Math.round(progress)}% complete
            </span>
          </div>
          <div className="h-3 bg-slate-950 rounded-full overflow-hidden border border-zinc-800">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-scan-line" />
            </motion.div>
          </div>
          <div className="flex items-center justify-between mt-3 text-xs font-mono text-zinc-600">
            <span>{visibleLogs.length} / {formattedLogs.length} operations</span>
            <span>3 evaluator agents active</span>
          </div>
        </motion.div>

        {/* Agent Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {AGENT_NAMES.map((agent, i) => {
            const Icon = agentIcons[agent];
            const logs = agentLogs(agent);
            const hasCrit = logs.some((l) => l.level === 'crit');
            const hasWarn = logs.some((l) => l.level === 'warn');
            const isDone = logs.some((l) => l.level === 'success');
            const statusColor = isDone
              ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
              : hasCrit
                ? 'text-rose-400 border-rose-500/30 bg-rose-500/10'
                : hasWarn
                  ? 'text-amber-400 border-amber-500/30 bg-amber-500/10'
                  : 'text-blue-400 border-blue-500/30 bg-blue-500/10';
            const statusLabel = isDone ? 'COMPLETE' : hasCrit ? 'CRITICAL' : hasWarn ? 'WARNING' : 'RUNNING';

            return (
              <motion.div
                key={agent}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className={`bg-zinc-900 border rounded-xl p-4 ${statusColor.split(' ').find((c) => c.startsWith('border-'))}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-blue-500" />
                    <span className="text-xs font-semibold text-white">{agent}</span>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${statusColor}`}>
                    {statusLabel}
                  </span>
                </div>
                <div className="space-y-1 max-h-24 overflow-y-auto scrollbar-thin">
                  {logs.length === 0 && (
                    <p className="text-xs text-zinc-600 font-mono">Waiting for data...</p>
                  )}
                  {logs.slice(-3).map((log) => {
                    const Lvl = levelConfig[log.level];
                    return (
                      <div key={log.id} className="flex items-start gap-1.5 text-[10px] font-mono">
                        <span className="text-zinc-600 shrink-0">{log.timestamp}</span>
                        <span className={Lvl.color}>{Lvl.label}</span>
                        <span className="text-zinc-500 truncate">{log.message}</span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Terminal Log */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="bg-slate-950 border border-zinc-800 rounded-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/50 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
              </div>
              <span className="text-xs text-zinc-500 font-mono ml-2">agentbreak@console: ~/audit/log</span>
            </div>
            <span className="text-[10px] text-zinc-600 font-mono">live stream</span>
          </div>

          <div className="p-4 h-[340px] overflow-y-auto scrollbar-thin font-mono text-xs space-y-1.5">
            <div className="text-zinc-600">
              <span className="text-blue-500">$</span> agentbreak audit --target="{config.name}" --engine="{config.engine}"
            </div>
            <div className="text-zinc-600 mb-3">
              <span className="text-blue-500">$</span> Initializing 3 evaluator agents...
            </div>

            <AnimatePresence>
              {visibleLogs.map((log) => {
                const Lvl = levelConfig[log.level];
                return (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-start gap-2"
                  >
                    <span className="text-zinc-600 shrink-0">[{log.timestamp}]</span>
                    <span className={`shrink-0 font-bold ${Lvl.color}`}>[{Lvl.label}]</span>
                    <span className="text-zinc-500 shrink-0">[{log.agent}]</span>
                    <span className="text-zinc-300">{log.message}</span>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {!done && (
              <div className="flex items-center gap-1 text-blue-500">
                <span className="text-zinc-600">$</span>
                <span className="inline-block w-2 h-3.5 bg-blue-500 animate-blink" />
              </div>
            )}

            <div ref={logEndRef} />
          </div>
        </motion.div>

        {/* Complete Button */}
        <AnimatePresence>
          {done && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mt-6"
            >
              <button
                onClick={onComplete}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm rounded-xl px-6 py-4 transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                View Security Evaluation Report
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
