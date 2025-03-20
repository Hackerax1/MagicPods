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
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

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

async function updateBulkData() {
    try {
        // Ensure data directory exists
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }

        const bulkData = await fetchBulkData();
        
        for (const item of bulkData) {
            if (item.type === 'default_cards' || item.type === 'all_cards') {
                await downloadAndSaveFile(item.download_uri, `${item.type}.json`);
            }
        }
        
        console.log('Bulk data update completed successfully');
    } catch (error) {
        console.error('Error updating bulk data:', error);
    }
}

export function startBulkDataUpdates(intervalHours: number = 24) {
    // Run initial update
    updateBulkData();
    
    // Set up periodic updates
    const interval = intervalHours * 60 * 60 * 1000; // Convert hours to milliseconds
    setInterval(updateBulkData, interval);
}

export async function getBulkData(type: string) {
    const filePath = path.join(DATA_DIR, `${type}.json`);
    if (!fs.existsSync(filePath)) {
        throw new Error(`Bulk data file for type ${type} does not exist`);
    }
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
}