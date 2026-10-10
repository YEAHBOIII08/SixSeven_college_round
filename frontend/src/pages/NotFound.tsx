import { AppLayout } from '@/components/layout/AppLayout';
import { ButtonLink } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Compass } from 'lucide-react';

export function NotFound() {
  return (
    <AppLayout title="Not Found">
      <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-base-700 bg-base-800 text-slate-500">
          <Compass className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-semibold text-white">Page not found</h2>
        <p className="mt-2 text-sm text-slate-400">
          The page you're looking for doesn't exist or has moved.
        </p>
        <div className="mt-6">
          <ButtonLink to="/" variant="secondary">
            Back to Dashboard
          </ButtonLink>
        </div>
      </div>
    </AppLayout>
  );
}
