import { ReactNode } from 'react';

type Variant = 'default' | 'accent' | 'success' | 'warning' | 'danger' | 'muted';

interface BadgeProps {
  variant?: Variant;
  children: ReactNode;
  className?: string;
  dot?: boolean;
}

const variantClasses: Record<Variant, string> = {
  default: 'bg-base-800 text-slate-300 border-base-700',
  accent: 'bg-accent-500/10 text-accent-300 border-accent-500/30',
  success: 'bg-success-500/10 text-success-400 border-success-500/30',
  warning: 'bg-warning-500/10 text-warning-400 border-warning-500/30',
  danger: 'bg-danger-500/10 text-danger-400 border-danger-500/30',
  muted: 'bg-base-900 text-slate-500 border-base-800',
};

const dotClasses: Record<Variant, string> = {
  default: 'bg-slate-400',
  accent: 'bg-accent-400',
  success: 'bg-success-400',
  warning: 'bg-warning-400',
  danger: 'bg-danger-400',
  muted: 'bg-slate-500',
};

export function Badge({
  variant = 'default',
  children,
  className = '',
  dot = false,
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${variantClasses[variant]} ${className}`}
    >
      {dot && (
        <span
          className={`inline-block h-1.5 w-1.5 rounded-full ${dotClasses[variant]}`}
        />
      )}
      {children}
    </span>
  );
}
