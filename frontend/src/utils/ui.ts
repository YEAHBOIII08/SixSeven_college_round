import type { RiskLevel } from '../types';

export const riskColors: Record<
  RiskLevel,
  { bg: string; text: string; border: string; dot: string; label: string }
> = {
  safe: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    dot: 'bg-emerald-400',
    label: 'Safe',
  },
  warn: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    dot: 'bg-amber-400',
    label: 'Medium Risk',
  },
  crit: {
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    border: 'border-rose-500/30',
    dot: 'bg-rose-400',
    label: 'Critical',
  },
};

export function scoreColor(score: number): string {
  if (score >= 8) return 'text-emerald-400';
  if (score >= 6) return 'text-amber-400';
  return 'text-rose-400';
}

export function scoreBg(score: number): string {
  if (score >= 8) return 'from-emerald-500 to-emerald-600';
  if (score >= 6) return 'from-amber-500 to-amber-600';
  return 'from-rose-500 to-rose-600';
}

export function scoreToLevel(score: number): RiskLevel {
  if (score >= 8) return 'safe';
  if (score >= 6) return 'warn';
  return 'crit';
}
