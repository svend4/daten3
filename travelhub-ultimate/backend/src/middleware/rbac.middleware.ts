/**
 * Role-Based Access Control (RBAC) Middleware
 * Provides role-checking middleware for protected routes
 */

import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';

/**
 * Require admin role middleware
 * Must be used after authenticate middleware
 */
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required'
      });
      return;
    }

    if (req.user.role !== 'admin') {
      logger.warn('Access denied - admin role required', {
        userId: req.user.id,
        role: req.user.role
      });

      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Admin access required'
      });
      return;
    }

    next();
  } catch (error: any) {
    logger.error('RBAC middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'An error occurred while checking permissions'
    });
  }
};

/**
 * Require specific role(s) middleware
 * Must be used after authenticate middleware
 */
export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required'
        });
        return;
      }

      if (!roles.includes(req.user.role)) {
        logger.warn('Access denied - required role not found', {
          userId: req.user.id,
          userRole: req.user.role,
          requiredRoles: roles
        });

        res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: `Access denied. Required role: ${roles.join(' or ')}`
        });
        return;
      }

      next();
    } catch (error: any) {
      logger.error('RBAC middleware error:', error);
      res.status(500).json({
        success: false,
        error: 'Server error',
        message: 'An error occurred while checking permissions'
      });
    }
  };
};

/**
 * Require affiliate role middleware
 */
export const requireAffiliate = requireRole('affiliate', 'admin');

/**
 * Require user or admin role middleware
 */
export const requireUser = requireRole('user', 'admin');
