// Service Worker for IT Service Management App
const CACHE_NAME = 'it-service-v2';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/offline.html'
];

function shouldCacheRequest(request) {
  // Only cache static app assets, never API calls or dynamic data responses.
  if (request.method !== 'GET') return false;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return false;
  if (url.pathname.startsWith('/api/')) return false;
  if (url.pathname.startsWith('/auth/')) return false;
  if (url.pathname.startsWith('/rest/')) return false;

  const destination = request.destination || '';
  return (
    destination === 'script' ||
    destination === 'style' ||
    destination === 'image' ||
    destination === 'font' ||
    destination === 'manifest' ||
    url.pathname.startsWith('/static/') ||
    url.pathname === '/' ||
    url.pathname === '/offline.html' ||
    url.pathname === '/manifest.json'
  );
}

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async (cache) => {
        console.log('Opened cache');
        // Cache each URL independently so one missing file does not fail SW install.
        const results = await Promise.allSettled(
          urlsToCache.map((url) => cache.add(url))
        );
        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            console.warn('Precache failed for:', urlsToCache[index], result.reason);
          }
        });
      })
      .then(() => {
        // Activate the new service worker as soon as possible.
        return self.skipWaiting();
      })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  const isNavigationRequest =
    event.request.mode === 'navigate' || event.request.destination === 'document';

  // Network-first for navigation to reduce stale pages on refresh/new tab.
  if (isNavigationRequest) {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cachedPage = await caches.match(event.request);
        if (cachedPage) return cachedPage;
        return caches.match('/offline.html');
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        
        return fetch(event.request).then((response) => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          if (shouldCacheRequest(event.request)) {
            // Clone and cache only static assets.
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
          }

          return response;
        });
      })
      .catch(() => {
        // Return offline page for navigation requests
        if (event.request.destination === 'document') {
          return caches.match('/offline.html');
        }
      })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Start controlling already-open tabs immediately.
      return clients.claim();
    })
  );
});

// Background sync for offline requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Sync offline requests when back online
  try {
    const offlineRequests = await getOfflineRequests();
    for (const request of offlineRequests) {
      await syncRequest(request);
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

async function getOfflineRequests() {
  // Get requests stored in IndexedDB while offline
  return new Promise((resolve) => {
    const request = indexedDB.open('ITServiceDB', 1);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['offlineRequests'], 'readonly');
      const store = transaction.objectStore('offlineRequests');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => {
        resolve(getAllRequest.result || []);
      };
    };
    request.onerror = () => {
      resolve([]);
    };
  });
}

async function syncRequest(request) {
  // Sync individual request to server
  try {
    const response = await fetch('/api/it-requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request)
    });
    
    if (response.ok) {
      // Remove from offline storage
      await removeOfflineRequest(request.id);
    }
  } catch (error) {
    console.error('Failed to sync request:', error);
  }
}

async function removeOfflineRequest(id) {
  return new Promise((resolve) => {
    const request = indexedDB.open('ITServiceDB', 1);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['offlineRequests'], 'readwrite');
      const store = transaction.objectStore('offlineRequests');
      store.delete(id);
      resolve();
    };
  });
}

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New IT request notification',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Request',
        icon: '/icon-192x192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icon-192x192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('IT Service Management', options)
  );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
        for (const client of windowClients) {
          if ('focus' in client) {
            if (client.url.includes('/it-requests')) {
              return client.focus();
            }
            if ('navigate' in client) {
              return client.navigate('/it-requests').then(() => client.focus());
            }
            return client.focus();
          }
        }
        return clients.openWindow('/it-requests');
      })
    );
  }
});
