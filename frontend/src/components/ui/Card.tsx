import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className = '', hover = false }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-base-700/60 bg-base-850/80 backdrop-blur-sm ${
        hover
          ? 'transition-all duration-200 ease-in-out hover:border-accent-500/40 hover:shadow-glow-accent'
          : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function CardHeader({
  title,
  icon,
  action,
  className = '',
}: CardHeaderProps) {
  return (
    <div
      className={`flex items-center justify-between border-b border-base-700/60 px-5 py-4 ${className}`}
    >
      <div className="flex items-center gap-2.5">
        {icon && <span className="text-accent-400">{icon}</span>}
        <h3 className="text-sm font-semibold tracking-wide text-slate-200">
          {title}
        </h3>
      </div>
      {action}
    </div>
  );
}
