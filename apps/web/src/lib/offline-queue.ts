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
const DB_VERSION = 2;
const STORE = 'sync-queue';
const READ_CACHE = 'read-cache';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    const timer = setTimeout(() => {
      req.transaction?.abort();
      reject(new Error('IndexedDB open timeout'));
    }, 4000);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(READ_CACHE)) {
        db.createObjectStore(READ_CACHE, { keyPath: 'url' });
      }
    };
    req.onsuccess = () => {
      clearTimeout(timer);
      resolve(req.result);
    };
    req.onerror = () => {
      clearTimeout(timer);
      reject(req.error);
    };
  });
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('IndexedDB timeout')), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function runStore<T>(
  storeName: string,
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(storeName, mode);
        const req = action(tx.objectStore(storeName));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      }),
  );
}

export async function enqueue(item: OfflineQueueItem): Promise<void> {
  await runStore(STORE, 'readwrite', (store) => store.put(item));
}

export async function getAllQueueItems(): Promise<OfflineQueueItem[]> {
  const items = await runStore<OfflineQueueItem[]>(STORE, 'readonly', (store) => store.getAll());
  return items.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function removeQueueItem(id: string): Promise<void> {
  await runStore(STORE, 'readwrite', (store) => store.delete(id));
}

export interface CachedRead<T> {
  data: T;
  cached: boolean;
}

export async function cachedGet<T>(url: string): Promise<CachedRead<T>> {
  try {
    const res = await api.get<T>(url, { timeout: 10000 });
    await withTimeout(
      runStore(READ_CACHE, 'readwrite', (store) =>
        store.put({ url, data: res.data, cachedAt: new Date().toISOString() }),
      ),
      3000,
    ).catch(() => undefined);
    return { data: res.data, cached: false };
  } catch (error) {
    const err = error as { response?: unknown };
    if (err.response) throw error;
    const hit = await withTimeout(
      runStore<{ url: string; data: T } | undefined>(
        READ_CACHE,
        'readonly',
        (store) => store.get(url) as IDBRequest<{ url: string; data: T } | undefined>,
      ),
      3000,
    );
    if (hit) return { data: hit.data, cached: true };
    throw error;
  }
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
