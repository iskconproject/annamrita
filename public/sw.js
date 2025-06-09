const CACHE_NAME = 'annamrita-pos-v3';
const urlsToCache = [
  '/',
  '/index.html',
];

// Install a service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('Failed to cache resources:', error);
        // Don't fail the installation if caching fails
        return Promise.resolve();
      })
  );
});

// Cache and return requests
self.addEventListener('fetch', (event) => {
  // Skip service worker for development files
  if (event.request.url.includes('/@vite/') ||
    event.request.url.includes('/@react-refresh') ||
    event.request.url.includes('?t=') ||
    event.request.url.includes('.tsx') ||
    event.request.url.includes('.ts') ||
    event.request.url.includes('.jsx') ||
    event.request.url.includes('.js') && event.request.url.includes('?')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Try to fetch from network
        return fetch(event.request)
          .then((networkResponse) => {
            // Check if we received a valid response
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            // Clone the response for caching
            const responseToCache = networkResponse.clone();

            // Only cache GET requests for specific file types
            if (event.request.method === 'GET' &&
              (event.request.url.endsWith('.js') ||
                event.request.url.endsWith('.css') ||
                event.request.url.endsWith('.html') ||
                event.request.url.endsWith('.png') ||
                event.request.url.endsWith('.jpg') ||
                event.request.url.endsWith('.svg'))) {
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
            }

            return networkResponse;
          });
      })
      .catch(() => {
        // If both cache and network fail
        if (event.request.url.indexOf('/api/') !== -1) {
          // For API requests, return offline response
          return new Response(JSON.stringify({
            error: 'You are offline',
            offline: true
          }), {
            headers: { 'Content-Type': 'application/json' },
            status: 503,
            statusText: 'Service Unavailable'
          });
        }

        // For other requests, try to return a basic response
        return new Response('Offline', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'text/plain' }
        });
      })
  );
});

// Update a service worker
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
          return null;
        })
      );
    })
  );
});
