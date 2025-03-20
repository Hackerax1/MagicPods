// Simple in-memory cache for API responses
import { gzip, unzip } from 'node:zlib';
import { promisify } from 'node:util';

const gzipAsync = promisify(gzip);
const ungzipAsync = promisify(unzip);

type CacheEntry = {
  data: Buffer;  // Compressed data
  expiry: number;
  etag?: string;
};

const cache = new Map<string, CacheEntry>();

// TTL constants
const TTL = {
  CARDS: 24 * 60 * 60,    // 24 hours for card data
  PODS: 5 * 60,           // 5 minutes for pod data
  DECKS: 5 * 60,         // 5 minutes for deck data
  COLLECTIONS: 15 * 60,   // 15 minutes for collections
  DEFAULT: 5 * 60         // 5 minutes default
};

/**
 * Cache API response data with TTL (Time To Live)
 * @param key Cache key
 * @param data Data to cache
 * @param ttlSeconds Time to live in seconds
 * @param etag Optional ETag for cache validation
 */
export async function cacheResponse(
  key: string, 
  data: any, 
  category: keyof typeof TTL = 'DEFAULT',
  etag?: string
): Promise<void> {
  if (data === null || data === undefined) return;

  const compressed = await gzipAsync(Buffer.from(JSON.stringify(data)));
  const entry: CacheEntry = {
    data: compressed,
    expiry: Date.now() + (TTL[category] * 1000),
    etag
  };
  
  cache.set(key, entry);
}

/**
 * Get cached response if available and not expired
 * @param key Cache key
 * @param reqEtag Optional ETag from request for validation
 * @returns Cached data or undefined if not found/expired
 */
export async function getCachedResponse(key: string, reqEtag?: string): Promise<any> {
  const entry = cache.get(key);
  
  if (!entry || Date.now() > entry.expiry) {
    if (entry) cache.delete(key);
    return undefined;
  }

  // ETag validation if provided
  if (reqEtag && entry.etag && reqEtag !== entry.etag) {
    return undefined;
  }

  try {
    const decompressed = await ungzipAsync(entry.data);
    return JSON.parse(decompressed.toString());
  } catch (error) {
    console.error('Cache decompression error:', error);
    cache.delete(key);
    return undefined;
  }
}

/**
 * Invalidate cached response
 * @param key Cache key to invalidate (if not provided, clears all cache)
 * @param category Optional category to clear all related caches
 */
export function invalidateCache(key?: string, category?: keyof typeof TTL): void {
  if (key) {
    cache.delete(key);
  } else if (category) {
    // Clear all entries of a specific category
    for (const [k, entry] of cache.entries()) {
      if (k.startsWith(category.toLowerCase())) {
        cache.delete(k);
      }
    }
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

// Periodic cleanup of expired entries
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now > entry.expiry) {
      cache.delete(key);
    }
  }
}, 60000); // Run every minute