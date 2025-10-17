const CACHE_NAME = 'sajilo-taxi-cache-v5'; // Incremented version to ensure update
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
        console.log('Opened cache v5');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event: Apply network-first strategy, bypassing HTTP cache for navigations
self.addEventListener('fetch', (event) => {
  // Use a network-first (network falling back to cache) strategy.
  // For navigation, we create a new request that bypasses the browser's HTTP cache.
  // This is crucial for ensuring the user gets the latest version of the app shell,
  // which in turn loads the new service worker and app code.
  const fetchRequest = event.request.mode === 'navigate'
    ? new Request(event.request, { cache: 'reload' })
    : event.request;

  event.respondWith(
    fetch(fetchRequest)
      .then((networkResponse) => {
        // If we got a valid response, let's cache it for offline use and return it.
        // We cache the original request (event.request) not the modified cache-busting one.
        if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
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
            console.log('Deleting old cache:', cacheName);
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