
const CACHE_NAME = 'matchflow-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(['/']);
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Simple network-first strategy for dynamic social app
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
