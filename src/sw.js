// Template: vite.config.js fills in VERSION and PRECACHE at build time and emits it as /sw.js.
const VERSION = '__VERSION__';
const PRECACHE = self.__PRECACHE__;

const CACHE = `toque-${VERSION}`;
const FONTS_CACHE = 'toque-fonts';
const FONT_ORIGINS = ['https://fonts.googleapis.com', 'https://fonts.gstatic.com'];
// On a slow connection, show the saved copy after this long instead of a blank screen.
const NETWORK_TIMEOUT_MS = 4000;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE.map((url) => new Request(url, { cache: 'reload' }))))
  );
  // No skipWaiting here: the page shows "Actualizar" and sends SKIP_WAITING when the user accepts.
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('toque-') && key !== CACHE && key !== FONTS_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

function networkFirst(event, fallbackUrl) {
  const { request } = event;
  const fromCache = async () =>
    (await caches.match(request)) ?? (fallbackUrl ? await caches.match(fallbackUrl) : undefined);

  const network = fetch(request).then((response) => {
    // Never cache errors: a single 500 would replace the last good copy.
    if (response.ok) {
      const copy = response.clone();
      event.waitUntil(caches.open(CACHE).then((cache) => cache.put(request, copy)));
    }
    return response;
  });
  // Keeps the worker alive so the cache still updates if the timeout wins the race.
  event.waitUntil(network.catch(() => {}));

  const timeout = new Promise((resolve) => setTimeout(resolve, NETWORK_TIMEOUT_MS));

  return (async () => {
    try {
      const response = await Promise.race([network, timeout]);
      if (response?.ok) return response;
      if (response) return (await fromCache()) ?? response; // server error: prefer the saved copy
      return (await fromCache()) ?? (await network); // timed out: saved copy, or keep waiting
    } catch {
      return (await fromCache()) ?? Response.error();
    }
  })();
}

async function cacheFirst(event, cacheName) {
  const { request } = event;
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    // Opaque = cross-origin font stylesheet loaded without CORS; its status can't be read.
    if (response.ok || response.type === 'opaque') {
      const copy = response.clone();
      event.waitUntil(caches.open(cacheName).then((cache) => cache.put(request, copy)));
    }
    return response;
  } catch {
    return Response.error();
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (FONT_ORIGINS.includes(url.origin)) {
    event.respondWith(cacheFirst(event, FONTS_CACHE));
    return;
  }
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') event.respondWith(networkFirst(event, '/index.html'));
  else if (url.pathname.startsWith('/data/')) event.respondWith(networkFirst(event));
  else event.respondWith(cacheFirst(event, CACHE));
});
