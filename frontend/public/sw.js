const CACHE_NAME = 'ai-doctor-v2';
const STATIC_CACHE = 'ai-doctor-static-v2';
const DYNAMIC_CACHE = 'ai-doctor-dynamic-v2';

const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png'
];

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Opened static cache');
        // Use addAll with error handling - only cache files that exist
        return Promise.allSettled(
          urlsToCache.map(url => 
            cache.add(url).catch(err => {
              console.warn(`Failed to cache ${url}:`, err);
              return null; // Continue even if one file fails
            })
          )
        );
      })
      .then(() => {
        console.log('Service Worker installed successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker installation failed:', error);
        // Don't fail the installation if caching fails
        return self.skipWaiting();
      })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event with network-first strategy for API calls
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-http requests (like chrome-extension, data, etc.)
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Handle API requests with network-first strategy
  if (url.pathname.startsWith('/api/')) {
    // Only cache GET requests (Cache API doesn't support POST/PUT/DELETE)
    const isGetRequest = request.method === 'GET';
    
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Only cache successful GET responses
          if (isGetRequest && response.ok && response.status === 200) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseClone).catch(err => {
                console.warn('Failed to cache API response:', err);
              });
            });
          }
          return response;
        })
        .catch((error) => {
          // Only try cache for GET requests
          if (isGetRequest) {
            console.warn('API request failed, trying cache:', error);
            return caches.match(request).then(cachedResponse => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // Return a proper error response if no cache
              return new Response(
                JSON.stringify({ error: 'Network error and no cached response' }),
                {
                  status: 503,
                  statusText: 'Service Unavailable',
                  headers: { 'Content-Type': 'application/json' }
                }
              );
            });
          } else {
            // For non-GET requests, just return error
            return new Response(
              JSON.stringify({ error: 'Network error' }),
              {
                status: 503,
                statusText: 'Service Unavailable',
                headers: { 'Content-Type': 'application/json' }
              }
            );
          }
        })
    );
    return;
  }

  // Check if we're in development mode (localhost)
  const isDevelopment = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  
  // In development, use network-first strategy to avoid cache issues
  if (isDevelopment) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Don't cache in development
          return response;
        })
        .catch((error) => {
          console.warn('Network request failed in development:', error);
          // Fallback to cache only if network fails
          return caches.match(request).then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            throw error;
          });
        })
    );
    return;
  }
  
  // In production, use cache-first strategy for static assets
  // Only cache GET requests
  if (request.method !== 'GET') {
    // For non-GET requests, just fetch without caching
    event.respondWith(fetch(request));
    return;
  }
  
  event.respondWith(
    caches.match(request)
      .then((response) => {
        if (response) {
          return response;
        }
        
        return fetch(request).then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseClone).catch(err => {
                console.warn('Failed to cache response:', err);
              });
            });
          }
          return response;
        });
      })
  );
});

// Background sync for offline data
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Handle offline data synchronization
  console.log('Background sync triggered');
}

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New health update available',
    icon: '/icon.svg',
    badge: '/icon.svg',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Details',
        icon: '/icon.svg'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icon.svg'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('AI Doctor Agent', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
