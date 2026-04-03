/**
 * MatchFlow Service Worker
 * Basic skeleton to satisfy PWA requirements and handle future caching logic.
 */

const CACHE_NAME = 'mf-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Currently acting as a network-first pass-through
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});