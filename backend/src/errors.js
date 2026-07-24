/**
 * Enterprise error classes for consistent error handling
 *
 * Usage:
 *   throw new NotFoundError('Case');
 *   throw new ValidationError('Invalid input.');
 *   throw new AppError('Payment required', 402, 'PAYMENT_REQUIRED');
 */

class AppError extends Error {
  /**
   * @param {string} message  Human-readable error description
   * @param {number} statusCode  HTTP status code (4xx or 5xx)
   * @param {string} code  Machine-readable error code (e.g. 'NOT_FOUND')
   * @param {Array|null} details  Optional field-level validation details
   */
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

class NotFoundError extends AppError {
  constructor(entity = 'Resource') {
    super(`${entity} not found.`, 404, 'NOT_FOUND');
  }
}

class ValidationError extends AppError {
  constructor(message = 'Validation failed.', details = null) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized.') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource already exists.') {
    super(message, 409, 'CONFLICT');
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Too many requests.') {
    super(message, 429, 'RATE_LIMITED');
  }
}

module.exports = {
  AppError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ConflictError,
  RateLimitError,
};
