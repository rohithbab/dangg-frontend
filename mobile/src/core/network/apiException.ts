/**
 * Typed exception hierarchy.
 *
 * Every error surfaced from `core/network` is one of these classes. UI code
 * can switch on the constructor (or use the `code` discriminator) instead of
 * scraping message strings.
 */
export type AppExceptionCode =
  | 'NETWORK'
  | 'AUTH'
  | 'VALIDATION'
  | 'SERVER'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'PAYMENT_REQUIRED'
  | 'RATE_LIMIT'
  | 'FORBIDDEN'
  | 'UNKNOWN';

export class AppException extends Error {
  readonly code: AppExceptionCode;
  readonly statusCode: number | null;
  readonly originalError: unknown;

  constructor(
    code: AppExceptionCode,
    message: string,
    statusCode: number | null = null,
    originalError: unknown = null,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.originalError = originalError;
  }
}

/** No connectivity, DNS failure, socket-level error. */
export class NetworkException extends AppException {
  constructor(message: string, originalError: unknown = null) {
    super('NETWORK', message, null, originalError);
  }
}

/** 401 / Supabase auth-related failure. Triggers session-expired modal. */
export class AuthException extends AppException {
  constructor(message: string, originalError: unknown = null) {
    super('AUTH', message, 401, originalError);
  }
}

/** 400 / 422 input or business-rule violation. Show inline form error. */
export class ValidationException extends AppException {
  readonly field: string | null;

  constructor(message: string, field: string | null = null, originalError: unknown = null) {
    super('VALIDATION', message, 400, originalError);
    this.field = field;
  }
}

/** OTP failed verification — wrong code, expired, or replayed. UI shows inline error. */
export class InvalidOtpException extends ValidationException {
  constructor(message = 'Incorrect code, try again', originalError: unknown = null) {
    super(message, 'otp', originalError);
  }
}

/** 5xx server failure. RetryPolicy may handle. */
export class ServerException extends AppException {
  constructor(message: string, statusCode: number = 500, originalError: unknown = null) {
    super('SERVER', message, statusCode, originalError);
  }
}

export class NotFoundException extends AppException {
  constructor(message: string, originalError: unknown = null) {
    super('NOT_FOUND', message, 404, originalError);
  }
}

export class ConflictException extends AppException {
  constructor(message: string, originalError: unknown = null) {
    super('CONFLICT', message, 409, originalError);
  }
}

export class PaymentRequiredException extends AppException {
  constructor(message: string, originalError: unknown = null) {
    super('PAYMENT_REQUIRED', message, 402, originalError);
  }
}

export class RateLimitException extends AppException {
  readonly retryAfterMs: number | null;

  constructor(message: string, retryAfterMs: number | null = null, originalError: unknown = null) {
    super('RATE_LIMIT', message, 429, originalError);
    this.retryAfterMs = retryAfterMs;
  }
}

export class ForbiddenException extends AppException {
  constructor(message: string, originalError: unknown = null) {
    super('FORBIDDEN', message, 403, originalError);
  }
}

/** Catch-all for anything that escaped the mapper. */
export class UnknownAppException extends AppException {
  constructor(message: string, statusCode: number | null = null, originalError: unknown = null) {
    super('UNKNOWN', message, statusCode, originalError);
  }
}
