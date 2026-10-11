import { AppLayout } from '@/components/layout/AppLayout';
import { ReportAttackTraces } from '@/components/report/ReportAttackTraces';

export function TracesExplorer() {
  return (
    <AppLayout title="Reproducible Attack Traces & Replay Store">
      <div className="space-y-6">
        <ReportAttackTraces />
      </div>
    </AppLayout>
  );
}
