import sharp from 'sharp';
import { error } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

// Cache for optimized images to avoid processing the same image multiple times
const imageCache = new Map<string, { buffer: Buffer, timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours cache time

export const GET = async ({ url }: RequestEvent) => {
  const imageUrl = url.searchParams.get('url');
  const width = parseInt(url.searchParams.get('width') || '0');
  const height = parseInt(url.searchParams.get('height') || '0');
  const format = url.searchParams.get('format') || 'webp';
  const quality = parseInt(url.searchParams.get('quality') || '80');
  
  if (!imageUrl) {
    throw error(400, 'Missing image URL');
  }
  
  // Create a cache key based on the request parameters
  const cacheKey = `${imageUrl}:${width}:${height}:${format}:${quality}`;
  
  // Check if we have this image in cache
  const cached = imageCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return new Response(cached.buffer, {
      headers: {
        'Content-Type': `image/${format}`,
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  }
  
  try {
    // Fetch the original image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw error(404, 'Image not found');
    }
    
    const buffer = await response.arrayBuffer();
    
    // Process with sharp
    let transformer = sharp(Buffer.from(buffer));
    
    if (width || height) {
      transformer = transformer.resize({
        width: width || undefined,
        height: height || undefined,
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      });
    }
    
    // Set format
    let outputBuffer: Buffer;
    
    if (format === 'webp') {
      outputBuffer = await transformer.webp({ quality }).toBuffer();
    } else if (format === 'avif') {
      outputBuffer = await transformer.avif({ quality }).toBuffer();
    } else if (format === 'png') {
      outputBuffer = await transformer.png({ quality }).toBuffer();
    } else {
      outputBuffer = await transformer.jpeg({ quality }).toBuffer();
    }
    
    // Store in cache
    imageCache.set(cacheKey, {
      buffer: outputBuffer,
      timestamp: Date.now()
    });
    
    return new Response(outputBuffer, {
      headers: {
        'Content-Type': `image/${format}`,
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  } catch (err) {
    console.error('Image optimization error:', err);
    throw error(500, 'Failed to optimize image');
  }
};

// Helper function to clear cache if needed
function clearImageCache() {
  imageCache.clear();
}
