// Standard PWA Service Worker for MatchFlow
const CACHE_NAME = 'matchflow-v1';

self.addEventListener('install', (event) => {
  console.log('[SW] Installed');
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activated');
});

self.addEventListener('fetch', (event) => {
  // Let the browser handle the requests normally
  // This is required for the "Add to Home Screen" prompt
});