import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Crosshair,
  FileText,
  Shield,
  Settings,
  ChevronRight,
} from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
}

const navItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/workspace', label: 'Scan Workspace', icon: Crosshair },
  { to: '/reports', label: 'Reports', icon: FileText },
];

export function Sidebar() {
  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-base-700/60 bg-base-900">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-accent-500/40 bg-accent-500/10 shadow-glow-accent">
          <Shield className="h-5 w-5 text-accent-400" />
        </div>
        <div className="leading-tight">
          <div className="text-base font-bold tracking-tight text-white">
            AgentBreak
          </div>
          <div className="text-[10px] font-medium uppercase tracking-widest text-accent-400/70">
            Security Console
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ease-in-out ${
                  isActive
                    ? 'bg-accent-500/10 text-accent-300 border border-accent-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-base-800/60 border border-transparent'
                }`
              }
            >
              <Icon className="h-4.5 w-4.5 shrink-0" />
              <span>{item.label}</span>
              <ChevronRight className="ml-auto h-4 w-4 opacity-0 transition-opacity duration-200 group-hover:opacity-50" />
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-base-700/60 px-3 py-4">
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-500 transition-all duration-200 ease-in-out hover:text-slate-300 hover:bg-base-800/60">
          <Settings className="h-4.5 w-4.5 shrink-0" />
          <span>Settings</span>
        </button>
        <div className="mt-3 px-3 text-[10px] text-slate-600">
          v0.1.0 — Alpha
        </div>
      </div>
    </aside>
  );
}
