const express = require('express');
const router = express.Router();
const {
  getRevenueSettings,
  updateRevenueSettings,
  getRevenueStats,
} = require('../controllers/revenueController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Require authentication for all routes
router.use(protect);

// Settings endpoint (restricted to Owner and Admin)
router.route('/settings')
  .get(authorize('Owner', 'Admin'), getRevenueSettings)
  .put(authorize('Owner', 'Admin'), updateRevenueSettings);

// Earnings statistics endpoint (Owner, Employee, and Admin)
router.route('/stats')
  .get(authorize('Owner', 'Employee', 'Admin'), getRevenueStats);

module.exports = router;
