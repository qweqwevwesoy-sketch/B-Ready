const CACHE_NAME = 'b-ready-v2.0.0';
const OFFLINE_URL = '/offline';

// Critical pages and assets to cache immediately
const CRITICAL_CACHE_URLS = [
  '/',
  '/safety-tips',
  '/manifest.json',
  '/BLogo.png',
  '/BLogo.svg',
];

// Install event - cache critical assets
self.addEventListener('install', (event) => {
  console.log('🚀 Service Worker installing');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('📦 Caching critical assets');
      return cache.addAll(CRITICAL_CACHE_URLS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches and claim clients
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activating');
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients
      self.clients.claim()
    ])
  );
});

// Message handler for communication with main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch event - handle different types of requests
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const isNavigation = event.request.mode === 'navigate';
  const isApiCall = url.pathname.startsWith('/api/');

  // Handle API calls
  if (isApiCall && event.request.method === 'GET') {
    event.respondWith(handleApiRequest(event.request));
    return;
  }

  // Handle navigation requests (page loads)
  if (isNavigation) {
    event.respondWith(handleNavigationRequest(event.request));
    return;
  }

  // Handle static assets
  event.respondWith(handleStaticAsset(event.request));
});

// Handle API requests with offline fallback
async function handleApiRequest(request) {
  try {
    // Try network first for API calls
    const response = await fetch(request);
    return response;
  } catch (error) {
    console.log('🌐 API request failed, checking cache:', request.url);

    // Try to serve from cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline API response
    return new Response(JSON.stringify({
      success: false,
      offline: true,
      message: 'You are currently offline. This feature requires an internet connection.'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle navigation requests with offline page fallback
async function handleNavigationRequest(request) {
  try {
    // Try network first
    const response = await fetch(request);
    if (response.status === 200) {
      // Cache successful page responses for future offline use
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('🌐 Navigation failed, trying cache:', request.url);

    // Try to serve from cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // No cached version available - return offline response
    return new Response('Offline - This page is not available without internet connection', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

// Handle static assets with cache-first strategy
async function handleStaticAsset(request) {
  // Only cache GET requests - Cache API doesn't support other methods
  if (request.method !== 'GET') {
    try {
      return await fetch(request);
    } catch (error) {
      return new Response('Method not allowed for caching', { status: 405 });
    }
  }

  // Try cache first for static assets
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    // Fetch from network
    const response = await fetch(request);
    if (response.status === 200) {
      // Cache successful responses
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // For images, return empty response
    if (request.destination === 'image') {
      return new Response('', { status: 404 });
    }

    // For other assets, return error
    return new Response('Offline', { status: 503 });
  }
}

// Background sync for offline reports (placeholder - actual sync handled by main thread)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-reports') {
    console.log('🔄 Background sync triggered for reports');
    // Sync is handled by the main thread through the offline manager
    // This is just a placeholder to acknowledge the sync event
    event.waitUntil(Promise.resolve());
  }
});

// Periodic sync for maintenance tasks
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'maintenance') {
    event.waitUntil(performMaintenance());
  }
});

// Maintenance tasks
async function performMaintenance() {
  try {
    // Clean up old caches
    const cacheNames = await caches.keys();
    const oldCaches = cacheNames.filter(name =>
      name.startsWith('b-ready-v') &&
      name !== CACHE_NAME
    );

    await Promise.all(oldCaches.map(name => caches.delete(name)));

    console.log('🧹 Maintenance completed');
  } catch (error) {
    console.error('Maintenance failed:', error);
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
