const User = require('../models/User');

/**
 * Finds and expires subscriptions whose expiresAt date has passed
 */
const expireSubscriptions = async () => {
  const currentDate = new Date();
  console.log(`[Cron: Auto-Expire] Running job at ${currentDate.toISOString()}`);

  try {
    // Find active users whose subscriptions expired
    const expiredUsers = await User.find({
      expiresAt: { $lt: currentDate },
      subscriptionStatus: { $ne: 'Expired' },
    });

    if (expiredUsers.length === 0) {
      console.log('[Cron: Auto-Expire] No subscriptions require expiration today.');
      return { expiredCount: 0 };
    }

    // Perform bulk update to expire subscriptions
    const result = await User.updateMany(
      {
        expiresAt: { $lt: currentDate },
        subscriptionStatus: { $ne: 'Expired' },
      },
      {
        $set: {
          subscriptionStatus: 'Expired',
          isPremium: false,
          'subscription.status': 'Inactive',
        },
      }
    );

    console.log(`[Cron: Auto-Expire] Successfully expired ${result.modifiedCount} subscriptions.`);
    return { expiredCount: result.modifiedCount };
  } catch (err) {
    console.error('[Cron: Auto-Expire] Error encountered while expiring subscriptions:', err);
    throw err;
  }
};

module.exports = expireSubscriptions;
