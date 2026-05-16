import { RETRY_BASE_DELAY_MS, RETRY_MAX_ATTEMPTS } from '../config/constants';
import { logger } from '../utils/logger';

import { AppException, NetworkException, ServerException } from './apiException';

export type RetryOptions = {
  maxAttempts?: number;
  baseDelayMs?: number;
  /** Override the default "is this transient?" check. */
  isTransient?: (error: AppException) => boolean;
};

const defaultIsTransient = (error: AppException): boolean =>
  error instanceof NetworkException || error instanceof ServerException;

/**
 * Exponential-backoff helper. Use ONLY for idempotent operations
 * (GET, idempotent PATCH). Never wrap a create/payment/OTP-send.
 *
 * Backoff formula: `baseDelayMs * 2^(attempt-1)` with ±30% jitter.
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  opts: RetryOptions = {},
): Promise<T> {
  const maxAttempts = opts.maxAttempts ?? RETRY_MAX_ATTEMPTS;
  const baseDelay = opts.baseDelayMs ?? RETRY_BASE_DELAY_MS;
  const isTransient = opts.isTransient ?? defaultIsTransient;

  let attempt = 0;

  while (true) {
    attempt++;
    try {
      return await fn();
    } catch (caught) {
      if (!(caught instanceof AppException)) {
        throw caught;
      }
      if (!isTransient(caught) || attempt >= maxAttempts) {
        throw caught;
      }

      const delay = backoff(attempt, baseDelay);
      logger.warn(
        `retry attempt ${attempt}/${maxAttempts} after ${delay}ms — ${caught.code}: ${caught.message}`,
      );
      await sleep(delay);
    }
  }
}

function backoff(attempt: number, baseDelay: number): number {
  const exp = baseDelay * 2 ** (attempt - 1);
  const jitter = 1 + (Math.random() * 0.6 - 0.3);
  return Math.round(exp * jitter);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
