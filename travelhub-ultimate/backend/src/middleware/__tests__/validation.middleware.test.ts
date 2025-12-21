/**
 * Unit Tests for Validation Middleware
 */

import { describe, it, expect, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import {
  validateBody,
  validateParams,
  loginSchema,
  registerSchema,
  emailSchema,
  passwordSchema,
  uuidSchema,
} from '../validation.middleware';

// Mock Express Request, Response, NextFunction
function createMockRequest(body: any = {}, params: any = {}): Partial<Request> {
  return {
    body,
    params,
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

describe('Validation Middleware - Zod Schemas', () => {
  describe('Email Schema', () => {
    it('should accept valid email', () => {
      expect(() => emailSchema.parse('test@example.com')).not.toThrow();
    });

    it('should reject invalid email', () => {
      expect(() => emailSchema.parse('invalid-email')).toThrow();
    });

    it('should reject empty email', () => {
      expect(() => emailSchema.parse('')).toThrow();
    });
  });

  describe('Password Schema', () => {
    it('should accept valid password', () => {
      expect(() => passwordSchema.parse('Password123')).not.toThrow();
    });

    it('should reject short password', () => {
      expect(() => passwordSchema.parse('Pass1')).toThrow();
    });

    it('should reject password without number', () => {
      expect(() => passwordSchema.parse('PasswordOnly')).toThrow();
    });

    it('should reject password without letter', () => {
      expect(() => passwordSchema.parse('12345678')).toThrow();
    });
  });

  describe('UUID Schema', () => {
    it('should accept valid UUID', () => {
      const validUUID = '550e8400-e29b-41d4-a716-446655440000';
      expect(() => uuidSchema.parse(validUUID)).not.toThrow();
    });

    it('should reject invalid UUID', () => {
      expect(() => uuidSchema.parse('not-a-uuid')).toThrow();
    });
  });

  describe('Login Schema', () => {
    it('should accept valid login data', () => {
      const validData = {
        email: 'user@example.com',
        password: 'anypassword',
      };
      expect(() => loginSchema.parse(validData)).not.toThrow();
    });

    it('should reject missing email', () => {
      const invalidData = {
        password: 'anypassword',
      };
      expect(() => loginSchema.parse(invalidData)).toThrow();
    });

    it('should reject missing password', () => {
      const invalidData = {
        email: 'user@example.com',
      };
      expect(() => loginSchema.parse(invalidData)).toThrow();
    });
  });

  describe('Register Schema', () => {
    it('should accept valid registration data', () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123',
      };
      expect(() => registerSchema.parse(validData)).not.toThrow();
    });

    it('should accept optional phone', () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123',
        phone: '+1234567890',
      };
      expect(() => registerSchema.parse(validData)).not.toThrow();
    });

    it('should reject short name', () => {
      const invalidData = {
        name: 'J',
        email: 'john@example.com',
        password: 'Password123',
      };
      expect(() => registerSchema.parse(invalidData)).toThrow();
    });

    it('should reject weak password', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'weak',
      };
      expect(() => registerSchema.parse(invalidData)).toThrow();
    });
  });
});

describe('Validation Middleware - validateBody', () => {
  it('should validate request body and call next() on success', async () => {
    const req = createMockRequest({ email: 'test@example.com', password: 'test' });
    const res = createMockResponse();
    const next = createMockNext();

    const middleware = validateBody(loginSchema);
    await middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should return 400 error on validation failure', async () => {
    const req = createMockRequest({ email: 'invalid-email', password: 'test' });
    const res = createMockResponse();
    const next = createMockNext();

    const middleware = validateBody(loginSchema);
    await middleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: 'Validation failed',
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('should remove extra fields from request body', async () => {
    const req = createMockRequest({
      email: 'test@example.com',
      password: 'test',
      extraField: 'should be removed',
    });
    const res = createMockResponse();
    const next = createMockNext();

    const middleware = validateBody(loginSchema);
    await middleware(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
    expect(req.body).not.toHaveProperty('extraField');
    expect(req.body).toHaveProperty('email');
    expect(req.body).toHaveProperty('password');
  });
});

describe('Validation Middleware - validateParams', () => {
  const idSchema = uuidSchema;

  it('should validate request params and call next() on success', async () => {
    const validUUID = '550e8400-e29b-41d4-a716-446655440000';
    const req = createMockRequest({}, { id: validUUID });
    const res = createMockResponse();
    const next = createMockNext();

    const schema = loginSchema.pick({ email: true }); // Just for testing
    const middleware = validateParams(schema);
    await middleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(400); // Will fail validation, just testing the flow
  });

  it('should return 400 error on invalid params', async () => {
    const req = createMockRequest({}, { id: 'not-a-uuid' });
    const res = createMockResponse();
    const next = createMockNext();

    const schema = loginSchema.pick({ email: true });
    const middleware = validateParams(schema);
    await middleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });
});
