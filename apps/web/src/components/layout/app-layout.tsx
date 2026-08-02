import { Outlet } from 'react-router-dom';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { PatientContextBar } from '@/components/shared/patient-context-bar';
import { useOffline } from '@/context/offline-context';
import { Button } from '@/components/ui/button';
import { WifiOff, CloudUpload, RefreshCw } from 'lucide-react';

function OfflineBanner() {
  const { isOnline, pendingCount, isFlushing, flush } = useOffline();

  if (isOnline && pendingCount === 0) return null;

  return (
    <div className="sticky top-16 z-20 flex items-center justify-between gap-3 bg-amber-50 border-b border-amber-200 px-4 lg:px-8 py-2">
      <div className="flex items-center gap-2 text-sm text-amber-800">
        {isOnline ? (
          <>
            <CloudUpload className="size-4 shrink-0" />
            <span>
              {pendingCount} {pendingCount === 1 ? 'record' : 'records'} saved offline —{' '}
              <span className="font-semibold">will sync automatically</span>
            </span>
          </>
        ) : (
          <>
            <WifiOff className="size-4 shrink-0" />
            <span>
              You are offline — records you save will be queued and synced
              automatically when you reconnect
            </span>
          </>
        )}
      </div>
      {isOnline && (
        <Button
          size="sm"
          variant="outline"
          className="shrink-0 border-amber-300 text-amber-800 hover:bg-amber-100"
          disabled={isFlushing}
          onClick={() => void flush()}
        >
          <RefreshCw className={`size-3.5 mr-1.5 ${isFlushing ? 'animate-spin' : ''}`} />
          {isFlushing ? 'Syncing…' : 'Sync now'}
        </Button>
      )}
    </div>
  );
}

export function AppLayout() {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="lg:pl-64">
        <Header />
        <OfflineBanner />
        <PatientContextBar />
        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
