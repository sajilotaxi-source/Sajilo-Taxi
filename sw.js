const CACHE_NAME = 'sajilo-taxi-cache-v4'; // Incremented version to ensure update
const urlsToCache = [
  '/',
  '/index.html',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Install event: skip waiting and cache core assets
self.addEventListener('install', (event) => {
  // Force the waiting service worker to become the active service worker.
  // This ensures updates are applied immediately.
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache v4');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event: Apply network-first strategy
self.addEventListener('fetch', (event) => {
  // Use a network-first (network falling back to cache) strategy.
  // This is best for apps that update frequently, ensuring users get the latest version.
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // If we got a valid response, let's cache it for offline use and return it.
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
        // If the network request fails (e.g., user is offline), try to serve from the cache.
        return caches.match(event.request).then((cachedResponse) => {
          // If the request is not in the cache, the browser will handle the error.
          return cachedResponse; 
        });
      })
  );
});

// Activate event: Clean up old caches and claim clients
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // If a cache is not on the whitelist, delete it.
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all open clients (tabs) to ensure they use the new service worker.
      return self.clients.claim();
    })
  );
});