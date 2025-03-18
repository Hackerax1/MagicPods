import { browser } from '$app/environment';
import { getItem, addItem, updateItem } from './indexedDB';

// Constants
const SCRYFALL_SEARCH_URL = 'https://api.scryfall.com/cards/search';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// In-memory cache for fastest access during session
const memoryCache = new Map<string, { data: any; timestamp: number }>();

/**
 * Fetch a card from Scryfall with tiered caching:
 * 1. Check memory cache first (fastest)
 * 2. Check IndexedDB if not in memory (persistence)
 * 3. Fetch from API if not cached or expired
 */
export async function fetchCard(cardName: string) {
    const cacheKey = `card_${cardName.toLowerCase().trim()}`;
    
    // Step 1: Check memory cache first (fastest)
    const cachedInMemory = memoryCache.get(cacheKey);
    if (cachedInMemory && Date.now() - cachedInMemory.timestamp < CACHE_TTL) {
        return cachedInMemory.data;
    }
    
    // Step 2: Check IndexedDB if browser environment
    if (browser) {
        try {
            const cachedInDB = await getItem<{data: any; timestamp: number}>('cards', cacheKey);
            
            if (cachedInDB && Date.now() - cachedInDB.timestamp < CACHE_TTL) {
                // Add back to memory cache for faster subsequent access
                memoryCache.set(cacheKey, cachedInDB);
                return cachedInDB.data;
            }
        } catch (err) {
            console.warn('IndexedDB read failed, falling back to API:', err);
        }
    }
    
    // Step 3: Make API call if no cache hit or cache expired
    const response = await fetch(`${SCRYFALL_SEARCH_URL}?q=${encodeURIComponent(cardName)}`, {
        headers: { 'Accept-Encoding': 'gzip' }
    });
    
    if (!response.ok) {
        throw new Error(`Failed to fetch card data from Scryfall: ${response.status}`);
    }
    
    const data = await response.json();
    if (data.object === 'error') {
        throw new Error(data.details);
    }
    
    const cardData = data.data[0];
    const cacheEntry = { data: cardData, timestamp: Date.now() };
    
    // Save in memory cache
    memoryCache.set(cacheKey, cacheEntry);
    
    // Save in IndexedDB if available
    if (browser) {
        try {
            await updateItem('cards', {
                id: cacheKey,
                ...cacheEntry
            });
        } catch (err) {
            console.warn('Failed to cache card in IndexedDB:', err);
        }
    }
    
    return cardData;
}

/**
 * Clear card cache
 * @param type - Type of cache to clear: 'memory', 'persistent', or 'all'
 */
export function clearCardCache(type: 'memory' | 'persistent' | 'all' = 'all') {
    if (type === 'memory' || type === 'all') {
        memoryCache.clear();
    }
    
    if ((type === 'persistent' || type === 'all') && browser) {
        import('./indexedDB').then(idb => {
            idb.clearStore('cards').catch(err => {
                console.error('Failed to clear IndexedDB card cache:', err);
            });
        });
    }
}