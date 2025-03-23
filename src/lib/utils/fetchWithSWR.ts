// filepath: c:\Users\jackd\Documents\Projects\MTGSvelte3\src\lib\utils\fetchWithSWR.ts
import { useSWR, type SWRConfig } from './swr';
import { getAuthToken } from './api';

/**
 * Enhances the fetch API with stale-while-revalidate caching
 * @param url API endpoint URL
 * @param options Fetch options
 * @param swrConfig Additional SWR configuration options
 */
export function fetchWithSWR<T = any>(
  url: string,
  options?: RequestInit,
  swrConfig?: Partial<SWRConfig>
) {
  return useSWR<T>(url, options, swrConfig);
}

/**
 * Enhances the fetch API with stale-while-revalidate caching and authentication
 * @param url API endpoint URL
 * @param options Fetch options
 * @param swrConfig Additional SWR configuration options
 */
export async function fetchWithSWRAuth<T = any>(
  url: string,
  options?: RequestInit,
  swrConfig?: Partial<SWRConfig>
) {
  const token = await getAuthToken();
  const authOptions: RequestInit = {
    ...options,
    headers: {
      ...options?.headers,
      'Authorization': `Bearer ${token}`,
    }
  };
  
  return useSWR<T>(url, authOptions, swrConfig);
}

/**
 * Configures TTL settings based on resource type
 */
export function getTTLConfig(resourceType: 'cards' | 'decks' | 'pods' | 'collection' | 'trades' | 'default'): Partial<SWRConfig> {
  switch (resourceType) {
    case 'cards':
      return {
        staleTime: 60 * 60 * 1000, // 1 hour
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      };
    case 'decks':
      return {
        staleTime: 5 * 60 * 1000, // 5 minutes
        maxAge: 24 * 60 * 60 * 1000 // 1 day
      };
    case 'pods':
      return {
        staleTime: 5 * 60 * 1000, // 5 minutes
        maxAge: 24 * 60 * 60 * 1000 // 1 day
      };
    case 'collection':
      return {
        staleTime: 15 * 60 * 1000, // 15 minutes
        maxAge: 3 * 24 * 60 * 60 * 1000 // 3 days
      };
    case 'trades':
      return {
        staleTime: 30 * 1000, // 30 seconds - trades need frequent updates
        maxAge: 15 * 60 * 1000 // 15 minutes
      };
    case 'default':
    default:
      return {
        staleTime: 5 * 60 * 1000, // 5 minutes
        maxAge: 24 * 60 * 60 * 1000 // 1 day
      };
  }
}