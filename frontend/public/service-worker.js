/**
 * MOJ Case Tracking System — Service Worker v1.0.0
 *
 * Caching strategy:
 *  - Static assets (JS, CSS, images, fonts): Cache-first (immutable fingerprints)
 *  - API calls (/api/*): Network-first, fallback to cache
 *  - Navigation requests: Network-first, fallback to cached index.html
 *  - Everything else: Network-only
 */

const CACHE = {
  STATIC: 'moj-static-v1',
  API: 'moj-api-v1',
  SHELL: 'moj-shell-v1',
};

const STATIC_EXTENSIONS = /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff2?|ttf|eot|webp)$/;

// ── Install: pre-cache the app shell ──────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE.SHELL).then((cache) => {
      return cache.addAll([
        '/',
        '/offline.html',
      ]).catch(() => {
        // Offline.html may not exist yet — that's fine
      });
    }).then(() => self.skipWaiting())
  );
});

// ── Activate: clean up old caches ─────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => !Object.values(CACHE).includes(k))
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: route to strategy ──────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  // Static assets — cache-first
  if (STATIC_EXTENSIONS.test(url.pathname)) {
    event.respondWith(cacheFirst(request, CACHE.STATIC));
    return;
  }

  // API calls — network-first
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request, CACHE.API));
    return;
  }

  // Navigation requests — network-first, fallback to shell
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, CACHE.SHELL).catch(() =>
      caches.match('/offline.html').then((r) => r || caches.match('/'))
    ));
    return;
  }

  // Everything else — network-only
  event.respondWith(fetch(request).catch(() => new Response('Offline', { status: 503 })));
});

// ── Strategies ────────────────────────────────────────────

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      // Don't cache opaque responses
      if (response.type === 'basic') cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    return new Response('Offline', { status: 503 });
  }
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      if (response.type === 'basic') cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;

    // For navigation, return the shell
    if (request.mode === 'navigate') {
      const shell = await caches.match('/');
      if (shell) return shell;
      const offline = await caches.match('/offline.html');
      if (offline) return offline;
    }

    return new Response(JSON.stringify({ success: false, error: 'You are offline.' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
