
const CACHE_NAME = 'matchflow-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/home.png',
  '/chat.png',
  '/me.png',
  '/mystery.png',
  '/task.png',
  '/voice.png',
  '/video.png',
  '/gift.png',
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
      return response || fetch(event.request);
    })
  );
});
