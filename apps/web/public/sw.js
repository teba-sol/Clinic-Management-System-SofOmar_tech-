const CACHE_VERSION = 'sofomar-v1';
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/maskable-512x512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !key.startsWith(CACHE_VERSION))
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function isNavigationRequest(request) {
  return request.mode === 'navigate' || request.destination === 'document';
}

function shouldSkipSensitive(request) {
  const url = new URL(request.url);
  return /\/pdf$/i.test(url.pathname) || /\/download$/i.test(url.pathname);
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(SHELL_CACHE);
    cache.put('/index.html', response.clone());
    return response;
  } catch (error) {
    const cached = await caches.match('/index.html');
    if (cached) return cached;
    return Response.error();
  }
}

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);
  const update = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        const cache = caches.open(RUNTIME_CACHE);
        cache.then((c) => c.put(request, response.clone()));
      }
      return response;
    })
    .catch(() => undefined);
  return cached || (await update) || Response.error();
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (shouldSkipSensitive(request)) return;

  if (isNavigationRequest(request)) {
    event.respondWith(networkFirst(request));
    return;
  }

  if (request.destination === 'document' || request.destination === '') return;

  event.respondWith(staleWhileRevalidate(request));
});
