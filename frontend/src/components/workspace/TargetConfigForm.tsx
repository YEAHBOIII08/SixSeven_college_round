import { useEffect, useState } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { api, type StartRunParams } from '@/services/api';
import type { AttackTemplate, ScanMode } from '@/types';
import {
  SlidersHorizontal,
  Shield,
  Zap,
  Play,
  XCircle,
  Loader2,
  Terminal,
  Cpu,
  CheckSquare,
  Square,
  AlertTriangle,
} from 'lucide-react';

interface TargetConfigFormProps {
  onStartScan: (params: StartRunParams) => Promise<void>;
  onCancelScan: () => Promise<void>;
  isScanning: boolean;
  onOpenDirectTest: () => void;
}

export function TargetConfigForm({
  onStartScan,
  onCancelScan,
  isScanning,
  onOpenDirectTest,
}: TargetConfigFormProps) {
  const [targetName, setTargetName] = useState('CustomerSupportAgent');
  const [scanMode, setScanMode] = useState<ScanMode>('deterministic');
  const [vulnerableMode, setVulnerableMode] = useState(false);
  const [maxTests, setMaxTests] = useState(12);
  const [maxRounds, setMaxRounds] = useState(3);
  const [timeoutSeconds, setTimeoutSeconds] = useState(180);
  const [availableAttacks, setAvailableAttacks] = useState<AttackTemplate[]>([]);
  const [selectedAttackIds, setSelectedAttackIds] = useState<string[]>([]);
  const [useAllAttacks, setUseAllAttacks] = useState(true);
  const [starting, setStarting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getAttacks()
      .then((attacks) => {
        setAvailableAttacks(attacks);
        setSelectedAttackIds(attacks.map((a) => a.attack_id));
      })
      .catch(() => {
        // Fallback if attacks endpoint not ready
      });
  }, []);

  const toggleAttack = (id: string) => {
    if (selectedAttackIds.includes(id)) {
      setSelectedAttackIds(selectedAttackIds.filter((item) => item !== id));
    } else {
      setSelectedAttackIds([...selectedAttackIds, id]);
    }
  };

  const handleLaunch = async () => {
    setFormError(null);
    setStarting(true);
    try {
      await onStartScan({
        target_name: targetName.trim() || 'CustomerSupportAgent',
        scan_mode: scanMode,
        vulnerable_mode: vulnerableMode,
        max_tests: maxTests,
        max_rounds: maxRounds,
        timeout_seconds: timeoutSeconds,
        attack_ids: useAllAttacks ? undefined : selectedAttackIds,
      });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to launch scan');
    } finally {
      setStarting(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await onCancelScan();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to cancel scan');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <Card className="flex flex-col">
      <CardHeader
        title="Target & Scan Configuration"
        icon={<SlidersHorizontal className="h-4 w-4" />}
        action={
          <button
            onClick={onOpenDirectTest}
            className="inline-flex items-center gap-1 rounded border border-accent-500/30 bg-accent-500/10 px-2 py-1 text-[11px] font-medium text-accent-300 hover:bg-accent-500/20"
          >
            <Terminal className="h-3 w-3" />
            Direct Test
          </button>
        }
      />
      <div className="space-y-5 p-5">
        {formError && (
          <div className="rounded-lg border border-danger-500/30 bg-danger-500/10 p-3 text-xs text-danger-300">
            {formError}
          </div>
        )}

        {/* Target selection */}
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">
            Target AI Sandbox
          </label>
          <div className="relative">
            <Cpu className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={targetName}
              onChange={(e) => setTargetName(e.target.value)}
              disabled={isScanning}
              className="w-full rounded-lg border border-base-700 bg-base-800 py-2.5 pl-10 pr-3 text-sm text-slate-200 placeholder-slate-500 transition-all focus:border-accent-500/50 focus:outline-none focus:ring-1 focus:ring-accent-500/30 disabled:opacity-50"
              placeholder="CustomerSupportAgent"
            />
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Evaluating in-process sandboxed agent with mock support & refund tools.
          </p>
        </div>

        {/* Scan Mode */}
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">
            Adversarial Mode
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={isScanning}
              onClick={() => setScanMode('deterministic')}
              className={`flex flex-col items-start rounded-lg border p-2.5 text-left transition-all ${
                scanMode === 'deterministic'
                  ? 'border-accent-500/60 bg-accent-500/10 text-white'
                  : 'border-base-700 bg-base-850/60 text-slate-400 hover:border-base-600'
              } disabled:opacity-50`}
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                <Shield className="h-3.5 w-3.5 text-accent-400" />
                Deterministic
              </div>
              <span className="mt-1 text-[10px] text-slate-400 leading-tight">
                Curated attack corpus & rule-based checks
              </span>
            </button>

            <button
              type="button"
              disabled={isScanning}
              onClick={() => setScanMode('adaptive')}
              className={`flex flex-col items-start rounded-lg border p-2.5 text-left transition-all ${
                scanMode === 'adaptive'
                  ? 'border-accent-500/60 bg-accent-500/10 text-white'
                  : 'border-base-700 bg-base-850/60 text-slate-400 hover:border-base-600'
              } disabled:opacity-50`}
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                <Zap className="h-3.5 w-3.5 text-warning-400" />
                Adaptive Gemini
              </div>
              <span className="mt-1 text-[10px] text-slate-400 leading-tight">
                LLM-generated red team probes & feedback loops
              </span>
            </button>
          </div>
        </div>

        {/* Sandbox Security Profile */}
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400">
            Sandbox Target Posture
          </label>
          <div className="space-y-2">
            <button
              type="button"
              disabled={isScanning}
              onClick={() => setVulnerableMode(false)}
              className={`flex w-full items-center justify-between rounded-lg border p-2.5 text-left transition-all ${
                !vulnerableMode
                  ? 'border-success-500/50 bg-success-500/10 text-slate-200'
                  : 'border-base-700 bg-base-850/60 text-slate-400 hover:border-base-600'
              } disabled:opacity-50`}
            >
              <div>
                <div className="text-xs font-medium text-slate-200">
                  Secure Profile (Enforced Controls)
                </div>
                <div className="text-[10px] text-slate-500">
                  Strict boundary validation, authorization, and canary secrecy.
                </div>
              </div>
              {!vulnerableMode && (
                <Badge variant="success" dot>
                  Secure
                </Badge>
              )}
            </button>

            <button
              type="button"
              disabled={isScanning}
              onClick={() => setVulnerableMode(true)}
              className={`flex w-full items-center justify-between rounded-lg border p-2.5 text-left transition-all ${
                vulnerableMode
                  ? 'border-warning-500/50 bg-warning-500/10 text-slate-200'
                  : 'border-base-700 bg-base-850/60 text-slate-400 hover:border-base-600'
              } disabled:opacity-50`}
            >
              <div>
                <div className="text-xs font-medium text-warning-300">
                  Vulnerable Profile (Simulated Flaws)
                </div>
                <div className="text-[10px] text-slate-500">
                  Enables intentional BOLA/IDOR and indirect ticket injection flaws.
                </div>
              </div>
              {vulnerableMode && (
                <Badge variant="warning" dot>
                  Vulnerable
                </Badge>
              )}
            </button>
          </div>
        </div>

        {/* Attack Vector Scope */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Attack Vector Scope
            </label>
            <button
              type="button"
              disabled={isScanning}
              onClick={() => setUseAllAttacks(!useAllAttacks)}
              className="text-[11px] text-accent-400 hover:underline disabled:opacity-50"
            >
              {useAllAttacks ? 'Customize Vectors' : 'Select All'}
            </button>
          </div>

          {!useAllAttacks && availableAttacks.length > 0 && (
            <div className="max-h-36 space-y-1.5 overflow-y-auto rounded-lg border border-base-700/60 bg-base-850/60 p-2 text-xs scrollbar-thin">
              {availableAttacks.map((atk) => {
                const isSelected = selectedAttackIds.includes(atk.attack_id);
                return (
                  <button
                    key={atk.attack_id}
                    type="button"
                    disabled={isScanning}
                    onClick={() => toggleAttack(atk.attack_id)}
                    className="flex w-full items-center gap-2 rounded px-2 py-1 text-left hover:bg-base-700/50 disabled:opacity-50"
                  >
                    {isSelected ? (
                      <CheckSquare className="h-3.5 w-3.5 text-accent-400 shrink-0" />
                    ) : (
                      <Square className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    )}
                    <span className="truncate text-slate-300">{atk.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Execution Budgets */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-slate-400">
              Max Tests ({maxTests})
            </label>
            <input
              type="range"
              min={1}
              max={30}
              value={maxTests}
              disabled={isScanning}
              onChange={(e) => setMaxTests(parseInt(e.target.value, 10))}
              className="w-full accent-accent-500 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-medium text-slate-400">
              Adaptive Rounds ({maxRounds})
            </label>
            <input
              type="range"
              min={1}
              max={5}
              value={maxRounds}
              disabled={isScanning || scanMode !== 'adaptive'}
              onChange={(e) => setMaxRounds(parseInt(e.target.value, 10))}
              className="w-full accent-accent-500 disabled:opacity-50"
            />
          </div>
        </div>

        {/* Action Controls */}
        <div className="pt-2">
          {isScanning ? (
            <Button
              type="button"
              variant="danger"
              className="w-full"
              size="lg"
              disabled={cancelling}
              onClick={handleCancel}
            >
              {cancelling ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4" />
                  Cancel In-Progress Scan
                </>
              )}
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              className="w-full shadow-glow-accent"
              size="lg"
              disabled={starting}
              onClick={handleLaunch}
            >
              {starting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Initializing Scan...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Launch Security Scan
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
