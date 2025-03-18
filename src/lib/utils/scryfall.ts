import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { cacheResponse, getCachedResponse } from '$lib/server/utils/apiResponseCache';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SCRYFALL_BULK_DATA_URL = 'https://api.scryfall.com/bulk-data';
const DATA_DIR = path.resolve(__dirname, '../../data');

async function updateBulkData() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const bulkData = await fetchBulkData();
  const promises = bulkData.map(async (item) => {
    const filename = `${item.type}.json`;
    const filePath = path.join(DATA_DIR, filename);
    
    // Check if file exists and is less than 24 hours old
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      if (Date.now() - stats.mtimeMs < CACHE_TTL) {
        return;
      }
    }

    // Download and save new data
    await downloadAndSaveFile(item.download_uri, filename);
    console.log(`Updated ${filename}`);
  });

  await Promise.all(promises);
}

async function fetchBulkData() {
  const cacheKey = 'scryfall_bulk_data';
  const cached = await getCachedResponse(cacheKey);
  if (cached) return cached;

  const response = await fetch(SCRYFALL_BULK_DATA_URL);
  if (!response.ok) {
    throw new Error('Failed to fetch bulk data from Scryfall');
  }
  const data = await response.json();
  
  await cacheResponse(cacheKey, data.data, 'CARDS');
  return data.data;
}

async function downloadAndSaveFile(url: string, filename: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download file from ${url}`);
  }
  const fileStream = fs.createWriteStream(path.join(DATA_DIR, filename));
  await new Promise<void>((resolve, reject) => {
    response.body.pipe(fileStream);
    response.body.on('error', reject);
    fileStream.on('finish', resolve);
  });
}

// Schedule bulk data updates
let updateInterval: NodeJS.Timeout;

export function startBulkDataUpdates(intervalHours = 24) {
  if (updateInterval) {
    clearInterval(updateInterval);
  }
  
  // Initial update
  updateBulkData().catch(console.error);
  
  // Schedule periodic updates
  updateInterval = setInterval(() => {
    updateBulkData().catch(console.error);
  }, intervalHours * 60 * 60 * 1000);
}

export function stopBulkDataUpdates() {
  if (updateInterval) {
    clearInterval(updateInterval);
  }
}

// Start bulk data updates when module is loaded
startBulkDataUpdates();

// Clean up on module unload
process.on('beforeExit', () => {
  stopBulkDataUpdates();
});

// Client-side implementation
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

// Helper function to clear cache if needed
export function clearCardCache() {
    cardCache.clear();
}
