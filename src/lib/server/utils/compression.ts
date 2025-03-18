import type { RequestEvent } from '@sveltejs/kit';
import { compressSync, decompressSync } from 'fflate';
import { Buffer } from 'buffer';

/**
 * Compresses a response based on the Accept-Encoding header
 */
export async function compressResponse(response: Response, event: RequestEvent): Promise<Response> {
  // Check if the client accepts compression
  const acceptEncoding = event.request.headers.get('Accept-Encoding') || '';
  
  // Only compress if content is compressible and not already compressed
  const contentType = response.headers.get('Content-Type') || '';
  const isCompressible = /text|json|javascript|xml|svg|css|font/.test(contentType);
  const isAlreadyCompressed = /gzip|deflate|br/.test(response.headers.get('Content-Encoding') || '');
  
  if (!isCompressible || isAlreadyCompressed) {
    return response;
  }

  // Get response body as ArrayBuffer
  const originalBody = await response.arrayBuffer();
  let compressedBody: Uint8Array | null = null;
  let encoding: string | null = null;

  // Try to compress with the best available method
  if (acceptEncoding.includes('gzip')) {
    compressedBody = compressSync(new Uint8Array(originalBody), { level: 6 });
    encoding = 'gzip';
  }

  // If compression didn't work or save space, return the original
  if (!compressedBody || compressedBody.length >= originalBody.byteLength) {
    return response;
  }

  // Create a new response with compressed body
  const headers = new Headers(response.headers);
  headers.set('Content-Encoding', encoding!);
  headers.set('Content-Length', compressedBody.length.toString());
  headers.set('Vary', 'Accept-Encoding');

  return new Response(compressedBody, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

/**
 * Decompresses a request body if it's compressed
 */
export async function decompressRequest(event: RequestEvent): Promise<unknown> {
  const contentEncoding = event.request.headers.get('Content-Encoding');
  
  if (!contentEncoding) {
    // No compression, just parse the JSON normally
    return event.request.json();
  }
  
  // Get the compressed body
  const compressedBody = await event.request.arrayBuffer();
  let decompressedBody: Uint8Array;
  
  // Decompress based on encoding
  if (contentEncoding.includes('gzip')) {
    decompressedBody = decompressSync(new Uint8Array(compressedBody));
  } else {
    // Unsupported encoding, return original request
    return event.request.json();
  }
  
  // Parse the decompressed JSON
  try {
    const jsonText = Buffer.from(decompressedBody).toString('utf-8');
    return JSON.parse(jsonText);
  } catch (error) {
    throw new Error('Failed to parse decompressed request body as JSON');
  }
}