import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

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
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

      // TODO: Optionally verify user still exists in database
      // const user = await prisma.user.findUnique({ where: { id: decoded.id } });
      // if (!user) {
      //   throw new Error('User not found');
      // }

      // Attach user to request
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role
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
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role
      };
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
  const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';
  const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  } as jwt.SignOptions);
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (payload: JWTPayload): string => {
  const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-here';
  const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN
  } as jwt.SignOptions);
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token: string): JWTPayload => {
  const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-here';

  return jwt.verify(token, JWT_REFRESH_SECRET) as JWTPayload;
};
