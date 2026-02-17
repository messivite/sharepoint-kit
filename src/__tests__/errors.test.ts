import { describe, it, expect } from 'vitest';
import {
  SpError,
  SpAuthError,
  SpNotFoundError,
  SpThrottleError,
  SpValidationError,
  parseGraphError,
} from '../client/errors.js';

describe('SpError', () => {
  it('should create error with all properties', () => {
    const error = new SpError('test error', 500, 'TestCode', 'req-123');
    expect(error.message).toBe('test error');
    expect(error.status).toBe(500);
    expect(error.code).toBe('TestCode');
    expect(error.requestId).toBe('req-123');
    expect(error.name).toBe('SpError');
    expect(error).toBeInstanceOf(Error);
  });

  it('should serialize to JSON', () => {
    const error = new SpError('test', 500, 'Code', 'req-1');
    const json = error.toJSON();
    expect(json).toEqual({
      name: 'SpError',
      message: 'test',
      status: 500,
      code: 'Code',
      requestId: 'req-1',
    });
  });
});

describe('SpAuthError', () => {
  it('should default to 401', () => {
    const error = new SpAuthError('unauthorized');
    expect(error.status).toBe(401);
    expect(error.name).toBe('SpAuthError');
    expect(error).toBeInstanceOf(SpError);
  });

  it('should accept custom status', () => {
    const error = new SpAuthError('forbidden', 403);
    expect(error.status).toBe(403);
  });
});

describe('SpNotFoundError', () => {
  it('should have 404 status', () => {
    const error = new SpNotFoundError('not found');
    expect(error.status).toBe(404);
    expect(error.code).toBe('ItemNotFound');
    expect(error.name).toBe('SpNotFoundError');
  });
});

describe('SpThrottleError', () => {
  it('should have 429 status and retryAfter', () => {
    const error = new SpThrottleError('throttled', 30);
    expect(error.status).toBe(429);
    expect(error.retryAfter).toBe(30);
    expect(error.name).toBe('SpThrottleError');
  });
});

describe('SpValidationError', () => {
  it('should have 400 status and fieldErrors', () => {
    const fieldErrors = { Title: 'Required' };
    const error = new SpValidationError('invalid', fieldErrors);
    expect(error.status).toBe(400);
    expect(error.fieldErrors).toEqual(fieldErrors);
    expect(error.name).toBe('SpValidationError');
  });
});

describe('parseGraphError', () => {
  const makeBody = (code: string, message: string, requestId?: string) => ({
    error: {
      code,
      message,
      innerError: requestId ? { 'request-id': requestId } : undefined,
    },
  });

  it('should parse 401 as SpAuthError', () => {
    const error = parseGraphError(401, makeBody('Unauthorized', 'Not authorized', 'r1'));
    expect(error).toBeInstanceOf(SpAuthError);
    expect(error.status).toBe(401);
    expect(error.requestId).toBe('r1');
  });

  it('should parse 403 as SpAuthError', () => {
    const error = parseGraphError(403, makeBody('Forbidden', 'Access denied'));
    expect(error).toBeInstanceOf(SpAuthError);
    expect(error.status).toBe(403);
  });

  it('should parse 404 as SpNotFoundError', () => {
    const error = parseGraphError(404, makeBody('ItemNotFound', 'Not found'));
    expect(error).toBeInstanceOf(SpNotFoundError);
  });

  it('should parse 429 as SpThrottleError with retryAfter', () => {
    const error = parseGraphError(429, makeBody('TooManyRequests', 'Throttled'), '60');
    expect(error).toBeInstanceOf(SpThrottleError);
    expect((error as SpThrottleError).retryAfter).toBe(60);
  });

  it('should parse 400 as SpValidationError', () => {
    const error = parseGraphError(400, makeBody('BadRequest', 'Invalid field'));
    expect(error).toBeInstanceOf(SpValidationError);
  });

  it('should parse unknown status as SpError', () => {
    const error = parseGraphError(502, makeBody('BadGateway', 'Server error'));
    expect(error).toBeInstanceOf(SpError);
    expect(error.status).toBe(502);
  });
});
