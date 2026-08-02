import api from './api';

export type OfflineQueueType =
  | 'vital-create'
  | 'vital-update'
  | 'visit-create'
  | 'visit-update';

export interface OfflineQueueItem {
  id: string;
  type: OfflineQueueType;
  method: 'POST' | 'PATCH';
  url: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface FlushResult {
  synced: number;
  failed: number;
  offline: boolean;
}

const DB_NAME = 'sofomar-offline';
const DB_VERSION = 1;
const STORE = 'sync-queue';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function runStore<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const req = action(tx.objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      }),
  );
}

export async function enqueue(item: OfflineQueueItem): Promise<void> {
  await runStore('readwrite', (store) => store.put(item));
}

export async function getAllQueueItems(): Promise<OfflineQueueItem[]> {
  const items = await runStore<OfflineQueueItem[]>('readonly', (store) => store.getAll());
  return items.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function removeQueueItem(id: string): Promise<void> {
  await runStore('readwrite', (store) => store.delete(id));
}

export async function flushOfflineQueue(): Promise<FlushResult> {
  const items = await getAllQueueItems();
  if (items.length === 0) return { synced: 0, failed: 0, offline: false };

  let synced = 0;
  let failed = 0;

  for (const item of items) {
    try {
      await api.request({ method: item.method, url: item.url, data: item.payload });
      await removeQueueItem(item.id);
      synced += 1;
    } catch (error) {
      const err = error as { response?: unknown };
      if (!err.response) {
        return { synced, failed, offline: true };
      }
      await removeQueueItem(item.id);
      failed += 1;
    }
  }

  return { synced, failed, offline: false };
}
