import type { RequestEvent } from '@sveltejs/kit';
import { errorResponse } from './apiResponse';
import type { ApiVersion } from './apiVersion';

// Extended error class with status code
export class ApiError extends Error {
  statusCode: number;
  errorCode?: string;

  constructor(message: string, statusCode: number = 500, errorCode?: string) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
  }
}

// Standard error codes and messages
export const ErrorCodes = {
  // Authentication errors (401)
  UNAUTHORIZED: 'AUTH_001',
  INVALID_CREDENTIALS: 'AUTH_002',
  TOKEN_EXPIRED: 'AUTH_003',
  
  // Authorization errors (403)
  FORBIDDEN: 'AUTH_101',
  INSUFFICIENT_PERMISSIONS: 'AUTH_102',
  
  // Resource errors (404)
  NOT_FOUND: 'RES_001',
  
  // Input validation errors (400)
  INVALID_INPUT: 'VAL_001',
  MISSING_REQUIRED_FIELD: 'VAL_002',
  INVALID_FORMAT: 'VAL_003',
  
  // Server errors (500)
  INTERNAL_ERROR: 'SRV_001',
  DATABASE_ERROR: 'SRV_002',
  EXTERNAL_SERVICE_ERROR: 'SRV_003'
} as const;

// Mapping of error codes to HTTP status codes and default messages
interface ErrorMapping {
  statusCode: number;
  defaultMessage: string;
}

export const errorMappings: Record<string, ErrorMapping> = {
  // Authentication errors
  [ErrorCodes.UNAUTHORIZED]: { statusCode: 401, defaultMessage: 'Authentication required' },
  [ErrorCodes.INVALID_CREDENTIALS]: { statusCode: 401, defaultMessage: 'Invalid credentials' },
  [ErrorCodes.TOKEN_EXPIRED]: { statusCode: 401, defaultMessage: 'Authentication token expired' },
  
  // Authorization errors
  [ErrorCodes.FORBIDDEN]: { statusCode: 403, defaultMessage: 'Access forbidden' },
  [ErrorCodes.INSUFFICIENT_PERMISSIONS]: { statusCode: 403, defaultMessage: 'Insufficient permissions' },
  
  // Resource errors
  [ErrorCodes.NOT_FOUND]: { statusCode: 404, defaultMessage: 'Resource not found' },
  
  // Input validation errors
  [ErrorCodes.INVALID_INPUT]: { statusCode: 400, defaultMessage: 'Invalid input data' },
  [ErrorCodes.MISSING_REQUIRED_FIELD]: { statusCode: 400, defaultMessage: 'Missing required field' },
  [ErrorCodes.INVALID_FORMAT]: { statusCode: 400, defaultMessage: 'Invalid data format' },
  
  // Server errors
  [ErrorCodes.INTERNAL_ERROR]: { statusCode: 500, defaultMessage: 'Internal server error' },
  [ErrorCodes.DATABASE_ERROR]: { statusCode: 500, defaultMessage: 'Database error' },
  [ErrorCodes.EXTERNAL_SERVICE_ERROR]: { statusCode: 500, defaultMessage: 'External service error' }
};

/**
 * Central error handler
 * @param error The error to handle
 * @param event The request event
 * @param version API version
 */
export function handleApiError(error: unknown, event: RequestEvent, version?: ApiVersion) {
  // Log all errors (could be enhanced with proper logging service)
  console.error('[API Error]', error);

  // Handle ApiError instances
  if (error instanceof ApiError) {
    return errorResponse(
      error.message,
      error.statusCode,
      version
    );
  }

  // Handle known error codes
  if (typeof error === 'object' && error !== null && 'errorCode' in error && typeof error.errorCode === 'string') {
    const errorCode = error.errorCode as string;
    const mapping = errorMappings[errorCode];
    
    if (mapping) {
      const message = 'message' in error && typeof error.message === 'string' 
        ? error.message 
        : mapping.defaultMessage;
        
      return errorResponse(
        message,
        mapping.statusCode,
        version
      );
    }
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    return errorResponse(
      error.message || 'An unexpected error occurred',
      500,
      version
    );
  }

  // Handle other types of errors
  return errorResponse(
    typeof error === 'string' ? error : 'An unexpected error occurred',
    500,
    version
  );
}