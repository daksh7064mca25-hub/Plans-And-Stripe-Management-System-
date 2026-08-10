const Payment = require('../models/Payment');
const Refund = require('../models/Refund');
const User = require('../models/User');
const DailyAnalytics = require('../models/DailyAnalytics');

/**
 * Aggregates and records billing statistics for the previous completed calendar day
 */
const dailyAnalytics = async () => {
  const currentDate = new Date();
  console.log(`[Cron: Daily Analytics] Running job at ${currentDate.toISOString()}`);

  try {
    // Calculate yesterday boundaries (completed 24h window)
    const yesterday = new Date(currentDate);
    yesterday.setDate(currentDate.getDate() - 1);

    const startOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0, 0);
    const endOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999);

    console.log(`[Cron: Daily Analytics] Compiling stats for range: ${startOfYesterday.toISOString()} to ${endOfYesterday.toISOString()}`);

    // Aggregate yesterday's successful payment total
    const paymentsResult = await Payment.aggregate([
      {
        $match: {
          status: 'Succeeded',
          createdAt: { $gte: startOfYesterday, $lte: endOfYesterday },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]);
    const totalSuccessfulPayments = paymentsResult.length > 0 ? paymentsResult[0].total : 0;

    // Aggregate yesterday's successful refund total
    const refundsResult = await Refund.aggregate([
      {
        $match: {
          refundStatus: 'succeeded',
          createdAt: { $gte: startOfYesterday, $lte: endOfYesterday },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$refundAmount' },
        },
      },
    ]);
    const totalRefundAmount = refundsResult.length > 0 ? refundsResult[0].total : 0;

    const netRevenue = totalSuccessfulPayments - totalRefundAmount;

    // Count active premium users currently (status active + isPremium true)
    const activePremiumUsers = await User.countDocuments({
      isPremium: true,
      subscriptionStatus: 'Active',
    });

    // Check for existing records on this specific calendar date to avoid double insertion
    let analyticsRecord = await DailyAnalytics.findOne({ date: startOfYesterday });

    if (analyticsRecord) {
      analyticsRecord.totalSuccessfulPayments = totalSuccessfulPayments;
      analyticsRecord.totalRefundAmount = totalRefundAmount;
      analyticsRecord.netRevenue = netRevenue;
      analyticsRecord.activePremiumUsers = activePremiumUsers;
      await analyticsRecord.save();
      console.log(`[Cron: Daily Analytics] Existing stats updated for ${startOfYesterday.toLocaleDateString()}`);
    } else {
      analyticsRecord = await DailyAnalytics.create({
        date: startOfYesterday,
        totalSuccessfulPayments,
        totalRefundAmount,
        netRevenue,
        activePremiumUsers,
      });
      console.log(`[Cron: Daily Analytics] New stats recorded for ${startOfYesterday.toLocaleDateString()}`);
    }

    console.log(`[Cron: Daily Analytics] Compilation Finished:
      - Date Reference: ${startOfYesterday.toLocaleDateString()}
      - Total Succeeded Payments: ₹${totalSuccessfulPayments.toFixed(2)}
      - Total Refunded Amount: ₹${totalRefundAmount.toFixed(2)}
      - Net Daily Revenue: ₹${netRevenue.toFixed(2)}
      - Current Active Premium Users: ${activePremiumUsers}`);

    return analyticsRecord;
  } catch (err) {
    console.error('[Cron: Daily Analytics] Error compiling daily stats:', err);
    throw err;
  }
};

module.exports = dailyAnalytics;
