/**
 * Base error class for all TimeZest API errors
 */
export class ServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly response: unknown
  ) {
    super(message);
    this.name = 'ServiceError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Authentication failed (401)
 */
export class AuthenticationError extends ServiceError {
  constructor(message: string, response: unknown) {
    super(message, 401, response);
    this.name = 'AuthenticationError';
  }
}

/**
 * Access forbidden (403)
 */
export class ForbiddenError extends ServiceError {
  constructor(message: string, response: unknown) {
    super(message, 403, response);
    this.name = 'ForbiddenError';
  }
}

/**
 * Resource not found (404)
 */
export class NotFoundError extends ServiceError {
  constructor(message: string, response: unknown) {
    super(message, 404, response);
    this.name = 'NotFoundError';
  }
}

/**
 * Validation error (400)
 */
export class ValidationError extends ServiceError {
  constructor(
    message: string,
    public readonly errors: Array<{ field: string; message: string }>,
    response: unknown
  ) {
    super(message, 400, response);
    this.name = 'ValidationError';
  }
}

/**
 * Rate limit exceeded (429)
 */
export class RateLimitError extends ServiceError {
  constructor(
    message: string,
    public readonly retryAfter: number,
    response: unknown
  ) {
    super(message, 429, response);
    this.name = 'RateLimitError';
  }
}

/**
 * Server error (5xx)
 */
export class ServerError extends ServiceError {
  constructor(message: string, statusCode: number, response: unknown) {
    super(message, statusCode, response);
    this.name = 'ServerError';
  }
}