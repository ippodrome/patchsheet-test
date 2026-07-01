// Service Worker — Patch Sheet
const VERSION = 'v4';
const CACHE = 'patchsheet-' + VERSION;

// Vid installation — cacha appen
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(['./', './index.html']))
  );
  self.skipWaiting(); // aktivera direkt
});

// Vid aktivering — rensa gamla cacher
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — network first, fallback till cache
self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Spara ny version i cache
        const clone = res.clone();
        caches.open(CACHE).then(cache => cache.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

// Meddela alla klienter när ny version finns
self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});
