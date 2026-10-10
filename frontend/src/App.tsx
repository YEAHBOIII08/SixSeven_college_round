import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import LoginScreen from './views/LoginScreen';
import Dashboard from './views/Dashboard';
import TargetSetup from './views/TargetSetup';
import ExecutionHUD from './views/ExecutionHUD';
import ReportView from './views/ReportView';
import DefensiveMeasures from './views/DefensiveMeasures';
import type { PreviousModel, TargetConfig, View } from './types';
import type { Scan } from './views/ExecutionHUD';

export default function App() {
  const [view, setView] = useState<View>('login');
  const [config, setConfig] = useState<TargetConfig | null>(null);
  const [presetModel, setPresetModel] = useState<PreviousModel | null>(null);
  const [testedModels, setTestedModels] = useState<PreviousModel[]>([]);
  const [scan, setScan] = useState<Scan | null>(null);

  function goTo(v: View) {
    setView(v);
  }

  function handleLogin() {
    goTo('dashboard');
  }

  function handleCheckNewModel() {
    setPresetModel(null);
    setConfig(null);
    goTo('target-setup');
  }

  function handleTestAgent() {
    setPresetModel(null);
    setConfig({ name: 'CustomerSupportAgent', engine: 'Sandboxed deterministic agent', systemPrompt: '', mockTools: {}, vulnerableMode: false });
    goTo('target-setup');
  }

  function handleRetestModel(model?: PreviousModel) {
    if (model) {
      setPresetModel(model);
      setConfig({
        name: model.name,
        engine: model.engine,
        systemPrompt: '',
        mockTools: {},
      });
    } else {
      setPresetModel(null);
      setConfig(null);
    }
    goTo('target-setup');
  }

  function handleRunTest(cfg: TargetConfig) {
    setConfig(cfg);
    goTo('execution');
  }

  function handleExecutionComplete(result: Scan) {
    setScan(result);
    if (config) {
      const vulnerable = result.counts.vulnerable > 0;
      const newModel: PreviousModel = {
        id: result.run_id,
        name: config.name,
        engine: config.engine,
        lastTested: new Date().toISOString().split('T')[0],
        score: Math.max(0, 10 - (result.counts.vulnerable / Math.max(result.total, 1)) * 10),
        status: vulnerable ? 'crit' : 'safe',
      };
      setTestedModels((prev) => [newModel, ...prev.filter((m) => m.name !== config.name)]);
    }
    goTo('report');
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={view}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
      >
        {view === 'login' && <LoginScreen onLogin={handleLogin} />}

        {view === 'dashboard' && (
          <Dashboard
            onCheckNewModel={handleCheckNewModel}
            onRetestModel={handleRetestModel}
            onTestAgent={handleTestAgent}
            models={testedModels}
          />
        )}

        {view === 'target-setup' && (
          <TargetSetup
            onBack={() => goTo('dashboard')}
            onRunTest={handleRunTest}
            initialConfig={config}
            presetModel={presetModel}
            previousModels={testedModels}
          />
        )}

        {view === 'execution' && config && (
          <ExecutionHUD
            config={config}
            onComplete={handleExecutionComplete}
            onBack={() => goTo('target-setup')}
          />
        )}

        {view === 'report' && (
          <ReportView
            onBack={() => goTo('execution')}
            onViewDefensive={() => goTo('defensive')}
            config={config}
            scan={scan}
          />
        )}

        {view === 'defensive' && (
          <DefensiveMeasures
            onBack={() => goTo('report')}
            onBackToHome={() => goTo('dashboard')}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}
