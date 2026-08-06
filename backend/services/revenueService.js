const mongoose = require('mongoose');
const User = require('../models/User');
const RevenueSettings = require('../models/RevenueSettings');
const RevenueDistribution = require('../models/RevenueDistribution');

// @desc    Get current revenue settings or create default
const getSettings = async () => {
  let settings = await RevenueSettings.findOne({});
  if (!settings) {
    settings = await RevenueSettings.create({
      mode: 'Percentage',
      ownerPercentage: 70,
    });
  }
  return settings;
};

// @desc    Update revenue settings
const updateSettings = async (mode, ownerPercentage, userId) => {
  if (!['Equal', 'Percentage'].includes(mode)) {
    throw new Error('Invalid revenue distribution mode');
  }

  const settings = await getSettings();
  settings.mode = mode;
  if (mode === 'Percentage') {
    if (ownerPercentage === undefined || ownerPercentage < 0 || ownerPercentage > 100) {
      throw new Error('Owner percentage must be between 0 and 100');
    }
    settings.ownerPercentage = ownerPercentage;
  }
  settings.updatedBy = userId;
  return await settings.save();
};

// @desc    Calculate revenue splits and update wallets
const calculateAndDistribute = async (payment) => {
  const settings = await getSettings();
  const amount = payment.amount;

  // Find all active employees and owner
  const employees = await User.find({ role: 'Employee' });
  const owner = await User.findOne({ role: 'Owner' });
  const finalOwner = owner || await User.findOne({ role: 'Admin' });

  const numEmployees = employees.length;
  let ownerShare = 0;
  let employeeShareTotal = 0;
  let employeeSharePerPerson = 0;

  if (settings.mode === 'Equal') {
    const totalParticipants = (finalOwner ? 1 : 0) + numEmployees;
    if (totalParticipants > 0) {
      const share = amount / totalParticipants;
      if (finalOwner) {
        ownerShare = share;
      }
      employeeSharePerPerson = numEmployees > 0 ? share : 0;
      employeeShareTotal = employeeSharePerPerson * numEmployees;
    }
  } else {
    // Percentage Split
    if (finalOwner) {
      // If there are no employees, owner gets 100%
      const percentage = numEmployees > 0 ? settings.ownerPercentage : 100;
      ownerShare = amount * (percentage / 100);
      employeeShareTotal = amount - ownerShare;
      employeeSharePerPerson = numEmployees > 0 ? employeeShareTotal / numEmployees : 0;
    } else {
      employeeShareTotal = amount;
      employeeSharePerPerson = numEmployees > 0 ? amount / numEmployees : 0;
    }
  }

  // Round values to 2 decimal places to maintain currency precision
  ownerShare = parseFloat(ownerShare.toFixed(2));
  employeeSharePerPerson = parseFloat(employeeSharePerPerson.toFixed(2));
  employeeShareTotal = parseFloat((employeeSharePerPerson * numEmployees).toFixed(2));

  // Perform updates to wallets in database
  const splits = [];

  if (finalOwner && ownerShare > 0) {
    await User.findByIdAndUpdate(finalOwner._id, {
      $inc: { walletBalance: ownerShare },
    });
    splits.push({
      userId: finalOwner._id,
      role: 'Owner',
      amount: ownerShare,
    });
  }

  if (numEmployees > 0 && employeeSharePerPerson > 0) {
    for (let emp of employees) {
      await User.findByIdAndUpdate(emp._id, {
        $inc: { walletBalance: employeeSharePerPerson },
      });
      splits.push({
        userId: emp._id,
        role: 'Employee',
        amount: employeeSharePerPerson,
      });
    }
  }

  // Create distribution record log
  return await RevenueDistribution.create({
    paymentId: payment._id,
    type: 'Distribution',
    amount,
    mode: settings.mode,
    ownerShare,
    employeeShareTotal,
    employeeSharePerPerson,
    splits,
  });
};

// @desc    Get Wallet Stats and Distribution history
const getWalletStats = async (userId, query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const skip = (page - 1) * limit;

  // 1. Fetch user's wallet balance
  const user = await User.findById(userId).select('role walletBalance').lean();
  const walletBalance = user ? user.walletBalance : 0;
  const userRole = user ? user.role : 'Employee';

  // 2. Fetch total earnings using aggregation
  // For Owners, exclude refund reversals (negative splits) to show gross lifetime revenue
  // For Employees, include all splits to show net lifetime revenue
  const matchEarningsStage = { 'splits.userId': new mongoose.Types.ObjectId(userId) };
  if (userRole === 'Owner') {
    matchEarningsStage['splits.amount'] = { $gt: 0 };
  }

  const earningsResult = await RevenueDistribution.aggregate([
    { $match: matchEarningsStage },
    { $unwind: '$splits' },
    { $match: matchEarningsStage },
    { $group: { _id: null, total: { $sum: '$splits.amount' } } },
  ]);
  const totalEarnings = earningsResult.length > 0 ? earningsResult[0].total : 0;

  // 3. Fetch history distributions
  const filter = { 'splits.userId': new mongoose.Types.ObjectId(userId) };
  const total = await RevenueDistribution.countDocuments(filter);
  
  const rawDistributions = await RevenueDistribution.find(filter)
    .populate('paymentId', 'stripePaymentIntentId')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  // Map history to include client-friendly structure
  const history = rawDistributions.map((dist) => {
    const match = dist.splits.find((s) => s.userId.toString() === userId.toString());
    return {
      _id: dist._id,
      amount: dist.amount,
      mode: dist.mode,
      yourShare: match ? match.amount : 0,
      stripePaymentIntentId: dist.paymentId?.stripePaymentIntentId || 'N/A',
      createdAt: dist.createdAt,
    };
  });

  // 4. Fetch refund transaction logs
  const RefundTransactionLog = require('../models/RefundTransactionLog');
  const refundQuery = userRole === 'Owner' ? { owner: userId } : { employee: userId };
  const refundTransactions = await RefundTransactionLog.find(refundQuery)
    .populate('payment', 'stripePaymentIntentId')
    .populate('refund', 'stripeRefundId refundReason refundStatus')
    .populate('owner', 'name email')
    .populate('employee', 'name email')
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  return {
    walletBalance,
    totalEarnings,
    history,
    refundTransactions,
    total,
    page,
    pages: Math.ceil(total / limit),
  };
};

// @desc    Reverse revenue split distribution on refunds
const reverseDistribution = async (refund, session = null) => {
  const options = session ? { session } : {};

  // Enforce succeeded status only
  if (refund.refundStatus !== 'succeeded') {
    console.log(`Refund status is ${refund.refundStatus}. Skipping wallet balance adjustments and logs.`);
    return null;
  }

  // Prevent duplicate reversals
  const existingReversal = await RevenueDistribution.findOne({ refundId: refund._id }, null, options);
  if (existingReversal) {
    return existingReversal;
  }

  // Find original positive distribution for this payment
  const originalDist = await RevenueDistribution.findOne({ paymentId: refund.payment, amount: { $gt: 0 } }, null, options);
  if (!originalDist) {
    console.warn(`No original revenue distribution found for payment ${refund.payment}`);
    return null;
  }

  const originalAmount = originalDist.amount;
  if (!originalAmount || originalAmount <= 0) {
    console.warn(`Invalid original distribution amount for payment ${refund.payment}`);
    return null;
  }

  // Calculate ratio: refundAmount / original payment amount
  const ratio = refund.refundAmount / originalAmount;

  // Calculate proportional share reversals
  let ownerReversal = originalDist.ownerShare * ratio;
  let employeeReversalTotal = originalDist.employeeShareTotal * ratio;
  
  const employeeCount = originalDist.splits.filter(s => s.role === 'Employee').length;
  let employeeReversalPerPerson = employeeCount > 0 ? (employeeReversalTotal / employeeCount) : 0;

  // Round values
  ownerReversal = parseFloat(ownerReversal.toFixed(2));
  employeeReversalPerPerson = parseFloat(employeeReversalPerPerson.toFixed(2));
  employeeReversalTotal = parseFloat((employeeReversalPerPerson * employeeCount).toFixed(2));

  // Perform updates to wallets (atomically decrementing)
  const reversedSplits = [];
  const RefundTransactionLog = require('../models/RefundTransactionLog');
  
  const ownerUser = await User.findOne({ role: 'Owner' }, null, options) || await User.findOne({ role: 'Admin' }, null, options);
  const ownerId = ownerUser ? ownerUser._id : (refund.owner || refund.refundedBy);

  for (const split of originalDist.splits) {
    let reversalAmount = split.amount * ratio;
    reversalAmount = parseFloat(reversalAmount.toFixed(2));

    if (reversalAmount > 0) {
      await User.findByIdAndUpdate(split.userId, {
        $inc: { walletBalance: -reversalAmount },
      }, options);

      reversedSplits.push({
        userId: split.userId,
        role: split.role,
        amount: -reversalAmount,
      });

      if (split.role === 'Employee') {
        // Log Employee transaction reversal
        await RefundTransactionLog.create([{
          payment: refund.payment,
          refund: refund._id,
          owner: ownerId,
          employee: split.userId,
          amountReversed: reversalAmount,
          transactionType: 'EmployeeReversal',
        }], options);
      }
    }
  }

  // Log Owner transaction reversal
  if (ownerReversal > 0) {
    await RefundTransactionLog.create([{
      payment: refund.payment,
      refund: refund._id,
      owner: ownerId,
      employee: null,
      amountReversed: ownerReversal,
      transactionType: 'OwnerReversal',
    }], options);
  }

  // Create a negative RevenueDistribution record log
  const reversalDist = await RevenueDistribution.create([{
    paymentId: refund.payment,
    refundId: refund._id,
    type: 'RefundReversal',
    amount: -refund.refundAmount,
    mode: originalDist.mode,
    ownerShare: -ownerReversal,
    employeeShareTotal: -employeeReversalTotal,
    employeeSharePerPerson: -employeeReversalPerPerson,
    splits: reversedSplits,
  }], options);

  return reversalDist[0];
};

module.exports = {
  getSettings,
  updateSettings,
  calculateAndDistribute,
  getWalletStats,
  reverseDistribution,
};
