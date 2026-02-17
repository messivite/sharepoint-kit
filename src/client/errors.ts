import type { GraphErrorResponse } from './types.js';

export class SpError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly requestId: string;

  constructor(message: string, status: number, code: string, requestId: string = '') {
    super(message);
    this.name = 'SpError';
    this.status = status;
    this.code = code;
    this.requestId = requestId;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      code: this.code,
      requestId: this.requestId,
    };
  }
}

export class SpAuthError extends SpError {
  constructor(message: string, status: number = 401, requestId: string = '') {
    super(message, status, 'AuthenticationError', requestId);
    this.name = 'SpAuthError';
  }
}

export class SpNotFoundError extends SpError {
  constructor(message: string, requestId: string = '') {
    super(message, 404, 'ItemNotFound', requestId);
    this.name = 'SpNotFoundError';
  }
}

export class SpThrottleError extends SpError {
  public readonly retryAfter: number;

  constructor(message: string, retryAfter: number = 0, requestId: string = '') {
    super(message, 429, 'TooManyRequests', requestId);
    this.name = 'SpThrottleError';
    this.retryAfter = retryAfter;
  }
}

export class SpValidationError extends SpError {
  public readonly fieldErrors: Record<string, string>;

  constructor(
    message: string,
    fieldErrors: Record<string, string> = {},
    requestId: string = '',
  ) {
    super(message, 400, 'ValidationError', requestId);
    this.name = 'SpValidationError';
    this.fieldErrors = fieldErrors;
  }
}

export function parseGraphError(status: number, body: GraphErrorResponse, retryAfterHeader?: string | null): SpError {
  const { error } = body;
  const requestId = error.innerError?.['request-id'] ?? '';
  const message = error.message || 'Unknown SharePoint error';
  const code = error.code || 'UnknownError';

  if (status === 401 || status === 403) {
    return new SpAuthError(message, status, requestId);
  }

  if (status === 404) {
    return new SpNotFoundError(message, requestId);
  }

  if (status === 429) {
    const retryAfter = retryAfterHeader ? parseInt(retryAfterHeader, 10) : 0;
    return new SpThrottleError(message, retryAfter, requestId);
  }

  if (status === 400) {
    return new SpValidationError(message, {}, requestId);
  }

  return new SpError(message, status, code, requestId);
}
