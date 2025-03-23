// filepath: c:\Users\jackd\Documents\Projects\MTGSvelte3\src\lib\utils\swr.ts
import { browser } from '$app/environment';
import { writable, type Writable } from 'svelte/store';
import { getItem, updateItem } from './indexedDB';

// Types for the stale-while-revalidate pattern
export type SWRConfig = {
  // Time (in ms) after which cache is considered stale and should be revalidated
  staleTime: number;
  // Time (in ms) after which cache is considered expired and must be refetched
  maxAge: number;
  // Custom error handler
  onError?: (error: Error) => void;
  // Whether to deduplicate requests within a certain time window
  dedupingInterval?: number;
  // Whether to revalidate on window focus
  revalidateOnFocus?: boolean;
};

type CacheEntry<T> = {
  cacheKey: string;
  data: T;
  error?: Error;
  timestamp: number;
  expiresAt: number;
  isValidating?: boolean;
};

// Default configuration
const DEFAULT_CONFIG: SWRConfig = {
  staleTime: 5 * 60 * 1000, // 5 minutes
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  dedupingInterval: 2000, // 2 seconds
  revalidateOnFocus: true
};

// In-memory request tracking to prevent duplicate in-flight requests
const inflightRequests = new Map<string, Promise<any>>();

// Store to track currently validating keys
const validatingKeys = new Set<string>();

// Create an event-based notification system for cache updates
const eventBus = browser 
  ? new EventTarget() 
  : { 
      addEventListener: () => {}, 
      removeEventListener: () => {}, 
      dispatchEvent: () => false 
    };

/**
 * Generates a stable cache key from URL and params
 */
function generateCacheKey(url: string, params?: Record<string, any>): string {
  if (!params || Object.keys(params).length === 0) {
    return url;
  }
  
  // Sort params by key to ensure consistent cache keys
  const sortedParams = Object.entries(params)
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .map(([key, value]) => `${key}=${encodeURIComponent(typeof value === 'object' ? JSON.stringify(value) : String(value))}`)
    .join('&');
  
  return `${url}?${sortedParams}`;
}

/**
 * Create a store that implements the stale-while-revalidate pattern
 */
export function useSWR<T = any>(
  url: string,
  fetchOptions?: RequestInit,
  config: Partial<SWRConfig> = {}
): {
  data: Writable<T | undefined>;
  error: Writable<Error | undefined>;
  isValidating: Writable<boolean>;
  mutate: (data?: T) => Promise<void>;
} {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const data: Writable<T | undefined> = writable(undefined);
  const error: Writable<Error | undefined> = writable(undefined);
  const isValidating: Writable<boolean> = writable(false);
  
  // Don't run in SSR
  if (!browser) {
    return { data, error, isValidating, mutate: async () => {} };
  }
  
  const cacheKey = generateCacheKey(url, fetchOptions?.body ? JSON.parse(fetchOptions.body as string) : undefined);
  
  // Listen for cache updates
  const updateListener = (event: Event) => {
    const customEvent = event as CustomEvent<{ key: string; data: T; error?: Error }>;
    if (customEvent.detail.key === cacheKey) {
      data.set(customEvent.detail.data);
      error.set(customEvent.detail.error);
    }
  };
  
  eventBus.addEventListener('cache-update', updateListener);
  
  // Function to load data from cache
  async function loadFromCache(): Promise<CacheEntry<T> | undefined> {
    try {
      return await getItem<CacheEntry<T>>('api_cache', cacheKey);
    } catch (err) {
      console.warn('Failed to load from cache:', err);
      return undefined;
    }
  }
  
  // Function to save data to cache
  async function saveToCache(entry: CacheEntry<T>): Promise<void> {
    try {
      await updateItem('api_cache', entry);
      
      // Notify other instances of the same useSWR hook
      const event = new CustomEvent('cache-update', { 
        detail: { 
          key: cacheKey, 
          data: entry.data, 
          error: entry.error 
        } 
      });
      eventBus.dispatchEvent(event);
    } catch (err) {
      console.warn('Failed to save to cache:', err);
    }
  }
  
  // Fetch fresh data
  async function fetchData(): Promise<T> {
    // Mark as validating
    isValidating.set(true);
    validatingKeys.add(cacheKey);
    
    try {
      // Check for existing request in flight
      if (inflightRequests.has(cacheKey)) {
        return await inflightRequests.get(cacheKey);
      }
      
      // Create new request
      const fetchPromise = fetch(url, fetchOptions)
        .then(async response => {
          if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
          }
          return await response.json();
        })
        .finally(() => {
          // Remove from in-flight requests after dedupingInterval
          setTimeout(() => {
            inflightRequests.delete(cacheKey);
          }, mergedConfig.dedupingInterval);
          
          // Mark as no longer validating
          isValidating.set(false);
          validatingKeys.delete(cacheKey);
        });
      
      // Store the request promise to deduplicate
      inflightRequests.set(cacheKey, fetchPromise);
      
      // Wait for the result
      const result = await fetchPromise;
      
      // Update cache with fresh data
      const now = Date.now();
      await saveToCache({
        cacheKey,
        data: result,
        timestamp: now,
        expiresAt: now + mergedConfig.maxAge
      });
      
      return result;
    } catch (e) {
      const fetchError = e instanceof Error ? e : new Error(String(e));
      
      // Call error handler if provided
      if (mergedConfig.onError) {
        mergedConfig.onError(fetchError);
      }
      
      error.set(fetchError);
      
      // Try to load existing data from cache despite the error
      const cachedData = await loadFromCache();
      if (cachedData) {
        // Still update the error in cache
        await saveToCache({
          ...cachedData,
          error: fetchError
        });
        
        return cachedData.data;
      }
      
      throw fetchError;
    }
  }
  
  // Main logic to implement stale-while-revalidate
  async function initSWR() {
    try {
      // Try to load data from cache first
      const cachedData = await loadFromCache();
      
      if (cachedData) {
        // Return stale data immediately
        data.set(cachedData.data);
        
        // Check if there's a previous error
        if (cachedData.error) {
          error.set(cachedData.error);
        }
        
        const now = Date.now();
        const isExpired = now > cachedData.expiresAt;
        const isStale = now > (cachedData.timestamp + mergedConfig.staleTime);
        
        // If the data is expired, we must revalidate
        // If the data is stale but not expired, we revalidate in the background
        if (isExpired || isStale) {
          // Don't await if just stale (background revalidation)
          const fetchPromise = fetchData();
          
          if (isExpired) {
            // If expired, we need the fresh data before continuing
            const freshData = await fetchPromise;
            data.set(freshData);
          } else {
            // For stale data, just update in the background
            fetchPromise
              .then(freshData => data.set(freshData))
              .catch(err => console.error('Background revalidation failed:', err));
          }
        }
      } else {
        // No cached data, fetch it synchronously
        const freshData = await fetchData();
        data.set(freshData);
      }
    } catch (err) {
      // If all fetching fails, set the error state
      const fetchError = err instanceof Error ? err : new Error(String(err));
      error.set(fetchError);
      
      if (mergedConfig.onError) {
        mergedConfig.onError(fetchError);
      }
    }
  }
  
  // Set up focus revalidation if enabled
  if (browser && mergedConfig.revalidateOnFocus) {
    const handleFocus = () => {
      // Only revalidate if not already validating this resource
      if (!validatingKeys.has(cacheKey)) {
        fetchData()
          .then(freshData => data.set(freshData))
          .catch(err => console.error('Focus revalidation failed:', err));
      }
    };
    
    window.addEventListener('focus', handleFocus);
    
    // Return cleanup function to be called when component unmounts
    return {
      data,
      error,
      isValidating,
      mutate: async (newData?: T) => {
        if (newData) {
          data.set(newData);
          
          // Update cache
          const now = Date.now();
          await saveToCache({
            cacheKey,
            data: newData,
            timestamp: now,
            expiresAt: now + mergedConfig.maxAge
          });
        } else {
          // Refetch data
          try {
            const freshData = await fetchData();
            data.set(freshData);
          } catch (err) {
            console.error('Mutation refetch failed:', err);
          }
        }
      }
    };
  }
  
  // Start the SWR process
  initSWR();
  
  return {
    data,
    error,
    isValidating,
    mutate: async (newData?: T) => {
      if (newData) {
        data.set(newData);
        
        // Update cache
        const now = Date.now();
        await saveToCache({
          cacheKey,
          data: newData,
          timestamp: now,
          expiresAt: now + mergedConfig.maxAge
        });
      } else {
        // Refetch data
        try {
          const freshData = await fetchData();
          data.set(freshData);
        } catch (err) {
          console.error('Mutation refetch failed:', err);
        }
      }
    }
  };
}

// Clean the API cache periodically (every hour)
if (browser) {
  import('./indexedDB').then(({ cleanExpiredCache }) => {
    // Initial cleanup
    cleanExpiredCache();
    
    // Set up periodic cleanup
    setInterval(cleanExpiredCache, 60 * 60 * 1000);
  });
}