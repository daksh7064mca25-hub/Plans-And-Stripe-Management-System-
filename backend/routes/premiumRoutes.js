const express = require('express');
const router = express.Router();
const { protect, requireSubscription } = require('../middleware/authMiddleware');

// @desc    Get Premium Analytics Data
// @route   GET /api/premium/data
// @access  Private/Subscribed
router.get('/data', protect, requireSubscription, (req, res) => {
  res.json({
    message: 'Access granted! Welcome to the SaaS Premium Portal.',
    premiumData: {
      analyticsScore: 98.4,
      activeUsersCount: 14500,
      enterpriseToken: 'premium_token_abc_123_xyz',
    },
  });
});

module.exports = router;
