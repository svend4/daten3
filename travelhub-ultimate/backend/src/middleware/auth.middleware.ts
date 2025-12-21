import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Validate required environment variables
if (!process.env.JWT_SECRET) {
  throw new Error('CRITICAL: JWT_SECRET environment variable is not set. Cannot start server without secure JWT secret.');
}

if (!process.env.JWT_REFRESH_SECRET) {
  throw new Error('CRITICAL: JWT_REFRESH_SECRET environment variable is not set. Cannot start server without secure refresh secret.');
}

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        [key: string]: any;
      };
    }
  }
}

interface JWTPayload {
  id: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * Authentication middleware
 * Validates JWT token and attaches user to request
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'No token provided. Please login.'
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const JWT_SECRET = process.env.JWT_SECRET!; // Validated at startup

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

      // Verify user still exists in database and is active
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, email: true, role: true, isActive: true }
      });

      if (!user) {
        res.status(401).json({
          success: false,
          error: 'User not found',
          message: 'User account no longer exists. Please register again.'
        });
        return;
      }

      if (!user.isActive) {
        res.status(401).json({
          success: false,
          error: 'Account disabled',
          message: 'Your account has been disabled. Please contact support.'
        });
        return;
      }

      // Attach user to request
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role
      };

      next();
    } catch (jwtError: any) {
      if (jwtError.name === 'TokenExpiredError') {
        res.status(401).json({
          success: false,
          error: 'Token expired',
          message: 'Your session has expired. Please login again.'
        });
        return;
      }

      if (jwtError.name === 'JsonWebTokenError') {
        res.status(401).json({
          success: false,
          error: 'Invalid token',
          message: 'Invalid authentication token.'
        });
        return;
      }

      throw jwtError;
    }
  } catch (error: any) {
    console.error('❌ Authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
      message: 'An error occurred during authentication.'
    });
  }
};

/**
 * Optional authentication middleware
 * Attaches user to request if token is valid, but doesn't require it
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    // If no token, just continue without user
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.substring(7);
    const JWT_SECRET = process.env.JWT_SECRET!; // Validated at startup

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

      // Verify user exists and is active (optional, so we don't fail if not)
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, email: true, role: true, isActive: true }
      });

      if (user && user.isActive) {
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role
        };
      }
    } catch (jwtError) {
      // Token invalid, but continue without user (optional auth)
      console.warn('⚠️  Invalid token in optional auth, continuing without user');
    }

    next();
  } catch (error: any) {
    console.error('❌ Optional auth error:', error);
    // For optional auth, continue even on error
    next();
  }
};

/**
 * Generate JWT token
 */
export const generateToken = (payload: JWTPayload): string => {
  const JWT_SECRET = process.env.JWT_SECRET!; // Validated at startup
  const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  } as jwt.SignOptions);
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (payload: JWTPayload): string => {
  const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!; // Validated at startup
  const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN
  } as jwt.SignOptions);
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token: string): JWTPayload => {
  const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!; // Validated at startup

  return jwt.verify(token, JWT_REFRESH_SECRET) as JWTPayload;
};
