const express = require('express');
const router = express.Router();
const priceAlertsController = require('../controllers/priceAlerts.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/', priceAlertsController.getAlerts);
router.post('/', priceAlertsController.createAlert);
router.patch('/:id', priceAlertsController.updateAlert);
router.delete('/:id', priceAlertsController.deleteAlert);

module.exports = router;
