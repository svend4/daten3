import express from 'express';

const router = express.Router();

// TODO: Import when controllers/middleware are created
// import * as priceAlertsController from '../controllers/priceAlerts.controller';
// import { authenticate } from '../middleware/auth.middleware';

// All routes require authentication
// TODO: Uncomment when auth middleware is ready
// router.use(authenticate);

// Get user's price alerts
router.get('/', async (req, res) => {
  // TODO: Implement priceAlertsController.getAlerts
  res.status(501).json({
    success: false,
    message: 'Get alerts endpoint - implementation pending',
    data: []
  });
});

// Create price alert
router.post('/', async (req, res) => {
  // TODO: Implement priceAlertsController.createAlert
  res.status(501).json({
    success: false,
    message: 'Create alert endpoint - implementation pending'
  });
});

// Update price alert
router.patch('/:id', async (req, res) => {
  // TODO: Implement priceAlertsController.updateAlert
  res.status(501).json({
    success: false,
    message: 'Update alert endpoint - implementation pending'
  });
});

// Delete price alert
router.delete('/:id', async (req, res) => {
  // TODO: Implement priceAlertsController.deleteAlert
  res.status(501).json({
    success: false,
    message: 'Delete alert endpoint - implementation pending'
  });
});

export default router;
