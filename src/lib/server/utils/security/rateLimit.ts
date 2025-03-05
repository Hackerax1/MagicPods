/**
 * Rate limiting utility to prevent abuse of API endpoints
 */

import { error } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

// Store to track request counts
// In a production environment, you'd want to use Redis or another shared storage
const ipRequests: Map<string, { count: number; resetTime: number }> = new Map();

// Default rate limit settings
const DEFAULT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const DEFAULT_MAX_REQUESTS = 100; // 100 requests per window

/**
 * Rate limiting middleware for SvelteKit endpoints
 * @param options Configuration options for rate limiting
 */
export function rateLimit(options: {
  windowMs?: number;
  maxRequests?: number;
  message?: string;
  statusCode?: number;
} = {}) {
  const windowMs = options.windowMs || DEFAULT_WINDOW_MS;
  const maxRequests = options.maxRequests || DEFAULT_MAX_REQUESTS;
  const message = options.message || 'Too many requests, please try again later.';
  const statusCode = options.statusCode || 429;

  return async function handleRateLimit(event: RequestEvent) {
    // Get client IP address
    const clientIp = event.getClientAddress();
    const now = Date.now();
    
    // Get or initialize request tracking for this IP
    let requestData = ipRequests.get(clientIp);
    if (!requestData || now > requestData.resetTime) {
      requestData = { count: 0, resetTime: now + windowMs };
      ipRequests.set(clientIp, requestData);
    }
    
    // Increment request count
    requestData.count++;
    
    // Check if rate limit exceeded
    if (requestData.count > maxRequests) {
      // Add rate limit headers
      event.setHeaders({
        'Retry-After': String(Math.ceil(requestData.resetTime - now) / 1000),
        'X-RateLimit-Limit': String(maxRequests),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Math.ceil(requestData.resetTime / 1000))
      });
      
      throw error(statusCode, message);
    }
    
    // Add rate limit headers
    event.setHeaders({
      'X-RateLimit-Limit': String(maxRequests),
      'X-RateLimit-Remaining': String(maxRequests - requestData.count),
      'X-RateLimit-Reset': String(Math.ceil(requestData.resetTime / 1000))
    });
  };
}

/**
 * More restrictive rate limiting for sensitive endpoints like authentication
 */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10, // 10 login attempts per 15 minutes
  message: 'Too many login attempts, please try again later.'
});

/**
 * Standard rate limiting for general API endpoints
 */
export const standardRateLimit = rateLimit();

/**
 * Cleanup function to periodically remove expired rate limit data
 * Should be called on a timer in a production environment
 */
export function cleanupRateLimitData() {
  const now = Date.now();
  for (const [ip, data] of ipRequests.entries()) {
    if (now > data.resetTime) {
      ipRequests.delete(ip);
    }
  }
}