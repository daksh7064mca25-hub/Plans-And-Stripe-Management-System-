const Plan = require('../models/Plan');
const User = require('../models/User');
const Payment = require('../models/Payment');
const WebhookLog = require('../models/WebhookLog');
const Refund = require('../models/Refund');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'mock_secret_key');
const revenueService = require('./revenueService');

const generatePaymentIntent = async (planId, billingPeriod, userId) => {
  const plan = await Plan.findById(planId);
  if (!plan) {
    throw new Error('Subscription plan not found');
  }

  const priceInUSD = billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
  // Dynamic calculation for INR conversion (1 USD = 80 INR)
  const amountInINR = Math.round(priceInUSD * 80 * 100); // in Paise

  // If secret key is mock, bypass Stripe API
  if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.includes('mock')) {
    return {
      clientSecret: `mock_pi_${Date.now()}_secret_${Math.random().toString(36).substring(7)}`,
      amount: amountInINR / 100,
    };
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInINR,
    currency: 'inr',
    metadata: {
      userId: userId.toString(),
      planId: planId.toString(),
      billingPeriod,
    },
  });

  return {
    clientSecret: paymentIntent.client_secret,
    amount: amountInINR / 100,
  };
};

const executePaymentSimulation = async (planId, billingPeriod, userId) => {
  const plan = await Plan.findById(planId);
  if (!plan) {
    throw new Error('Plan not found');
  }

  const priceInUSD = billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
  const amountInINR = priceInUSD * 80;

  const dummyPaymentIntentId = `sim_pi_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  // Update user subscription parameters
  await User.findByIdAndUpdate(userId, {
    subscription: {
      planId,
      status: 'Active',
      billingPeriod,
      updatedAt: new Date(),
    },
  });

  // Record payment history
  const payment = await Payment.create({
    userId,
    planId,
    amount: amountInINR,
    status: 'Succeeded',
    stripePaymentIntentId: dummyPaymentIntentId,
    billingPeriod,
  });

  await revenueService.calculateAndDistribute(payment);

  return payment;
};

const processWebhookEvent = async (rawBody, signature, secret) => {
  const event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  const eventId = event.id;
  const eventType = event.type;
  const dataObject = event.data.object;

  // Prevent duplicate events
  const existingLog = await WebhookLog.findOne({ eventId });
  if (existingLog) {
    return { status: 'already_processed' };
  }

  if (eventType === 'payment_intent.succeeded') {
    const { userId, planId, billingPeriod } = dataObject.metadata;
    if (userId && planId && billingPeriod) {
      await User.findByIdAndUpdate(userId, {
        subscription: {
          planId,
          status: 'Active',
          billingPeriod,
          updatedAt: new Date(),
        },
      });

      const payment = await Payment.create({
        userId,
        planId,
        amount: dataObject.amount / 100,
        status: 'Succeeded',
        stripePaymentIntentId: dataObject.id,
        billingPeriod,
      });

      await revenueService.calculateAndDistribute(payment);
    }
  } else if (eventType === 'payment_intent.payment_failed') {
    const { userId, planId, billingPeriod } = dataObject.metadata;
    if (userId && planId) {
      await User.findByIdAndUpdate(userId, {
        'subscription.status': 'Past Due',
        'subscription.updatedAt': new Date(),
      });

      await Payment.create({
        userId,
        planId,
        amount: dataObject.amount / 100,
        status: 'Failed',
        stripePaymentIntentId: dataObject.id,
        billingPeriod: billingPeriod || 'monthly',
      });
    }
  } else if (eventType === 'charge.refunded') {
    const charge = dataObject;
    const paymentIntentId = charge.payment_intent;
    if (paymentIntentId) {
      const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntentId });
      if (payment) {
        const defaultOwner = await User.findOne({ role: 'Owner' }) || await User.findOne({ role: 'Admin' });
        
        if (charge.refunds && charge.refunds.data) {
          const RevenueDistribution = require('../models/RevenueDistribution');
          const originalDist = await RevenueDistribution.findOne({ paymentId: payment._id, amount: { $gt: 0 } });
          const affectedEmployees = originalDist 
            ? originalDist.splits.filter(s => s.role === 'Employee').map(s => s.userId) 
            : [];

          for (const sRefund of charge.refunds.data) {
            let refundDoc = await Refund.findOne({ stripeRefundId: sRefund.id });
            if (!refundDoc) {
              const isFullRefund = (payment.refundedAmount || 0) + (sRefund.amount / 100) >= payment.amount - 0.01;
              const refundType = isFullRefund ? 'Full' : 'Partial';

              refundDoc = new Refund({
                payment: payment._id,
                stripeRefundId: sRefund.id,
                stripePaymentIntentId: payment.stripePaymentIntentId,
                refundAmount: sRefund.amount / 100,
                refundType,
                refundReason: sRefund.reason || 'Webhook charge.refunded',
                refundStatus: sRefund.status,
                refundedBy: defaultOwner ? defaultOwner._id : payment.userId,
                owner: defaultOwner ? defaultOwner._id : payment.userId,
                affectedEmployees,
              });
            } else {
              refundDoc.refundStatus = sRefund.status;
              if (sRefund.reason) {
                refundDoc.refundReason = sRefund.reason;
              }
            }
            await refundDoc.save();
            await revenueService.reverseDistribution(refundDoc);
          }
        }

        // Recalculate refundedAmount & status
        const dbRefunds = await Refund.find({ payment: payment._id });
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
      }
    }
  } else if (eventType === 'refund.updated') {
    const stripeRefund = dataObject;
    const paymentIntentId = stripeRefund.payment_intent;
    if (paymentIntentId) {
      const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntentId });
      if (payment) {
        const defaultOwner = await User.findOne({ role: 'Owner' }) || await User.findOne({ role: 'Admin' });
        const RevenueDistribution = require('../models/RevenueDistribution');
        const originalDist = await RevenueDistribution.findOne({ paymentId: payment._id, amount: { $gt: 0 } });
        const affectedEmployees = originalDist 
          ? originalDist.splits.filter(s => s.role === 'Employee').map(s => s.userId) 
          : [];

        let refundDoc = await Refund.findOne({ stripeRefundId: stripeRefund.id });
        if (!refundDoc) {
          const isFullRefund = (payment.refundedAmount || 0) + (stripeRefund.amount / 100) >= payment.amount - 0.01;
          const refundType = isFullRefund ? 'Full' : 'Partial';

          refundDoc = new Refund({
            payment: payment._id,
            stripeRefundId: stripeRefund.id,
            stripePaymentIntentId: payment.stripePaymentIntentId,
            refundAmount: stripeRefund.amount / 100,
            refundType,
            refundReason: stripeRefund.reason || 'Webhook refund.updated',
            refundStatus: stripeRefund.status,
            refundedBy: defaultOwner ? defaultOwner._id : payment.userId,
            owner: defaultOwner ? defaultOwner._id : payment.userId,
            affectedEmployees,
          });
        } else {
          refundDoc.refundStatus = stripeRefund.status;
          if (stripeRefund.reason) {
            refundDoc.refundReason = stripeRefund.reason;
          }
        }
        await refundDoc.save();
        await revenueService.reverseDistribution(refundDoc);

        // Recalculate refundedAmount & status
        const dbRefunds = await Refund.find({ payment: payment._id });
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
      }
    }
  }

  // Create processed Webhook Log
  await WebhookLog.create({
    eventId,
    eventType,
    status: 'processed',
    metadata: dataObject.metadata || {},
  });

  return { status: 'success' };
};

const queryPaymentHistory = async (userId, userRole, query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter = {};
  if (query.status && query.status !== 'All') {
    filter.status = query.status;
  }

  if (userRole === 'Admin' || userRole === 'Owner') {
    if (query.search) {
      const users = await User.find({
        $or: [
          { name: { $regex: query.search, $options: 'i' } },
          { email: { $regex: query.search, $options: 'i' } },
        ],
      }).select('_id');
      filter.userId = { $in: users.map((u) => u._id) };
    }
  } else {
    filter.userId = userId;
  }

  const total = await Payment.countDocuments(filter);
  const payments = await Payment.find(filter)
    .populate('userId', 'name email')
    .populate('planId', 'name')
    .sort({ paymentDate: -1 })
    .skip(skip)
    .limit(limit);

  return {
    payments,
    total,
    page,
    pages: Math.ceil(total / limit),
  };
};

const aggregateDashboardStats = async () => {
  // 1. Total Revenue pipeline
  const totalRevenueResult = await Payment.aggregate([
    { $match: { status: 'Succeeded' } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  const totalRevenue = totalRevenueResult.length > 0 ? totalRevenueResult[0].total : 0;

  // 2. Active Subscriptions count
  const activeSubscriptions = await User.countDocuments({ 'subscription.status': 'Active' });

  // 3. Expired Subscriptions count
  const expiredSubscriptions = await User.countDocuments({ 'subscription.status': { $in: ['Inactive', 'Past Due'] } });

  // 4. Monthly Revenue pipeline
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const monthlyRevenueResult = await Payment.aggregate([
    { $match: { status: 'Succeeded', paymentDate: { $gte: startOfMonth } } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  const monthlyRevenue = monthlyRevenueResult.length > 0 ? monthlyRevenueResult[0].total : 0;

  // 5. Today's Payments pipeline
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const todayPaymentsResult = await Payment.aggregate([
    { $match: { status: 'Succeeded', paymentDate: { $gte: startOfToday } } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  const todayPayments = todayPaymentsResult.length > 0 ? todayPaymentsResult[0].total : 0;

  // 6. Recent Transactions list
  const recentTransactions = await Payment.find({})
    .populate('userId', 'name email')
    .populate('planId', 'name')
    .sort({ paymentDate: -1 })
    .limit(5)
    .lean();

  // 7. Last 7 Days Daily Revenue trend
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);
  const dailyRevenueResult = await Payment.aggregate([
    { $match: { status: 'Succeeded', paymentDate: { $gte: sevenDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$paymentDate' } },
        revenue: { $sum: '$amount' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const dailyRevenue = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(sevenDaysAgo.getDate() + i);
    const dateString = date.toISOString().split('T')[0];
    const match = dailyRevenueResult.find((d) => d._id === dateString);
    dailyRevenue.push({
      date: date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
      revenue: match ? match.revenue : 0,
    });
  }

  return {
    totalRevenue,
    activeSubscriptions,
    expiredSubscriptions,
    monthlyRevenue,
    todayPayments,
    recentTransactions,
    dailyRevenue,
  };
};

module.exports = {
  generatePaymentIntent,
  executePaymentSimulation,
  processWebhookEvent,
  queryPaymentHistory,
  aggregateDashboardStats,
};
