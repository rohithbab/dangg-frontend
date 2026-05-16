import { AuthError, type PostgrestError } from '@supabase/supabase-js';

import {
  AppException,
  AuthException,
  ConflictException,
  ForbiddenException,
  NetworkException,
  NotFoundException,
  PaymentRequiredException,
  RateLimitException,
  ServerException,
  UnknownAppException,
  ValidationException,
} from './apiException';

/** Type-narrow helper for Supabase's PostgrestError shape. */
function isPostgrestError(value: unknown): value is PostgrestError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    'message' in value &&
    'details' in value
  );
}

function isAuthError(value: unknown): value is AuthError {
  return value instanceof AuthError;
}

function isAbortLikeError(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const name = (value as { name?: unknown }).name;
  const message = (value as { message?: unknown }).message;
  return (
    name === 'AbortError' ||
    name === 'TimeoutError' ||
    (typeof message === 'string' &&
      (message.includes('Network request failed') ||
        message.includes('network') ||
        message.includes('fetch')))
  );
}

/**
 * Maps raw Supabase / fetch errors to the typed [AppException] hierarchy.
 * Always returns; never throws.
 */
export function mapSupabaseError(error: unknown): AppException {
  if (error instanceof AppException) {
    return error;
  }

  if (isAuthError(error)) {
    return new AuthException(error.message || 'Authentication failed', error);
  }

  if (isPostgrestError(error)) {
    const status = Number.parseInt(error.code, 10);
    return fromStatus(Number.isFinite(status) ? status : null, error.message, error);
  }

  if (isAbortLikeError(error)) {
    const message =
      typeof error === 'object' && error !== null && 'message' in error
        ? String((error as { message: unknown }).message)
        : 'Network request failed';
    return new NetworkException(message, error);
  }

  const message =
    typeof error === 'object' && error !== null && 'message' in error
      ? String((error as { message: unknown }).message)
      : 'Unknown error';
  return new UnknownAppException(message, null, error);
}

function fromStatus(status: number | null, message: string, cause: unknown): AppException {
  switch (status) {
    case 400:
    case 422:
      return new ValidationException(message, null, cause);
    case 401:
      return new AuthException(message, cause);
    case 402:
      return new PaymentRequiredException(message, cause);
    case 403:
      return new ForbiddenException(message, cause);
    case 404:
      return new NotFoundException(message, cause);
    case 409:
      return new ConflictException(message, cause);
    case 429:
      return new RateLimitException(message, null, cause);
    default:
      if (status !== null && status >= 500 && status < 600) {
        return new ServerException(message, status, cause);
      }
      return new UnknownAppException(message, status, cause);
  }
}
