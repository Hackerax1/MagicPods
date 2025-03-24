// Service Worker for MTG Svelte app - offline support
const CACHE_NAME = 'mtg-svelte-cache-v1';
const DYNAMIC_CACHE = 'mtg-svelte-dynamic-v1';
const REPO_NAME = 'MTGSvelte3'; // GitHub repository name - Update this if you change your repo name

// Function to determine the base URL
function getBaseUrl() {
  return location.hostname === 'localhost' || location.hostname === '127.0.0.1'
    ? ''
    : `/${REPO_NAME}`;
}

// Assets to cache on install - include base path for GitHub Pages
const STATIC_ASSETS = [
  `${getBaseUrl()}/`,
  `${getBaseUrl()}/favicon.png`,
  `${getBaseUrl()}/app.css`,
  `${getBaseUrl()}/index.js`,
  // Add other static assets like fonts, images, etc.
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME && cache !== DYNAMIC_CACHE) {
            console.log('Service Worker: Clearing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// API routes that should be specially handled
const API_ROUTES = [
  '/api/deck',
  '/api/cards',
  '/api/auth'
];

// Simple function to check if a URL is an API route
function isApiRoute(url) {
  const base = getBaseUrl();
  return API_ROUTES.some(route => url.includes(`${base}${route}`));
}

// Function to check if a request is for a card image from Scryfall or similar
function isCardImage(url) {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.host === 'scryfall.com' || parsedUrl.host === 'gatherer.wizards.com';
  } catch (e) {
    return false;
  }
}

// Fetch event - handle network requests
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Special handling for API requests
  if (isApiRoute(requestUrl.pathname)) {
    // Network-first strategy for API requests
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache a copy of the response and return the response
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // If network fails, try to get from cache
          return caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // If not in cache, return error or offline fallback
            return new Response(JSON.stringify({ 
              error: 'You are offline and this resource is not cached.' 
            }), {
              headers: { 'Content-Type': 'application/json' },
              status: 503
            });
          });
        })
    );
    return;
  }

  // Cache-first strategy for card images
  if (isCardImage(requestUrl.href)) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) {
          // If found in cache, return it
          return cachedResponse;
        }
        
        // Otherwise fetch from network and cache
        return fetch(event.request).then(response => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE).then(cache => {
            cache.put(event.request, responseClone);
          });
          
          return response;
        });
      })
    );
    return;
  }

  // Stale-while-revalidate strategy for other requests
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      const fetchPromise = fetch(event.request)
        .then(networkResponse => {
          // Check if the resource is worth caching
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(DYNAMIC_CACHE).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          console.log('Service Worker: Fetch failed; returning offline fallback');
          // You could return a default offline page here
          // return caches.match('/offline.html');
        });
      
      // Return the cached response if we have it, otherwise wait for the network response
      return cachedResponse || fetchPromise;
    })
  );
});

// Handle offline sync
self.addEventListener('sync', event => {
  if (event.tag === 'sync-decks') {
    event.waitUntil(syncDecks());
  }
});

// Sync decks with the server when connection is restored
async function syncDecks() {
  try {
    // Get pending deck changes from IndexedDB or localStorage
    const pendingChanges = await getPendingChanges();
    if (!pendingChanges || pendingChanges.length === 0) return;
    
    const baseUrl = getBaseUrl();
    
    // Process each pending change
    for (const change of pendingChanges) {
      await fetch(`${baseUrl}/api/deck`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(change),
      });
    }
    
    // Clear pending changes after successful sync
    await clearPendingChanges();
    
    // Notify all clients about the successful sync
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETED',
        message: 'Your changes have been synchronized with the server.',
      });
    });
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

// Helper function to get pending changes (from IndexedDB or localStorage)
async function getPendingChanges() {
  // In a real implementation, you'd use IndexedDB
  // This is a simplified version using localStorage
  return JSON.parse(localStorage.getItem('pendingDeckChanges') || '[]');
}

// Helper function to clear pending changes
async function clearPendingChanges() {
  localStorage.removeItem('pendingDeckChanges');
}

// Listen for messages from the client
self.addEventListener('message', event => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});