import { browser } from '$app/environment';
import { writable, derived, type Readable } from 'svelte/store';

// Types
export interface PendingChange {
  id: string;
  type: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
}

// Stores
export const isOnline = writable(browser ? navigator.onLine : true);
export const isSyncPending = writable(false);
export const offlineChanges = writable<PendingChange[]>([]);

// Derived store that combines online status with sync status
export const offlineStatus: Readable<'online' | 'offline-with-changes' | 'offline'> = derived(
  [isOnline, offlineChanges],
  ([$isOnline, $offlineChanges]) => {
    if ($isOnline) return 'online';
    if ($offlineChanges.length > 0) return 'offline-with-changes';
    return 'offline';
  }
);

// Initialization
export function initOfflineSupport() {
  if (!browser) return;

  // Set up online/offline event listeners
  window.addEventListener('online', () => {
    isOnline.set(true);
    syncOfflineChanges();
  });
  window.addEventListener('offline', () => isOnline.set(false));

  // Load any stored offline changes from local storage
  loadStoredChanges();

  // Register the service worker
  registerServiceWorker();

  // Set up service worker message listeners
  setupServiceWorkerListeners();
}

// Register the service worker for offline support
async function registerServiceWorker() {
  if (!browser || !('serviceWorker' in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js');
    console.log('Service worker registered:', registration);

    // Set up a background sync when available
    if ('sync' in registration) {
      // Wait for service worker to be active
      await navigator.serviceWorker.ready;

      // Register a sync handler
      registration.sync.register('sync-decks').catch(err => {
        console.error('Background sync registration failed:', err);
      });
    }
  } catch (error) {
    console.error('Service worker registration failed:', error);
  }
}

// Set up listeners for service worker messages
function setupServiceWorkerListeners() {
  if (!browser || !('serviceWorker' in navigator)) return;

  navigator.serviceWorker.addEventListener('message', event => {
    if (event.data && event.data.type === 'SYNC_COMPLETED') {
      // Clear the pending changes marker when sync completes
      isSyncPending.set(false);
      offlineChanges.set([]);
      
      // Show a notification to the user
      showNotification('Changes synchronized with server');
    }
  });
}

// Queue a change for offline use
export function queueOfflineChange(type: 'create' | 'update' | 'delete', data: any) {
  if (!browser) return;

  const change: PendingChange = {
    id: crypto.randomUUID(),
    type,
    data,
    timestamp: Date.now()
  };

  // Update the store
  offlineChanges.update(changes => {
    const newChanges = [...changes, change];
    
    // Store in localStorage
    if (browser) {
      localStorage.setItem('pendingDeckChanges', JSON.stringify(newChanges));
    }
    
    return newChanges;
  });

  // If we're online, try to sync immediately
  if (browser && navigator.onLine) {
    syncOfflineChanges();
  }
}

// Load stored changes from localStorage
function loadStoredChanges() {
  if (!browser) return;
  
  const storedChanges = localStorage.getItem('pendingDeckChanges');
  if (storedChanges) {
    try {
      const changes = JSON.parse(storedChanges);
      offlineChanges.set(changes);

      if (changes.length > 0) {
        isSyncPending.set(true);
      }
    } catch (e) {
      console.error('Failed to parse stored changes:', e);
      localStorage.removeItem('pendingDeckChanges');
    }
  }
}

// Try to sync offline changes when back online
export async function syncOfflineChanges() {
  if (!browser || !navigator.onLine) return;

  let changes: PendingChange[] = [];
  offlineChanges.subscribe(value => {
    changes = value;
  })();

  if (changes.length === 0) return;

  isSyncPending.set(true);

  // If background sync is available, let the service worker handle it
  if ('serviceWorker' in navigator && 'sync' in navigator.serviceWorker) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register('sync-decks');
    } catch (err) {
      console.error('Background sync failed, falling back to manual sync:', err);
      manualSync(changes);
    }
  } else {
    // Otherwise handle it manually
    manualSync(changes);
  }
}

// Manual sync when background sync not available
async function manualSync(changes: PendingChange[]) {
  try {
    for (const change of changes) {
      const endpoint = getEndpointForChange(change);
      const method = getMethodForChange(change);

      await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(change.data)
      });
    }

    // Clear changes after successful sync
    offlineChanges.set([]);
    localStorage.removeItem('pendingDeckChanges');
    isSyncPending.set(false);
    
    showNotification('Changes synchronized with server');
  } catch (error) {
    console.error('Manual sync failed:', error);
    
    // Keep changes and try again later
    isSyncPending.set(false);
    showNotification('Sync failed. Will retry when connection improves', 'error');
  }
}

// Get the appropriate endpoint based on change type
function getEndpointForChange(change: PendingChange): string {
  switch (change.type) {
    case 'create':
      return '/api/deck';
    case 'update':
      return `/api/deck/${change.data.id}`;
    case 'delete':
      return `/api/deck/${change.data.id}`;
    default:
      return '/api/deck';
  }
}

// Get the appropriate HTTP method based on change type
function getMethodForChange(change: PendingChange): string {
  switch (change.type) {
    case 'create':
      return 'POST';
    case 'update':
      return 'PUT';
    case 'delete':
      return 'DELETE';
    default:
      return 'POST';
  }
}

// Show a notification to the user
function showNotification(message: string, type: 'success' | 'error' = 'success') {
  // This could dispatch a custom event or use a notification system
  // For now we'll just log it
  console.log(`[${type.toUpperCase()}] ${message}`);
  
  // Dispatch a custom event for components to listen to
  if (browser) {
    window.dispatchEvent(
      new CustomEvent('app:notification', { 
        detail: { message, type } 
      })
    );
  }
}