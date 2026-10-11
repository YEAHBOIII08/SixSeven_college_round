import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { TargetConfigForm } from '@/components/workspace/TargetConfigForm';
import { LiveActivityFeed } from '@/components/workspace/LiveActivityFeed';
import { AttackDetailsPanel } from '@/components/workspace/AttackDetailsPanel';
import { DirectAgentTesterModal } from '@/components/workspace/DirectAgentTesterModal';
import { api, type StartRunParams } from '@/services/api';
import type { AttackItem, ScanRun } from '@/types';
import { Crosshair, RefreshCw } from 'lucide-react';

const terminalStates = ['completed', 'failed', 'cancelled', 'timed_out'];

export function ScanWorkspace() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialRunId = searchParams.get('runId');

  const [activeRun, setActiveRun] = useState<ScanRun | null>(null);
  const [attempts, setAttempts] = useState<AttackItem[]>([]);
  const [selectedAttack, setSelectedAttack] = useState<AttackItem | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isDirectTestOpen, setIsDirectTestOpen] = useState(false);

  const eventSourceRef = useRef<EventSource | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopStreaming = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  const syncRunData = async (runId: string) => {
    try {
      const [runData, attacksData] = await Promise.all([
        api.getRun(runId),
        api.getRunAttacks(runId).catch(() => []),
      ]);

      setActiveRun(runData);
      setAttempts(attacksData);

      // Auto-select first attack if none selected
      setSelectedAttack((prev) => {
        if (!prev && attacksData.length > 0) return attacksData[0];
        if (prev) {
          const updated = attacksData.find(
            (a) => a.attack_id === prev.attack_id
          );
          return updated || prev;
        }
        return null;
      });

      if (terminalStates.includes(runData.status)) {
        setIsScanning(false);
        stopStreaming();
      }
    } catch {
      // Ignore transient poll errors
    }
  };

  const startMonitoringRun = (runId: string) => {
    stopStreaming();
    setIsScanning(true);
    setSearchParams({ runId });

    // Initial load
    syncRunData(runId);

    // Setup SSE connection
    try {
      const sse = new EventSource(api.getEventsUrl(runId));
      eventSourceRef.current = sse;

      sse.onmessage = () => {
        syncRunData(runId);
      };

      [
        'scan_progress',
        'attack_generated',
        'attack_started',
        'attack_completed',
        'defense_mitigated',
        'defense_metrics_calculated',
        'finding_detected',
        'scan_completed',
        'scan_failed',
        'scan_cancelled',
      ].forEach((ev) => {
        sse.addEventListener(ev, () => {
          syncRunData(runId);
        });
      });

      sse.onerror = () => {
        // SSE error fallback to polling
      };
    } catch {
      // SSE unsupported or network block
    }

    // Polling fallback / complement
    pollIntervalRef.current = setInterval(() => {
      syncRunData(runId);
    }, 1200);
  };

  // If URL has runId on mount, monitor it
  useEffect(() => {
    if (initialRunId) {
      startMonitoringRun(initialRunId);
    }
    return () => {
      stopStreaming();
    };
  }, [initialRunId]);

  const handleStartScan = async (params: StartRunParams) => {
    setAttempts([]);
    setSelectedAttack(null);
    const result = await api.startRun(params);
    startMonitoringRun(result.run_id);
  };

  const handleCancelScan = async () => {
    if (!activeRun?.run_id) return;
    await api.cancelRun(activeRun.run_id);
    await syncRunData(activeRun.run_id);
  };

  return (
    <AppLayout
      title="Scan Workspace"
      actions={
        activeRun ? (
          <button
            onClick={() => syncRunData(activeRun.run_id)}
            aria-label="Refresh scan data"
            className="flex items-center gap-1.5 rounded-lg border border-base-700 bg-base-800 px-3 py-1.5 text-xs text-slate-300 hover:text-white"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Sync
          </button>
        ) : null
      }
    >
      <div className="mx-auto max-w-7xl px-6 py-6">
        {/* Page header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Crosshair className="h-5 w-5 text-accent-400" />
            <p className="text-sm text-slate-400">
              Configure your sandbox target and stream real-time adversarial scans
              with deterministic verification and red-team feedback.
            </p>
          </div>
        </div>

        {/* 3-column workspace layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left: Target config (col 4) */}
          <div className="lg:col-span-4 xl:col-span-3">
            <TargetConfigForm
              onStartScan={handleStartScan}
              onCancelScan={handleCancelScan}
              isScanning={isScanning}
              onOpenDirectTest={() => setIsDirectTestOpen(true)}
            />
          </div>

          {/* Center: Live activity feed (col 5) */}
          <div className="lg:col-span-5 xl:col-span-5">
            <LiveActivityFeed
              activeRun={activeRun}
              attempts={attempts}
              selectedAttackId={selectedAttack?.attack_id ?? null}
              onSelectAttack={(atk) => setSelectedAttack(atk)}
              isScanning={isScanning}
            />
          </div>

          {/* Right: Attack details panel (col 4) */}
          <div className="lg:col-span-3 xl:col-span-4">
            <AttackDetailsPanel attack={selectedAttack} />
          </div>
        </div>
      </div>

      {/* Direct Agent Tester Modal */}
      <DirectAgentTesterModal
        isOpen={isDirectTestOpen}
        onClose={() => setIsDirectTestOpen(false)}
      />
    </AppLayout>
  );
}
