import { ReactNode } from 'react';

interface TopBarProps {
  title: string;
  actions?: ReactNode;
}

export function TopBar({ title, actions }: TopBarProps) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-base-700/60 bg-base-900/80 px-6 backdrop-blur-sm">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold tracking-tight text-white">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {actions}

        {/* User avatar */}
        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-accent-500/30 bg-accent-500/10 text-sm font-semibold text-accent-300">
          OP
        </div>
      </div>
    </header>
  );
}
