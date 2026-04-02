// ============================================================
// SEA SERVICE LOGGER — Service Worker
// ============================================================

const CACHE_NAME = 'ssl-v2';

const PRECACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/privacy.html',
  '/terms.html',
  '/css/tokens.css',
  '/css/app.css',
  '/js/app.js',
  '/js/store.js',
  '/js/compliance.js',
  '/js/tier.js',
  '/js/logSheet.js',
  '/js/export.js',
  '/js/ui/dashboard.js',
  '/js/ui/calendar.js',
  '/js/ui/profile.js',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // Cache-first for app shell; network-first for API calls
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
  } else {
    event.respondWith(
      caches.match(event.request).then(cached => cached || fetch(event.request))
    );
  }
});
