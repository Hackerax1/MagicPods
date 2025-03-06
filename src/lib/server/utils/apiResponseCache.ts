// Simple in-memory cache for API responses
type CacheEntry = {
  data: any;
  expiry: number;
};

const cache = new Map<string, CacheEntry>();

/**
 * Cache API response data with TTL (Time To Live)
 * @param key Cache key
 * @param data Data to cache
 * @param ttlSeconds Time to live in seconds (default: 5 minutes)
 */
export function cacheResponse(key: string, data: any, ttlSeconds: number = 300): void {
  // Don't cache null or undefined data
  if (data === null || data === undefined) {
    return;
  }
  
  const entry: CacheEntry = {
    data,
    expiry: Date.now() + (ttlSeconds * 1000)
  };
  
  cache.set(key, entry);
}

/**
 * Get cached response if available and not expired
 * @param key Cache key
 * @returns Cached data or undefined if not found or expired
 */
export function getCachedResponse(key: string): any {
  const entry = cache.get(key);
  
  // Return undefined if nothing cached or entry expired
  if (!entry || Date.now() > entry.expiry) {
    if (entry) {
      // Clean up expired entry
      cache.delete(key);
    }
    return undefined;
  }
  
  return entry.data;
}

/**
 * Invalidate cached response
 * @param key Cache key to invalidate (if not provided, clears all cache)
 */
export function invalidateCache(key?: string): void {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
}

/**
 * Gets the current cache size
 * @returns Number of entries in the cache
 */
export function getCacheSize(): number {
  return cache.size;
}