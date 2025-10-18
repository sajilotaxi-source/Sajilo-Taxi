const CACHE_NAME = 'sajilo-taxi-cache-v7';
const urlsToCache = [
  '/',
  '/index.html',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // Force the waiting service worker to become the active service worker.
  );
});

self.addEventListener('fetch', (event) => {
  // Use a network-first (network falling back to cache) strategy.
  // This is better for apps that update frequently.
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // If we got a valid response, let's cache it and return it.
        // We only cache basic requests (same origin) to prevent errors.
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
        }
        return networkResponse;
      })
      .catch(() => {
        // If the network request fails (e.g., offline), try to serve from the cache.
        return caches.match(event.request).then((cachedResponse) => {
          // If the request is not in the cache, the browser will handle the error.
          return cachedResponse; 
        });
      })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      ).then(() => {
        console.log(`Service Worker Activated: ${CACHE_NAME.split('-').pop()}`);
        return self.clients.claim();
      });
    })
  );
});