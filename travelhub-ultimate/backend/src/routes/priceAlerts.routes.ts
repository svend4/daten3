import express from 'express';
import * as priceAlertsController from '../controllers/priceAlerts.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get user's price alerts
router.get('/', priceAlertsController.getAlerts);

// Create price alert
router.post('/', priceAlertsController.createAlert);

// Update price alert
router.patch('/:id', priceAlertsController.updateAlert);

// Delete price alert
router.delete('/:id', priceAlertsController.deleteAlert);

export default router;
