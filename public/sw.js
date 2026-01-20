const CACHE_NAME = 'b-ready-v1.0.0';
const OFFLINE_URL = '/offline';

// Assets to cache
const STATIC_CACHE_URLS = [
  '/',
  '/safety-tips',
  '/offline',
  '/offline/status',
  '/manifest.json',
  '/BLogo.png',
  '/BLogo.svg',
  '/globals.css',
  // Add other critical assets
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('🚀 Service Worker installing');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('📦 Caching static assets');
      return cache.addAll(STATIC_CACHE_URLS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activating');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Handle API calls differently - try network first, fallback to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone the response for caching
          const responseClone = response.clone();

          // Cache successful API responses (except auth-related)
          if (response.status === 200 && !url.pathname.includes('/auth')) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }

          return response;
        })
        .catch(() => {
          // Network failed, try cache
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Return offline response for API calls
            return new Response(JSON.stringify({
              success: false,
              offline: true,
              message: 'You are currently offline. This feature requires an internet connection.'
            }), {
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            });
          });
        })
    );
    return;
  }

  // Handle page requests - network first, then cache, then offline page
  if (event.request.headers.get('accept').includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache successful page responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Network failed, try cache first for critical pages
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }

            // For critical pages like home and safety tips, try to serve cached versions
            const url = new URL(event.request.url);
            if (url.pathname === '/' || url.pathname === '/safety-tips') {
              // Try to serve the cached version of these critical pages
              return caches.match(url.pathname).then((criticalCachedResponse) => {
                if (criticalCachedResponse) {
                  return criticalCachedResponse;
                }
                // If no cached version, fall back to offline page
                return caches.match(OFFLINE_URL).then((offlineResponse) => {
                  return offlineResponse || new Response(
                    `<html><body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                      <h1>📱 You're Offline</h1>
                      <p>You are currently not connected to the internet.</p>
                      <p>You can still access the <a href="/safety-tips">Safety Tips</a> when they're cached, or use the offline emergency reporting.</p>
                      <p><a href="/offline">Go to Offline Mode</a></p>
                    </body></html>`,
                    {
                      status: 503,
                      headers: { 'Content-Type': 'text/html' }
                    }
                  );
                });
              });
            }

            // For all other pages, serve offline page
            return caches.match(OFFLINE_URL).then((offlineResponse) => {
              return offlineResponse || new Response('Offline - Please check your internet connection', {
                status: 503,
                headers: { 'Content-Type': 'text/plain' }
              });
            });
          });
        })
    );
    return;
  }

  // For all other requests (CSS, JS, images, etc.) - cache first, then network
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((response) => {
        // Cache successful responses
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      }).catch(() => {
        // Return a basic offline response for failed asset requests
        if (event.request.destination === 'image') {
          return new Response('', { status: 404 });
        }
        return new Response('Offline', { status: 503 });
      });
    })
  );
});

// Background sync for offline reports
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-reports') {
    event.waitUntil(syncOfflineReports());
  }
});

// Function to sync offline reports when back online
async function syncOfflineReports() {
  try {
    // Get offline reports from localStorage (simplified implementation)
    const stored = localStorage.getItem('bready_offline_reports');
    const offlineReports = stored ? JSON.parse(stored) : [];

    for (const report of offlineReports) {
      try {
        const response = await fetch('/api/reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(report),
        });

        if (response.ok) {
          // Mark as synced and remove from offline storage
          const reports = JSON.parse(localStorage.getItem('bready_offline_reports') || '[]');
          const updated = reports.map(r =>
            r.offlineId === report.offlineId ? { ...r, synced: true } : r
          );
          localStorage.setItem('bready_offline_reports', JSON.stringify(updated));
        }
      } catch (error) {
        console.error('Failed to sync report:', report.offlineId, error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}



// Handle push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();

  const options = {
    body: data.body,
    icon: '/BLogo.png',
    badge: '/BLogo.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
    },
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'B-READY Alert', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});
