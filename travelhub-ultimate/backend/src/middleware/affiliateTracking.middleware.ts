/**
 * Affiliate Tracking Middleware
 * Automatically tracks affiliate clicks and sets referral cookies
 */

import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

const prisma = new PrismaClient();

/**
 * Track affiliate click middleware
 * Checks for 'ref' query parameter and saves click data
 */
export const trackAffiliateClick = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const referralCode = req.query.ref as string;

    // If no referral code, check cookie
    let effectiveReferralCode = referralCode;

    if (!effectiveReferralCode) {
      effectiveReferralCode = req.cookies.referralCode;
    }

    // If we have a referral code
    if (effectiveReferralCode) {
      // Find affiliate
      const affiliate = await prisma.affiliate.findUnique({
        where: { referralCode: effectiveReferralCode }
      });

      if (affiliate && affiliate.status === 'active') {
        // Set cookie (30 days expiration)
        if (!req.cookies.referralCode) {
          res.cookie('referralCode', effectiveReferralCode, {
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
          });
        }

        // Track click (only if from query parameter - new click)
        if (referralCode) {
          await prisma.affiliateClick.create({
            data: {
              affiliateId: affiliate.id,
              sourceUrl: req.headers.referer || req.url,
              ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
              userAgent: req.headers['user-agent'] || 'unknown',
              converted: false
            }
          });

          logger.info('Affiliate click tracked', {
            affiliateId: affiliate.id,
            referralCode: effectiveReferralCode,
            url: req.url
          });
        }
      } else {
        logger.warn('Invalid or inactive affiliate', { referralCode: effectiveReferralCode });
      }
    }

    next();
  } catch (error: any) {
    // Don't block request if tracking fails
    logger.error('Affiliate tracking error:', error);
    next();
  }
};

/**
 * Get referral code from request (cookie or query)
 */
export const getReferralCode = (req: Request): string | undefined => {
  return (req.query.ref as string) || req.cookies.referralCode;
};

/**
 * Check if request has referral tracking
 */
export const hasReferralTracking = (req: Request): boolean => {
  return !!(req.query.ref || req.cookies.referralCode);
};

/**
 * Clear referral cookie (after conversion or expiration)
 */
export const clearReferralCookie = (res: Response): void => {
  res.clearCookie('referralCode');
};
