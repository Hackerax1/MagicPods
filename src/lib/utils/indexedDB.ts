import { browser } from '$app/environment';

type IndexedDBStoreConfig = {
  name: string;
  keyPath: string;
  indices?: { name: string; keyPath: string; unique: boolean }[];
};

// Database configuration
const DB_NAME = 'mtgsvelte_db';
const DB_VERSION = 2; // Incrementing version to add new store
const STORES: IndexedDBStoreConfig[] = [
  {
    name: 'cards',
    keyPath: 'id',
    indices: [
      { name: 'name', keyPath: 'name', unique: false },
      { name: 'set', keyPath: 'set', unique: false }
    ]
  },
  {
    name: 'decks',
    keyPath: 'id',
    indices: [
      { name: 'name', keyPath: 'name', unique: false },
      { name: 'userId', keyPath: 'userId', unique: false }
    ]
  },
  {
    name: 'collections',
    keyPath: 'id'
  },
  // New store for API cache with stale-while-revalidate pattern
  {
    name: 'api_cache',
    keyPath: 'cacheKey',
    indices: [
      { name: 'timestamp', keyPath: 'timestamp', unique: false },
      { name: 'expiresAt', keyPath: 'expiresAt', unique: false }
    ]
  }
];

// Initialize database
let dbPromise: Promise<IDBDatabase> | null = null;

function initDB(): Promise<IDBDatabase> {
  if (!browser) {
    return Promise.reject(new Error('IndexedDB is only available in the browser'));
  }
  
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = (event) => {
        console.error('IndexedDB error:', request.error);
        reject(request.error);
      };
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onupgradeneeded = (event) => {
        const db = request.result;
        
        // Create object stores for each defined store
        STORES.forEach(store => {
          if (!db.objectStoreNames.contains(store.name)) {
            const objectStore = db.createObjectStore(store.name, { keyPath: store.keyPath });
            
            // Create indices if defined
            if (store.indices) {
              store.indices.forEach(index => {
                objectStore.createIndex(index.name, index.keyPath, { unique: index.unique });
              });
            }
          }
        });
      };
    });
  }
  
  return dbPromise;
}

// Generic CRUD operations
export async function addItem<T>(storeName: string, item: T): Promise<T> {
  const db = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.add(item);
    
    request.onsuccess = () => resolve(item);
    request.onerror = () => reject(request.error);
  });
}

export async function getItem<T>(storeName: string, key: string | number): Promise<T | undefined> {
  const db = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);
    
    request.onsuccess = () => resolve(request.result as T);
    request.onerror = () => reject(request.error);
  });
}

export async function updateItem<T>(storeName: string, item: T): Promise<T> {
  const db = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(item);
    
    request.onsuccess = () => resolve(item);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteItem(storeName: string, key: string | number): Promise<void> {
  const db = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getAllItems<T>(storeName: string): Promise<T[]> {
  const db = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = () => reject(request.error);
  });
}

export async function queryByIndex<T>(
  storeName: string, 
  indexName: string, 
  value: string | number
): Promise<T[]> {
  const db = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.getAll(value);
    
    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = () => reject(request.error);
  });
}

// Clear all data from a specific store
export async function clearStore(storeName: string): Promise<void> {
  const db = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Close database connection
export function closeDB(): void {
  if (dbPromise) {
    dbPromise.then(db => db.close());
    dbPromise = null;
  }
}

// Clean expired items from the API cache store
export async function cleanExpiredCache(): Promise<void> {
  if (!browser) return;
  
  try {
    const db = await initDB();
    const transaction = db.transaction('api_cache', 'readwrite');
    const store = transaction.objectStore('api_cache');
    const index = store.index('expiresAt');
    const now = Date.now();
    
    const request = index.openCursor(IDBKeyRange.upperBound(now));
    
    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        // Delete expired item
        cursor.delete();
        cursor.continue();
      }
    };
  } catch (error) {
    console.error('Error cleaning expired cache:', error);
  }
}