const mongoose = require('mongoose');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'mock_secret_key');
const Payment = require('../models/Payment');
const Refund = require('../models/Refund');
const User = require('../models/User');
const RevenueDistribution = require('../models/RevenueDistribution');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Initiate a refund (Full or Partial)
// @route   POST /api/refunds
// @access  Private (Owner only)
const createRefund = asyncHandler(async (req, res, next) => {
  const { paymentId, amount, reason } = req.body;

  if (!paymentId || amount === undefined) {
    return next(new ErrorResponse('Payment ID and refund amount are required', 400));
  }

  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    return next(new ErrorResponse('Refund amount must be a positive number', 400));
  }

  // 1. Verify payment exists
  const payment = await Payment.findById(paymentId);
  if (!payment) {
    return next(new ErrorResponse('Payment record not found', 404));
  }

  // Verify status is Succeeded
  if (payment.status !== 'Succeeded') {
    return next(new ErrorResponse('Only successful payments can be refunded', 400));
  }

  // Prevent refunding completed/fully refunded payments
  if (payment.refundStatus === 'Full') {
    return next(new ErrorResponse('This payment has already been fully refunded', 400));
  }

  // 2. Prevent duplicate refund requests (within 10 seconds for the same amount)
  const recentDuplicate = await Refund.findOne({
    payment: payment._id,
    refundAmount: numericAmount,
    createdAt: { $gte: new Date(Date.now() - 10000) }
  });
  if (recentDuplicate) {
    return next(new ErrorResponse('Duplicate refund request detected. Please wait.', 400));
  }

  // 3. Prevent refund amounts greater than the original/remaining payment amount
  const remainingAmount = payment.amount - (payment.refundedAmount || 0);
  if (numericAmount > remainingAmount + 0.001) {
    return next(
      new ErrorResponse(
        `Refund amount (₹${numericAmount.toFixed(2)}) exceeds remaining refundable balance (₹${remainingAmount.toFixed(2)})`,
        400
      )
    );
  }

  const isSimulated = payment.stripePaymentIntentId.startsWith('sim_') || 
                      (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.includes('mock'));

  // 4. Validate Stripe payment status before refunding
  if (!isSimulated) {
    try {
      const stripePI = await stripe.paymentIntents.retrieve(payment.stripePaymentIntentId);
      if (stripePI.status !== 'succeeded') {
        return next(new ErrorResponse(`Stripe payment status is ${stripePI.status}. Only succeeded payments can be refunded.`, 400));
      }
    } catch (stripeErr) {
      console.error('Failed to validate Stripe payment status:', stripeErr);
      return next(new ErrorResponse(`Failed to validate Stripe payment status: ${stripeErr.message}`, 400));
    }
  }

  // 5. Process Stripe Refund
  let stripeRefundId;
  if (isSimulated) {
    stripeRefundId = `sim_re_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  } else {
    try {
      const amountInPaise = Math.round(numericAmount * 100);
      const stripeRefund = await stripe.refunds.create({
        payment_intent: payment.stripePaymentIntentId,
        amount: amountInPaise,
        reason: 'requested_by_customer',
      });
      stripeRefundId = stripeRefund.id;
    } catch (stripeError) {
      console.error('Stripe Refund API Error:', stripeError);
      return next(new ErrorResponse(`Stripe refund failed: ${stripeError.message}`, 400));
    }
  }

  // 6. Use MongoDB Session/Transaction for atomic updates
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // Find Owner and Affected Employees
    const ownerUser = await User.findOne({ role: 'Owner' }).session(session) || await User.findOne({ role: 'Admin' }).session(session);
    const ownerId = ownerUser ? ownerUser._id : req.user._id;

    const originalDist = await RevenueDistribution.findOne({ paymentId: payment._id, amount: { $gt: 0 } }).session(session);
    const affectedEmployees = originalDist 
      ? originalDist.splits.filter(s => s.role === 'Employee').map(s => s.userId) 
      : [];

    const isFullRefund = (payment.refundedAmount || 0) + numericAmount >= payment.amount - 0.01;
    const refundType = isFullRefund ? 'Full' : 'Partial';

    // Store refund details in MongoDB
    const refundDocs = await Refund.create([{
      payment: payment._id,
      stripeRefundId,
      stripePaymentIntentId: payment.stripePaymentIntentId,
      refundAmount: numericAmount,
      refundType,
      refundReason: reason || 'requested_by_customer',
      refundStatus: 'succeeded',
      refundedBy: req.user._id,
      owner: ownerId,
      affectedEmployees,
    }], { session });

    const refund = refundDocs[0];

    // Update Payment refund fields
    payment.refundedAmount = (payment.refundedAmount || 0) + numericAmount;
    payment.refundStatus = refundType;
    await payment.save({ session });

    // Reverse revenue sharing distribution
    const revenueService = require('../services/revenueService');
    await revenueService.reverseDistribution(refund, session);

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: 'Refund processed successfully',
      refund,
      payment,
    });
  } catch (dbError) {
    console.error('Database transaction failed. Aborting transaction.', dbError);
    await session.abortTransaction();
    session.endSession();

    // Graceful fallback for standalone database deployments that do not support transactions
    if (dbError.message.includes('replica set') || dbError.message.includes('transaction')) {
      console.warn('MongoDB transaction not supported. Falling back to non-transactional execution.');

      const ownerUser = await User.findOne({ role: 'Owner' }) || await User.findOne({ role: 'Admin' });
      const ownerId = ownerUser ? ownerUser._id : req.user._id;

      const originalDist = await RevenueDistribution.findOne({ paymentId: payment._id, amount: { $gt: 0 } });
      const affectedEmployees = originalDist 
        ? originalDist.splits.filter(s => s.role === 'Employee').map(s => s.userId) 
        : [];

      const isFullRefund = (payment.refundedAmount || 0) + numericAmount >= payment.amount - 0.01;
      const refundType = isFullRefund ? 'Full' : 'Partial';

      const refund = await Refund.create({
        payment: payment._id,
        stripeRefundId,
        stripePaymentIntentId: payment.stripePaymentIntentId,
        refundAmount: numericAmount,
        refundType,
        refundReason: reason || 'requested_by_customer',
        refundStatus: 'succeeded',
        refundedBy: req.user._id,
        owner: ownerId,
        affectedEmployees,
      });

      payment.refundedAmount = (payment.refundedAmount || 0) + numericAmount;
      payment.refundStatus = refundType;
      await payment.save();

      const revenueService = require('../services/revenueService');
      await revenueService.reverseDistribution(refund);

      return res.status(201).json({
        success: true,
        message: 'Refund processed successfully (Non-Transactional Fallback)',
        refund,
        payment,
      });
    }

    return next(new ErrorResponse(`Database transaction failed: ${dbError.message}`, 500));
  }
});

// @desc    Get all refunds
// @route   GET /api/refunds
// @access  Private (Owner/Admin only)
const getAllRefunds = asyncHandler(async (req, res, next) => {
  const refunds = await Refund.find({})
    .populate({
      path: 'payment',
      populate: {
        path: 'userId',
        select: 'name email',
      },
    })
    .populate('refundedBy', 'name email')
    .populate('owner', 'name email')
    .populate('affectedEmployees', 'name email')
    .sort({ createdAt: -1 })
    .lean();

  // Attach associated reversal splits to each refund
  for (const refund of refunds) {
    const distribution = await RevenueDistribution.findOne({ refundId: refund._id }).lean();
    if (distribution) {
      // splits contain populated user names/emails? Let's populate the splits' userIds!
      const populatedSplits = [];
      for (const split of distribution.splits) {
        const userObj = await User.findById(split.userId).select('name email').lean();
        populatedSplits.push({
          userId: split.userId,
          role: split.role,
          amount: split.amount,
          userName: userObj ? userObj.name : 'Unknown User',
          userEmail: userObj ? userObj.email : 'N/A',
        });
      }
      refund.reversalSplits = populatedSplits;
      refund.distributionMode = distribution.mode;
      refund.ownerShareReversal = distribution.ownerShare;
      refund.employeeShareTotalReversal = distribution.employeeShareTotal;
    } else {
      refund.reversalSplits = [];
      refund.distributionMode = 'N/A';
      refund.ownerShareReversal = 0;
      refund.employeeShareTotal = 0;
    }
  }

  res.json({
    success: true,
    count: refunds.length,
    refunds,
  });
});

module.exports = {
  createRefund,
  getAllRefunds,
};
