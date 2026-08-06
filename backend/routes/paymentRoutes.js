const express = require('express');
const router = express.Router();
const {
  createPaymentIntent,
  simulatePayment,
  getPaymentHistory,
  getAdminStats,
  getPaymentDetails,
  syncPaymentWithStripe,
} = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/create-intent', protect, createPaymentIntent);
router.post('/simulate-payment', protect, simulatePayment);
router.get('/history', protect, getPaymentHistory);
router.get('/stats', protect, authorize('Admin'), getAdminStats);
router.get('/:id', protect, getPaymentDetails);
router.post('/:id/sync', protect, syncPaymentWithStripe);

module.exports = router;
