const SCRYFALL_SEARCH_URL = 'https://api.scryfall.com/cards/search';

// LRU Cache implementation
class LRUCache<K, V> {
    private cache = new Map<K, V>();
    private readonly maxSize: number;

    constructor(maxSize: number) {
        this.maxSize = maxSize;
    }

    get(key: K): V | undefined {
        const item = this.cache.get(key);
        if (item) {
            this.cache.delete(key);
            this.cache.set(key, item);
        }
        return item;
    }

    set(key: K, value: V): void {
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        this.cache.set(key, value);
    }

    clear(): void {
        this.cache.clear();
    }
}

// Initialize LRU cache with max 1000 items
const cardCache = new LRUCache<string, { data: any; timestamp: number }>(1000);
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours cache time

export async function fetchCard(cardName: string) {
    // Normalize card name to use as cache key
    const cacheKey = `card_${cardName.toLowerCase().trim()}`;
    
    // Check memory cache first
    const cached = cardCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
    }
    
    // Make API call if no cache hit
    const response = await fetch(`${SCRYFALL_SEARCH_URL}?q=${encodeURIComponent(cardName)}`, {
        headers: { 'Accept-Encoding': 'gzip' }
    });
    
    if (!response.ok) {
        throw new Error('Failed to fetch card data from Scryfall');
    }
    
    const data = await response.json();
    if (data.object === 'error') {
        throw new Error(data.details);
    }
    
    const cardData = data.data[0];
    
    // Save in memory cache
    cardCache.set(cacheKey, { data: cardData, timestamp: Date.now() });
    
    return cardData;
}

export function clearCardCache() {
    cardCache.clear();
}