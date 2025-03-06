import { json } from '@sveltejs/kit';
import type { HttpError } from '@sveltejs/kit';

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

export function successResponse<T>(data: T, meta?: ApiResponse['meta']) {
  return json({
    success: true,
    data,
    meta
  });
}

export function errorResponse(error: string | Error, status: number = 500) {
  const message = error instanceof Error ? error.message : error;
  return json({
    success: false,
    error: message
  }, { status });
}

export const ApiErrors = {
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  NOT_FOUND: 'Resource not found',
  INVALID_INPUT: 'Invalid input provided',
  SERVER_ERROR: 'An unexpected error occurred'
} as const;