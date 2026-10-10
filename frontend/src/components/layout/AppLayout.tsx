import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

interface AppLayoutProps {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function AppLayout({ title, actions, children }: AppLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-base-950">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar title={title} actions={actions} />
        <main className="flex-1 overflow-y-auto bg-console-grid scrollbar-thin">
          {children}
        </main>
      </div>
    </div>
  );
}
