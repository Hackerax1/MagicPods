import type { RequestEvent } from '@sveltejs/kit';
import { errorResponse } from './apiResponse';

export type ApiVersion = 'v1' | 'v2';

interface ApiVersionConfig {
  current: ApiVersion;
  supported: ApiVersion[];
  default: ApiVersion;
}

// Configuration for API versions
export const apiVersionConfig: ApiVersionConfig = {
  current: 'v1',
  supported: ['v1'],
  default: 'v1'
};

/**
 * Gets the API version from the request
 * Checks in order: URL path, Accept header, default
 */
export function getApiVersion(event: RequestEvent): ApiVersion {
  // Check URL first (e.g., /api/v1/users)
  const url = new URL(event.request.url);
  const pathSegments = url.pathname.split('/');
  const versionSegment = pathSegments.find(segment => /^v\d+$/.test(segment));
  
  if (versionSegment && apiVersionConfig.supported.includes(versionSegment as ApiVersion)) {
    return versionSegment as ApiVersion;
  }

  // Then check Accept header (e.g., Accept: application/vnd.mtgsvelte.v1+json)
  const acceptHeader = event.request.headers.get('Accept');
  if (acceptHeader) {
    const versionMatch = acceptHeader.match(/application\/vnd\.mtgsvelte\.(v\d+)\+json/);
    if (versionMatch && apiVersionConfig.supported.includes(versionMatch[1] as ApiVersion)) {
      return versionMatch[1] as ApiVersion;
    }
  }

  // Default to the configured default version
  return apiVersionConfig.default;
}

/**
 * Middleware to validate API version
 */
export async function validateApiVersion(event: RequestEvent) {
  const version = getApiVersion(event);
  
  if (!apiVersionConfig.supported.includes(version)) {
    return {
      error: errorResponse(`API version ${version} is not supported. Supported versions are: ${apiVersionConfig.supported.join(', ')}`, 400),
      version: null
    };
  }
  
  return {
    error: null,
    version
  };
}

/**
 * Add version information to response headers
 */
export function addVersionHeaders(response: Response, version: ApiVersion): Response {
  response.headers.append('X-API-Version', version);
  response.headers.append('X-API-Deprecated', version !== apiVersionConfig.current ? 'true' : 'false');
  
  return response;
}