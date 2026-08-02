import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  flushOfflineQueue,
  getAllQueueItems,
  type FlushResult,
} from '@/lib/offline-queue';

interface OfflineContextValue {
  isOnline: boolean;
  pendingCount: number;
  isFlushing: boolean;
  lastSyncAt: number | null;
  lastSyncResult: FlushResult | null;
  flush: () => Promise<void>;
  refreshPendingCount: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextValue | null>(null);

export function OfflineProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator === 'undefined' ? true : navigator.onLine,
  );
  const [pendingCount, setPendingCount] = useState(0);
  const [isFlushing, setIsFlushing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);
  const [lastSyncResult, setLastSyncResult] = useState<FlushResult | null>(null);
  const flushingRef = useRef(false);

  const refreshPendingCount = useCallback(async () => {
    try {
      const items = await getAllQueueItems();
      setPendingCount(items.length);
    } catch {
      setPendingCount(0);
    }
  }, []);

  const flush = useCallback(async () => {
    if (flushingRef.current) return;
    flushingRef.current = true;
    setIsFlushing(true);
    try {
      const result = await flushOfflineQueue();
      setLastSyncResult(result);
      if (result.synced > 0) setLastSyncAt(Date.now());
    } catch {
      // keep items queued
    } finally {
      flushingRef.current = false;
      setIsFlushing(false);
      await refreshPendingCount();
    }
  }, [refreshPendingCount]);

  useEffect(() => {
    const goOnline = () => {
      setIsOnline(true);
      void flush();
    };
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, [flush]);

  /* eslint-disable react-hooks/set-state-in-effect -- one-time load + flush of items queued during a prior offline session */
  useEffect(() => {
    void refreshPendingCount();
    if (navigator.onLine) void flush();
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        pendingCount,
        isFlushing,
        lastSyncAt,
        lastSyncResult,
        flush,
        refreshPendingCount,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- context hook paired with its provider
export function useOffline(): OfflineContextValue {
  const ctx = useContext(OfflineContext);
  if (!ctx) throw new Error('useOffline must be used within OfflineProvider');
  return ctx;
}
