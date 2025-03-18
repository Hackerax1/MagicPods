import { json } from '@sveltejs/kit';
import type { HttpError } from '@sveltejs/kit';
import { addVersionHeaders } from './apiVersion';
import type { ApiVersion } from './apiVersion';

export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
};

export function successResponse<T>(data: T, meta?: ApiResponse['meta'], version?: ApiVersion) {
  const response = json({
    success: true,
    data,
    meta
  });
  
  if (version) {
    return addVersionHeaders(response, version);
  }
  
  return response;
}

export function errorResponse(error: string | Error, status: number = 500, version?: ApiVersion) {
  const message = error instanceof Error ? error.message : error;
  const response = json({
    success: false,
    error: message
  }, { status });
  
  if (version) {
    return addVersionHeaders(response, version);
  }
  
  return response;
}

export const ApiErrors = {
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  NOT_FOUND: 'Resource not found',
  INVALID_INPUT: 'Invalid input provided',
  SERVER_ERROR: 'An unexpected error occurred'
} as const;