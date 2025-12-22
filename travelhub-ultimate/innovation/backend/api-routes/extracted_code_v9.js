const express = require('express');
const router = express.Router();
const adminAffiliateController = require('../controllers/admin.affiliate.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/admin.middleware');

// All routes require authentication and admin privileges
router.use(authenticate);
router.use(requireAdmin);

// Affiliate Management
router.get('/affiliates', adminAffiliateController.getAllAffiliates);
router.get('/affiliates/:id', adminAffiliateController.getAffiliate);
router.patch('/affiliates/:id/status', adminAffiliateController.updateStatus);
router.patch('/affiliates/:id/verify', adminAffiliateController.verifyAffiliate);

// Commission Management
router.get('/commissions', adminAffiliateController.getAllCommissions);
router.patch('/commissions/:id/approve', adminAffiliateController.approveCommission);
router.patch('/commissions/:id/reject', adminAffiliateController.rejectCommission);

// Payout Management
router.get('/payouts', adminAffiliateController.getAllPayouts);
router.post('/payouts/:id/process', adminAffiliateController.processPayout);
router.patch('/payouts/:id/complete', adminAffiliateController.completePayout);
router.patch('/payouts/:id/reject', adminAffiliateController.rejectPayout);

// Settings
router.get('/settings', adminAffiliateController.getSettings);
router.put('/settings', adminAffiliateController.updateSettings);

// Analytics
router.get('/analytics', adminAffiliateController.getAnalytics);
router.get('/analytics/top-performers', adminAffiliateController.getTopPerformers);

module.exports = router;
