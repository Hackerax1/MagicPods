import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SCRYFALL_BULK_DATA_URL = 'https://api.scryfall.com/bulk-data';
const SCRYFALL_SEARCH_URL = 'https://api.scryfall.com/cards/search';
const DATA_DIR = path.resolve(__dirname, '../../data');

// Simple in-memory cache to reduce API calls to Scryfall
const cardCache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours cache time

async function fetchBulkData() {
  const response = await fetch(SCRYFALL_BULK_DATA_URL);
  if (!response.ok) {
    throw new Error('Failed to fetch bulk data from Scryfall');
  }
  const data = await response.json();
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
    fileStream.on('finish', () => resolve());
  });
}

async function updateBulkData() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const bulkData = await fetchBulkData();
  for (const item of bulkData) {
    const filename = `${item.type}.json`;
    await downloadAndSaveFile(item.download_uri, filename);
    console.log(`Downloaded and saved ${filename}`);
  }
}

export async function getBulkData(type: string) {
  const filePath = path.join(DATA_DIR, `${type}.json`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Bulk data file for type ${type} does not exist`);
  }
  const data = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(data);
}

export async function fetchCard(cardName: string) {
  // Normalize card name to use as cache key (lowercase, trim whitespace)
  const cacheKey = cardName.toLowerCase().trim();
  
  // Check cache first
  const cached = cardCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    // Return cached data if it's not expired
    return cached.data;
  }
  
  // Make API call if no cache hit or cache expired
  const response = await fetch(`${SCRYFALL_SEARCH_URL}?q=${encodeURIComponent(cardName)}`);
  if (!response.ok) {
    throw new Error('Failed to fetch card data from Scryfall');
  }
  const data = await response.json();
  if (data.object === 'error') {
    throw new Error(data.details);
  }
  
  // Save result in cache
  cardCache.set(cacheKey, {
    data: data.data[0],
    timestamp: Date.now()
  });
  
  return data.data[0]; // Return the first matching card
}

// Helper function to clear cache if needed
export function clearCardCache() {
  cardCache.clear();
}

// Run the update process (you can schedule this or run it manually)
// updateBulkData().catch(console.error);
