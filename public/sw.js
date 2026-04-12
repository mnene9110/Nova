const CACHE_NAME = 'matchflow-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/home.png',
  '/chat.png',
  '/me.png',
  '/chatt.png',
  '/mystery.png',
  '/task.png',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached asset or fetch from network
      return response || fetch(event.request).then((fetchResponse) => {
        // Cache new assets dynamically (optional but helpful)
        if (event.request.url.startsWith('http') && fetchResponse.status === 200) {
          const cacheCopy = fetchResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cacheCopy));
        }
        return fetchResponse;
      });
    }).catch(() => {
      // Fallback for navigation requests when offline
      if (event.request.mode === 'navigate') {
        return caches.match('/');
      }
    })
  );
});