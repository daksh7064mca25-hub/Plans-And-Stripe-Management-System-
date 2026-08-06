const express = require('express');
const router = express.Router();
const { createRefund, getAllRefunds } = require('../controllers/refundController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Only Owner can initiate refunds
router.post('/', protect, authorize('Owner'), createRefund);

// Owner and Admin can view refund history
router.get('/', protect, authorize('Owner', 'Admin'), getAllRefunds);

module.exports = router;
