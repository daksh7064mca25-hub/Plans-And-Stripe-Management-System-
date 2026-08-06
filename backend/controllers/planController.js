const planService = require('../services/planService');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all plans
// @route   GET /api/plans
// @access  Public
const getPlans = asyncHandler(async (req, res, next) => {
  const includeInactive = req.user && req.user.role === 'Admin';
  const plans = await planService.getPlansList(includeInactive);
  res.json(plans);
});

// @desc    Get single plan
// @route   GET /api/plans/:id
// @access  Public
const getPlanById = asyncHandler(async (req, res, next) => {
  const plan = await planService.getPlanDetails(req.params.id);
  if (!plan) {
    return next(new ErrorResponse('Subscription plan not found', 404));
  }
  res.json(plan);
});

// @desc    Create subscription plan
// @route   POST /api/plans
// @access  Private/Admin
const createPlan = asyncHandler(async (req, res, next) => {
  const plan = await planService.createPlan(req.body);
  res.status(201).json(plan);
});

// @desc    Update subscription plan
// @route   PUT /api/plans/:id
// @access  Private/Admin
const updatePlan = asyncHandler(async (req, res, next) => {
  const plan = await planService.updatePlan(req.params.id, req.body);
  if (!plan) {
    return next(new ErrorResponse('Plan not found', 404));
  }
  res.json(plan);
});

// @desc    Delete subscription plan
// @route   DELETE /api/plans/:id
// @access  Private/Admin
const deletePlan = asyncHandler(async (req, res, next) => {
  const plan = await planService.deletePlan(req.params.id);
  if (!plan) {
    return next(new ErrorResponse('Plan not found', 404));
  }
  res.json({ message: 'Subscription plan deleted' });
});

module.exports = {
  getPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
};
