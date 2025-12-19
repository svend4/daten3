const express = require('express');
const router = express.Router();
const affiliateController = require('../controllers/affiliate.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { rateLimiters } = require('../middleware/rateLimit.middleware');

// Public routes
router.post('/register', rateLimiters.strict, affiliateController.register);
router.get('/validate/:code', affiliateController.validateCode);

// Protected routes (require authentication)
router.use(authenticate);

// Affiliate dashboard
router.get('/dashboard', affiliateController.getDashboard);
router.get('/stats', affiliateController.getStats);
router.get('/earnings', affiliateController.getEarnings);

// Referrals
router.get('/referrals', affiliateController.getReferrals);
router.get('/referral-tree', affiliateController.getReferralTree);

// Payouts
router.get('/payouts', affiliateController.getPayouts);
router.post('/payouts/request', affiliateController.requestPayout);

// Links and tracking
router.get('/links', affiliateController.getAffiliateLinks);
router.post('/track-click', affiliateController.trackClick);

// Settings
router.get('/settings', affiliateController.getSettings);
router.put('/settings', affiliateController.updateSettings);

// Admin routes
router.get('/admin/all', affiliateController.getAllAffiliates); // Admin only
router.patch('/admin/:id/status', affiliateController.updateStatus); // Admin only
router.post('/admin/process-payouts', affiliateController.processPayouts); // Admin only

module.exports = router;
