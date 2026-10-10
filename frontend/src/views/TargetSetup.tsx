import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  ArrowLeft,
  Cpu,
  Terminal,
  Play,
  ChevronRight,
  Search,
  History,
  Sparkles,
} from 'lucide-react';
import { MOCK_TOOLS, PREVIOUS_MODELS } from '../data/mockData';
import { riskColors, scoreColor } from '../utils/ui';
import type { PreviousModel, TargetConfig } from '../types';

const ORCHESTRATED_ENGINE = 'System Orchestrated Model Agent';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

interface TargetSetupProps {
  onBack: () => void;
  onRunTest: (config: TargetConfig) => void;
  onRetestModel?: (model: PreviousModel) => void;
  initialConfig?: TargetConfig | null;
  presetModel?: PreviousModel | null;
  previousModels?: PreviousModel[];
}

export default function TargetSetup({
  onBack,
  onRunTest,
  initialConfig,
  presetModel,
  previousModels = PREVIOUS_MODELS,
}: TargetSetupProps) {
  const [name, setName] = useState(initialConfig?.name ?? presetModel?.name ?? '');
  const [systemPrompt, setSystemPrompt] = useState(
    initialConfig?.systemPrompt ?? '',
  );
  const [tools, setTools] = useState<Record<string, boolean>>(
    initialConfig?.mockTools ?? {},
  );
  const [search, setSearch] = useState('');
  const [vulnerableMode, setVulnerableMode] = useState(initialConfig?.vulnerableMode ?? false);
  const [testPrompt, setTestPrompt] = useState('Show my account record.');
  const [testUser, setTestUser] = useState('CUST-001');
  const [testResult, setTestResult] = useState<Record<string, unknown> | null>(null);
  const [testingAgent, setTestingAgent] = useState(false);
  const [testError, setTestError] = useState('');
  const [scanMode, setScanMode] = useState<'deterministic' | 'adaptive'>('deterministic');
  const [maxTests, setMaxTests] = useState(10);
  const [maxRounds, setMaxRounds] = useState(3);

  const canRun = name.trim().length > 0;

  const filteredModels = (previousModels ?? []).filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.engine.toLowerCase().includes(search.toLowerCase()),
  );

  function handleRun() {
    if (!canRun) return;
    onRunTest({ name, engine: ORCHESTRATED_ENGINE, systemPrompt, mockTools: tools, vulnerableMode, scanMode, maxTests, maxRounds, timeoutSeconds: 180 });
  }

  async function handleTestAgent() {
    setTestingAgent(true); setTestError(''); setTestResult(null);
    try {
      const response = await fetch('/api/target/test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: testPrompt, user_id: testUser, vulnerability_config: { allow_unauthorized_record_access: vulnerableMode, trust_untrusted_content: vulnerableMode } }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(typeof payload.detail === 'string' ? payload.detail : 'Target agent request failed');
      setTestResult(payload);
    } catch (error) { setTestError(error instanceof Error ? error.message : 'Could not reach the target agent'); }
    finally { setTestingAgent(false); }
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
              <h1 className="text-base font-bold text-white tracking-tight">Target Setup</h1>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Configure Audit Parameters</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-500">
            <Terminal className="w-3.5 h-3.5 text-blue-500" />
            Step 1 of 3 — Configuration
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-[1fr_380px] gap-6">
          {/* Left: Form */}
          <div className="space-y-6">
            {/* Target Model Name — animated gradient border */}
            <motion.div
              custom={0}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className="gradient-border bg-zinc-900"
            >
              <div className="rounded-[14px] p-6">
                <label className="block text-xs font-medium text-zinc-400 mb-3 uppercase tracking-wider">
                  Target Model Name
                </label>
                <div className="relative">
                  <Cpu className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. CustomerAssistant v1.0"
                    className="w-full bg-slate-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-colors"
                  />
                </div>
              </div>
            </motion.div>

            {/* System Orchestrated Model Agent — breathing display */}
            <motion.div
              custom={1}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
            >
              <div className="flex flex-col items-center justify-center py-6 gap-5">
                {/* Pulsing glowing ring */}
                <div className="relative w-16 h-16 flex items-center justify-center">
                  {/* Outer pulsing ring */}
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-cyan-400/40"
                    animate={{
                      scale: [1, 1.35, 1],
                      opacity: [0.7, 0, 0.7],
                    }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  />
                  {/* Middle pulsing ring */}
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-fuchsia-400/30"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.6, 0, 0.6],
                    }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: 0.5,
                    }}
                  />
                  {/* Static glow base */}
                  <div className="absolute inset-2 rounded-full bg-gradient-to-br from-cyan-500/20 to-fuchsia-500/20 blur-md" />
                  {/* Inner core — breathing */}
                  <motion.div
                    className="relative w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-fuchsia-600 flex items-center justify-center"
                    animate={{
                      scale: [1, 1.08, 1],
                      boxShadow: [
                        '0 0 12px rgba(6,182,212,0.4)',
                        '0 0 28px rgba(168,85,247,0.6)',
                        '0 0 12px rgba(6,182,212,0.4)',
                      ],
                    }}
                    transition={{
                      duration: 3.5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  >
                    <Sparkles className="w-5 h-5 text-white" />
                  </motion.div>
                </div>

                {/* Label */}
                <motion.div
                  animate={{
                    opacity: [1, 0.8, 1],
                  }}
                  transition={{
                    duration: 3.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="text-center"
                >
                  <h3 className="text-base font-semibold text-white tracking-wide">
                    System Orchestrated Model Agent
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1.5">
                    The evaluation engine automatically selects the optimal model configuration.
                    No manual selection required.
                  </p>
                </motion.div>

                {/* Status badge */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                  <motion.span
                    className="w-1.5 h-1.5 rounded-full bg-cyan-400"
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">
                    Auto-Orchestrated · Active
                  </span>
                </div>
              </div>
            </motion.div>

            {/* System Prompt — animated gradient border */}
            <motion.div
              custom={2}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className="gradient-border bg-zinc-900"
            >
              <div className="rounded-[14px] p-6">
                <label className="block text-xs font-medium text-zinc-400 mb-3 uppercase tracking-wider">
                  System Prompt
                </label>
                <textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  rows={5}
                  placeholder="Enter the system prompt for the target model..."
                  className="w-full bg-slate-950 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-colors font-mono resize-none scrollbar-thin"
                />
                <p className="text-xs text-zinc-600 mt-2">
                  {systemPrompt.length} characters · This prompt will be tested for injection resistance
                </p>
              </div>
            </motion.div>

            {/* Mock Tools */}
            <motion.div
              custom={3}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6"
            >
              <label className="block text-xs font-medium text-zinc-400 mb-4 uppercase tracking-wider">
                Mock Tools
              </label>
              <div className="space-y-3">
                {MOCK_TOOLS.map((tool) => {
                  const enabled = tools[tool.id];
                  return (
                    <div
                      key={tool.id}
                      className="flex items-start gap-4 p-4 bg-slate-950 border border-zinc-800 rounded-lg"
                    >
                      <button
                        onClick={() =>
                          setTools((prev) => ({ ...prev, [tool.id]: !prev[tool.id] }))
                        }
                        className={`relative shrink-0 w-11 h-6 rounded-full transition-colors mt-0.5 ${
                          enabled ? 'bg-blue-600' : 'bg-zinc-700'
                        }`}
                      >
                        <motion.div
                          layout
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white ${
                            enabled ? 'left-5.5' : 'left-0.5'
                          }`}
                          style={{ left: enabled ? '22px' : '2px' }}
                        />
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white font-mono">{tool.label}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">{tool.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-zinc-600 mt-3">
                {Object.values(tools).filter(Boolean).length} of {MOCK_TOOLS.length} tools enabled
              </p>
            </motion.div>

            {/* Run Test */}
            <section className="bg-zinc-900 border border-blue-500/30 rounded-2xl p-6 space-y-4">
              <div><h3 className="text-base font-semibold text-white">Test the sandbox agent</h3><p className="text-xs text-zinc-400 mt-1">Send one prompt directly to the existing CustomerSupportAgent and inspect its real response and tool trace.</p></div>
              <label className="block text-xs text-zinc-400">Authenticated synthetic user
                <select value={testUser} onChange={e => setTestUser(e.target.value)} className="mt-2 w-full bg-slate-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white">{['CUST-001','CUST-002','CUST-003'].map(id=><option key={id}>{id}</option>)}</select>
              </label>
              <label className="block text-xs text-zinc-400">Prompt
                <textarea value={testPrompt} onChange={e => setTestPrompt(e.target.value)} maxLength={2000} rows={3} className="mt-2 w-full bg-slate-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white" />
              </label>
              <button type="button" onClick={handleTestAgent} disabled={testingAgent || !testPrompt.trim()} className="w-full bg-cyan-700 hover:bg-cyan-600 disabled:opacity-50 text-white rounded-lg px-4 py-3 text-sm font-medium">{testingAgent ? 'Sending prompt…' : 'Test Agent'}</button>
              {testError && <p role="alert" className="text-sm text-rose-400">{testError}</p>}
              {testResult && <div className="bg-slate-950 border border-zinc-800 rounded-lg p-4 space-y-2"><p className="text-xs uppercase tracking-wider text-zinc-500">Agent response</p><p className="text-sm text-white whitespace-pre-wrap">{String(testResult.target_response ?? '')}</p><p className="text-xs uppercase tracking-wider text-zinc-500 pt-2">Execution trace</p><pre className="text-xs text-emerald-300 whitespace-pre-wrap break-words max-h-64 overflow-auto">{JSON.stringify({tool_calls:testResult.tool_calls,tool_results:testResult.tool_results,security_events:testResult.security_events},null,2)}</pre></div>}
            </section>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between gap-4">
              <div><p className="text-sm text-white">Sandbox profile</p><p className="text-xs text-zinc-500">Vulnerable mode enables the target's simulated authorization and ticket injection flaws.</p></div>
              <button type="button" role="switch" aria-checked={vulnerableMode} onClick={() => setVulnerableMode(v => !v)} className={`px-3 py-2 rounded-lg text-xs font-medium ${vulnerableMode ? 'bg-rose-600 text-white' : 'bg-emerald-700 text-white'}`}>{vulnerableMode ? 'Vulnerable' : 'Secure'}</button>
            </div>
            <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
              <div><h3 className="text-base font-semibold text-white">Scan settings</h3><p className="text-xs text-zinc-400 mt-1">Choose how tests are produced and set a bounded attempt budget.</p></div>
              <label className="block text-xs text-zinc-400">Test generation mode
                <select value={scanMode} onChange={e => setScanMode(e.target.value as 'deterministic' | 'adaptive')} className="mt-2 w-full bg-slate-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white">
                  <option value="deterministic">Deterministic catalog (no API key needed)</option>
                  <option value="adaptive">Adaptive Gemini (uses your configured API key)</option>
                </select>
              </label>
              {scanMode === 'adaptive' && <p className="text-xs text-cyan-300 bg-cyan-950/40 border border-cyan-900 rounded-lg p-3">Adaptive mode sends scan context and synthetic test data to Gemini. Configure AGENTBREAK_LLM_API_KEY in backend/.env first. The backend validates generated prompts and only runs them against the local sandbox.</p>}
              <label className="block text-xs text-zinc-400">Maximum tests: {maxTests}
                <input type="range" min={1} max={30} value={maxTests} onChange={e => setMaxTests(Number(e.target.value))} className="mt-2 w-full accent-blue-500" />
              </label>
              {scanMode === 'adaptive' && <label className="block text-xs text-zinc-400">Maximum generation rounds: {maxRounds}
                <input type="range" min={1} max={5} value={maxRounds} onChange={e => setMaxRounds(Number(e.target.value))} className="mt-2 w-full accent-blue-500" />
              </label>}
            </section>
            <motion.button
              custom={4}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              onClick={handleRun}
              disabled={!canRun}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-sm rounded-xl px-6 py-4 transition-colors flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-white" />
              Run Security Test
            </motion.button>
          </div>

          {/* Right: Previous Models */}
          <motion.div
            custom={1}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <History className="w-4 h-4 text-blue-500" />
                <h3 className="text-sm font-semibold text-white">Previously Tested</h3>
              </div>

              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search models..."
                  className="w-full bg-slate-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                />
              </div>

              {/* List */}
              <div className="space-y-2 max-h-[500px] overflow-y-auto scrollbar-thin">
                {filteredModels.length === 0 && (
                  <p className="text-xs text-zinc-600 text-center py-6">No models found</p>
                )}
                {filteredModels.map((model) => {
                  const colors = riskColors[model.status];
                  return (
                    <div
                      key={model.id}
                      onClick={() => {
                        setName(model.name);
                      }}
                      className="group cursor-pointer p-3 bg-slate-950 border border-zinc-800 hover:border-blue-500/40 rounded-lg transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-sm font-medium text-white truncate">{model.name}</p>
                        <span className={`text-xs font-bold ${scoreColor(model.score)}`}>
                          {model.score.toFixed(1)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-zinc-500">{model.engine}</span>
                        <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                        <span className={`text-[10px] ${colors.text}`}>{colors.label}</span>
                        <ChevronRight className="w-3 h-3 text-zinc-700 group-hover:text-blue-500 ml-auto transition-colors" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
