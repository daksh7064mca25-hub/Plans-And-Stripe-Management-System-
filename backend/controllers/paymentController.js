const paymentService = require('../services/paymentService');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const Payment = require('../models/Payment');
const Refund = require('../models/Refund');

// @desc    Create Stripe Payment Intent
// @route   POST /api/payments/create-intent
// @access  Private
const createPaymentIntent = asyncHandler(async (req, res, next) => {
  const { planId, billingPeriod } = req.body;
  const userId = req.user._id;

  if (!planId || !billingPeriod) {
    return next(new ErrorResponse('Plan ID and billing period are required', 400));
  }

  const result = await paymentService.generatePaymentIntent(planId, billingPeriod, userId);
  res.json(result);
});

// @desc    Handle Stripe Webhooks
// @route   POST /api/payments/webhook
// @access  Public (Stripe verified via signatures)
const handleWebhook = asyncHandler(async (req, res, next) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_mock_webhook_secret_value';

  if (!sig) {
    return next(new ErrorResponse('Stripe signature header is missing', 400));
  }

  try {
    await paymentService.processWebhookEvent(req.body, sig, endpointSecret);
    res.json({ received: true });
  } catch (err) {
    return next(new ErrorResponse(err.message, 400));
  }
});

// @desc    Simulate successful payment for sandboxed frontends
// @route   POST /api/payments/simulate-payment
// @access  Private
const simulatePayment = asyncHandler(async (req, res, next) => {
  const { planId, billingPeriod } = req.body;
  const userId = req.user._id;

  if (!planId || !billingPeriod) {
    return next(new ErrorResponse('Plan ID and billing period are required', 400));
  }

  const payment = await paymentService.executePaymentSimulation(planId, billingPeriod, userId);
  res.status(251).json({
    message: 'Simulation successful',
    payment,
  });
});

// @desc    Get payment history (Paginated, Searchable, Filterable)
// @route   GET /api/payments/history
// @access  Private
const getPaymentHistory = asyncHandler(async (req, res, next) => {
  const history = await paymentService.queryPaymentHistory(req.user._id, req.user.role, req.query);
  res.json(history);
});

// @desc    Get Admin Dashboard Stats
// @route   GET /api/payments/stats
// @access  Private/Admin
const getAdminStats = asyncHandler(async (req, res, next) => {
  const stats = await paymentService.aggregateDashboardStats();
  res.json(stats);
});

// @desc    Get single payment details with refund history
// @route   GET /api/payments/:id
// @access  Private
const getPaymentDetails = asyncHandler(async (req, res, next) => {
  const payment = await Payment.findById(req.params.id)
    .populate('userId', 'name email')
    .populate('planId', 'name monthlyPrice yearlyPrice');

  if (!payment) {
    return next(new ErrorResponse('Payment record not found', 404));
  }

  // Access check
  if (
    req.user.role !== 'Admin' &&
    req.user.role !== 'Owner' &&
    req.user.role !== 'Employee' &&
    payment.userId._id.toString() !== req.user._id.toString()
  ) {
    return next(new ErrorResponse('Access denied to this payment record', 403));
  }

  // Get refunds for this payment
  const refunds = await Refund.find({ payment: payment._id })
    .populate('refundedBy', 'name email')
    .populate('owner', 'name email')
    .populate('affectedEmployees', 'name email')
    .sort({ createdAt: -1 });

  // Get initial distribution
  const RevenueDistribution = require('../models/RevenueDistribution');
  const distribution = await RevenueDistribution.findOne({ paymentId: payment._id, type: 'Distribution' })
    .populate('splits.userId', 'name email')
    .lean();

  res.json({
    payment,
    refunds,
    distribution,
  });
});

// @desc    Synchronize payment refund status with Stripe
// @route   POST /api/payments/:id/sync
// @access  Private
const syncPaymentWithStripe = asyncHandler(async (req, res, next) => {
  const payment = await Payment.findById(req.params.id)
    .populate('userId', 'name email')
    .populate('planId', 'name');

  if (!payment) {
    return next(new ErrorResponse('Payment record not found', 404));
  }

  // Access check
  if (
    req.user.role !== 'Admin' &&
    req.user.role !== 'Owner' &&
    req.user.role !== 'Employee' &&
    payment.userId._id.toString() !== req.user._id.toString()
  ) {
    return next(new ErrorResponse('Access denied to this payment record', 403));
  }

  const isSimulated = payment.stripePaymentIntentId.startsWith('sim_') || 
                      (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.includes('mock'));

  if (!isSimulated) {
    try {
      const stripePI = await stripe.paymentIntents.retrieve(payment.stripePaymentIntentId, {
        expand: ['charges.data.refunds'],
      });

      const stripeRefunds = [];
      if (stripePI.charges && stripePI.charges.data) {
        for (const charge of stripePI.charges.data) {
          if (charge.refunds && charge.refunds.data) {
            stripeRefunds.push(...charge.refunds.data);
          }
        }
      }

      // Synchronize refunds with database
      const User = require('../models/User');
      const defaultOwner = await User.findOne({ role: 'Owner' }) || await User.findOne({ role: 'Admin' });

      for (const sRefund of stripeRefunds) {
        let refundDoc = await Refund.findOne({ stripeRefundId: sRefund.id });
        if (!refundDoc) {
          const RevenueDistribution = require('../models/RevenueDistribution');
          const originalDist = await RevenueDistribution.findOne({ paymentId: payment._id, amount: { $gt: 0 } });
          const affectedEmployees = originalDist 
            ? originalDist.splits.filter(s => s.role === 'Employee').map(s => s.userId) 
            : [];

          const isFullRefund = (payment.refundedAmount || 0) + (sRefund.amount / 100) >= payment.amount - 0.01;
          const refundType = isFullRefund ? 'Full' : 'Partial';

          refundDoc = new Refund({
            payment: payment._id,
            stripeRefundId: sRefund.id,
            stripePaymentIntentId: payment.stripePaymentIntentId,
            refundAmount: sRefund.amount / 100,
            refundType,
            refundReason: sRefund.reason || 'Synchronized via Stripe Sync API',
            refundStatus: sRefund.status,
            refundedBy: defaultOwner ? defaultOwner._id : req.user._id,
            owner: defaultOwner ? defaultOwner._id : req.user._id,
            affectedEmployees,
          });
        } else {
          refundDoc.refundStatus = sRefund.status;
          if (sRefund.reason) {
            refundDoc.refundReason = sRefund.reason;
          }
        }
        await refundDoc.save();
        const revenueService = require('../services/revenueService');
        await revenueService.reverseDistribution(refundDoc);
      }
    } catch (stripeError) {
      console.error('Stripe Sync Error:', stripeError);
      return next(new ErrorResponse(`Failed to synchronize with Stripe: ${stripeError.message}`, 400));
    }
  }

  // Recalculate local refund status & total refunded amount
  const dbRefunds = await Refund.find({ payment: payment._id })
    .populate('refundedBy', 'name email')
    .populate('owner', 'name email')
    .populate('affectedEmployees', 'name email')
    .sort({ createdAt: -1 });

  const totalRefunded = dbRefunds
    .filter((ref) => ref.refundStatus === 'succeeded')
    .reduce((sum, ref) => sum + ref.refundAmount, 0);

  payment.refundedAmount = parseFloat(totalRefunded.toFixed(2));
  if (payment.refundedAmount >= payment.amount - 0.01) {
    payment.refundStatus = 'Full';
  } else if (payment.refundedAmount > 0) {
    payment.refundStatus = 'Partial';
  } else {
    payment.refundStatus = 'None';
  }
  await payment.save();

  // Get initial distribution
  const RevenueDistribution = require('../models/RevenueDistribution');
  const distribution = await RevenueDistribution.findOne({ paymentId: payment._id, type: 'Distribution' })
    .populate('splits.userId', 'name email')
    .lean();

  res.json({
    success: true,
    message: 'Payment status synchronized with Stripe',
    payment,
    refunds: dbRefunds,
    distribution,
  });
});

module.exports = {
  createPaymentIntent,
  handleWebhook,
  simulatePayment,
  getPaymentHistory,
  getAdminStats,
  getPaymentDetails,
  syncPaymentWithStripe,
};
