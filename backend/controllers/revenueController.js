const revenueService = require('../services/revenueService');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get revenue sharing settings
// @route   GET /api/revenue/settings
// @access  Private/Owner
const getRevenueSettings = asyncHandler(async (req, res, next) => {
  const settings = await revenueService.getSettings();
  res.json(settings);
});

// @desc    Update revenue sharing settings
// @route   PUT /api/revenue/settings
// @access  Private/Owner
const updateRevenueSettings = asyncHandler(async (req, res, next) => {
  const { mode, ownerPercentage } = req.body;
  const settings = await revenueService.updateSettings(mode, ownerPercentage, req.user._id);
  res.json(settings);
});

// @desc    Get personal wallet stats and transactions
// @route   GET /api/revenue/stats
// @access  Private/Owner/Employee
const getRevenueStats = asyncHandler(async (req, res, next) => {
  const stats = await revenueService.getWalletStats(req.user._id, req.query);
  res.json(stats);
});

module.exports = {
  getRevenueSettings,
  updateRevenueSettings,
  getRevenueStats,
};
