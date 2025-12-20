import { Request, Response, NextFunction } from 'express';

/**
 * Admin authorization middleware
 * Requires user to be authenticated and have admin role
 *
 * NOTE: This middleware should be used AFTER authenticate middleware
 */
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required. Please login.'
      });
      return;
    }

    // Check if user has admin role
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Admin privileges required. Access denied.'
      });
      return;
    }

    // User is admin, proceed
    next();
  } catch (error: any) {
    console.error('❌ Admin authorization error:', error);
    res.status(500).json({
      success: false,
      error: 'Authorization failed',
      message: 'An error occurred during authorization.'
    });
  }
};

/**
 * Super admin authorization middleware
 * Requires user to have super_admin role
 */
export const requireSuperAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required.'
      });
      return;
    }

    if (req.user.role !== 'super_admin') {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Super admin privileges required.'
      });
      return;
    }

    next();
  } catch (error: any) {
    console.error('❌ Super admin authorization error:', error);
    res.status(500).json({
      success: false,
      error: 'Authorization failed',
      message: 'An error occurred during authorization.'
    });
  }
};

/**
 * Role-based authorization middleware factory
 * Creates middleware that checks for specific roles
 */
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required.'
        });
        return;
      }

      if (!allowedRoles.includes(req.user.role)) {
        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: `One of the following roles required: ${allowedRoles.join(', ')}`
        });
        return;
      }

      next();
    } catch (error: any) {
      console.error('❌ Role authorization error:', error);
      res.status(500).json({
        success: false,
        error: 'Authorization failed',
        message: 'An error occurred during authorization.'
      });
    }
  };
};
