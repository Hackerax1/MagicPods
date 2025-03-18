import { getAuthToken } from './api';

// Configuration
const CARD_SCANNER_BASE_URL = import.meta.env.VITE_CARD_SCANNER_URL || 'http://localhost:5000';
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;
const MAX_RETRY_DELAY = 10000;

/**
 * Error class for card scanner errors
 */
export class CardScannerError extends Error {
  status?: number;
  errorId?: string;
  
  constructor(message: string, status?: number, errorId?: string) {
    super(message);
    this.name = 'CardScannerError';
    this.status = status;
    this.errorId = errorId;
  }
}

/**
 * Calculate backoff delay using exponential backoff strategy
 */
function calculateBackoffDelay(retryCount: number): number {
  const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
  return Math.min(delay, MAX_RETRY_DELAY);
}

/**
 * Make an API request to the card scanner service with retry logic
 */
async function fetchWithRetry(
  url: string, 
  options: RequestInit, 
  retries = MAX_RETRIES
): Promise<Response> {
  try {
    const response = await fetch(url, options);
    
    // Don't retry for client errors (except 429 - too many requests)
    if (!response.ok && response.status !== 429 && response.status < 500 && retries === MAX_RETRIES) {
      const errorBody = await response.json().catch(() => ({}));
      throw new CardScannerError(
        errorBody.error || `HTTP error ${response.status}`,
        response.status,
        errorBody.error_id
      );
    }
    
    if (!response.ok && retries > 0) {
      // For 429 responses, use the Retry-After header if available
      let delayMs = calculateBackoffDelay(MAX_RETRIES - retries);
      
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        if (retryAfter) {
          delayMs = parseInt(retryAfter, 10) * 1000;
        }
      }
      
      console.log(`Retrying in ${delayMs}ms... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      return fetchWithRetry(url, options, retries - 1);
    }
    
    return response;
  } catch (error) {
    if (error instanceof CardScannerError || retries <= 0) {
      throw error;
    }
    
    const delayMs = calculateBackoffDelay(MAX_RETRIES - retries);
    console.log(`Network error, retrying in ${delayMs}ms... (${retries} attempts left)`);
    await new Promise(resolve => setTimeout(resolve, delayMs));
    return fetchWithRetry(url, options, retries - 1);
  }
}

/**
 * Get authentication headers for requests
 */
async function getAuthHeaders(): Promise<HeadersInit> {
  const token = await getAuthToken();
  if (!token) {
    throw new CardScannerError('Authentication required');
  }
  
  return {
    'Authorization': `Bearer ${token}`
  };
}

/**
 * Scan a card image and return the recognized text
 */
export async function scanCardImage(imageFile: File): Promise<{ text: string; userId: string }> {
  const formData = new FormData();
  formData.append('image', imageFile);
  
  const headers = await getAuthHeaders();
  
  const response = await fetchWithRetry(`${CARD_SCANNER_BASE_URL}/scan`, {
    method: 'POST',
    headers,
    body: formData
  });
  
  return await response.json();
}

/**
 * Start a live scanning session
 */
export async function startLiveScanning(): Promise<{ message: string; userId: string }> {
  const headers = {
    ...(await getAuthHeaders()),
    'Content-Type': 'application/json'
  };
  
  const response = await fetchWithRetry(`${CARD_SCANNER_BASE_URL}/scan/live/start`, {
    method: 'POST',
    headers
  });
  
  return await response.json();
}

/**
 * Get the current frame and scan result from an active scanning session
 */
export async function getLiveFrame(): Promise<{ frame: string; result: string | null } | null> {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetchWithRetry(`${CARD_SCANNER_BASE_URL}/scan/live/frame`, {
      headers
    });
    
    if (response.status === 404) {
      return null;
    }
    
    return await response.json();
  } catch (error) {
    // Handle 404 errors specially, as they're expected
    if (error instanceof CardScannerError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Stop an active live scanning session
 */
export async function stopLiveScanning(): Promise<void> {
  try {
    const headers = {
      ...(await getAuthHeaders()),
      'Content-Type': 'application/json'
    };
    
    await fetchWithRetry(`${CARD_SCANNER_BASE_URL}/scan/live/stop`, {
      method: 'POST',
      headers
    });
  } catch (error) {
    console.error('Error stopping live scanning:', error);
  }
}

/**
 * Check if the card scanner service is healthy
 */
export async function checkServiceHealth(): Promise<{
  status: 'healthy' | 'warning' | 'critical';
  timestamp: number;
  active_sessions: number;
  tessdata_available: boolean;
  system: any;
  version: string;
}> {
  const response = await fetchWithRetry(`${CARD_SCANNER_BASE_URL}/health`, {
    method: 'GET'
  });
  
  return await response.json();
}