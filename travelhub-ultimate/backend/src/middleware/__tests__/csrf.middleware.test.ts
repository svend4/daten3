/**
 * Unit Tests for CSRF Middleware
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import {
  generateCSRFToken,
  csrfProtection,
  optionalCSRFProtection,
  clearCSRFToken,
} from '../csrf.middleware';

// Mock Express Request, Response, NextFunction
function createMockRequest(
  method: string = 'POST',
  headers: any = {},
  body: any = {},
  user?: any
): Partial<Request> {
  return {
    method,
    headers,
    body,
    user,
    ip: '127.0.0.1',
    socket: { remoteAddress: '127.0.0.1' } as any,
  };
}

function createMockResponse(): Partial<Response> {
  const res: Partial<Response> = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res;
}

const createMockNext = () => vi.fn() as unknown as NextFunction;

describe('CSRF Middleware', () => {
  describe('generateCSRFToken', () => {
    it('should generate a valid CSRF token', () => {
      const sessionId = 'test-session-id';
      const token = generateCSRFToken(sessionId);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBe(64); // 32 bytes = 64 hex characters
    });

    it('should generate different tokens for different sessions', () => {
      const token1 = generateCSRFToken('session-1');
      const token2 = generateCSRFToken('session-2');

      expect(token1).not.toBe(token2);
    });
  });

  describe('csrfProtection middleware', () => {
    it('should allow GET requests without token', () => {
      const req = createMockRequest('GET');
      const res = createMockResponse();
      const next = createMockNext();

      csrfProtection(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should allow HEAD requests without token', () => {
      const req = createMockRequest('HEAD');
      const res = createMockResponse();
      const next = createMockNext();

      csrfProtection(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should allow OPTIONS requests without token', () => {
      const req = createMockRequest('OPTIONS');
      const res = createMockResponse();
      const next = createMockNext();

      csrfProtection(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject POST request without CSRF token', () => {
      const req = createMockRequest('POST');
      const res = createMockResponse();
      const next = createMockNext();

      csrfProtection(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'CSRF token missing',
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject POST request with invalid CSRF token', () => {
      const req = createMockRequest('POST', { 'x-csrf-token': 'invalid-token' });
      const res = createMockResponse();
      const next = createMockNext();

      csrfProtection(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Invalid CSRF token',
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should accept POST request with valid CSRF token in header', () => {
      const sessionId = 'test-session';
      const token = generateCSRFToken(sessionId);

      // Mock authenticated user
      const req = createMockRequest(
        'POST',
        { 'x-csrf-token': token },
        {},
        { id: sessionId }
      );
      const res = createMockResponse();
      const next = createMockNext();

      csrfProtection(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should accept POST request with valid CSRF token in body', () => {
      const sessionId = 'test-session';
      const token = generateCSRFToken(sessionId);

      const req = createMockRequest(
        'POST',
        {},
        { csrfToken: token },
        { id: sessionId }
      );
      const res = createMockResponse();
      const next = createMockNext();

      csrfProtection(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('optionalCSRFProtection middleware', () => {
    it('should allow POST request without token (optional mode)', () => {
      const req = createMockRequest('POST');
      const res = createMockResponse();
      const next = createMockNext();

      optionalCSRFProtection(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should validate token if provided', () => {
      const req = createMockRequest('POST', { 'x-csrf-token': 'invalid-token' });
      const res = createMockResponse();
      const next = createMockNext();

      optionalCSRFProtection(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('should accept valid token if provided', () => {
      const sessionId = 'test-session';
      const token = generateCSRFToken(sessionId);

      const req = createMockRequest(
        'POST',
        { 'x-csrf-token': token },
        {},
        { id: sessionId }
      );
      const res = createMockResponse();
      const next = createMockNext();

      optionalCSRFProtection(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('clearCSRFToken', () => {
    it('should clear token for a session', () => {
      const sessionId = 'test-session';
      const token = generateCSRFToken(sessionId);

      // Token should work before clearing
      const req1 = createMockRequest(
        'POST',
        { 'x-csrf-token': token },
        {},
        { id: sessionId }
      );
      const res1 = createMockResponse();
      const next1 = createMockNext();

      csrfProtection(req1 as Request, res1 as Response, next1);
      expect(next1).toHaveBeenCalled();

      // Clear token
      clearCSRFToken(sessionId);

      // Token should not work after clearing
      const req2 = createMockRequest(
        'POST',
        { 'x-csrf-token': token },
        {},
        { id: sessionId }
      );
      const res2 = createMockResponse();
      const next2 = createMockNext();

      csrfProtection(req2 as Request, res2 as Response, next2);
      expect(res2.status).toHaveBeenCalledWith(403);
      expect(next2).not.toHaveBeenCalled();
    });
  });
});
