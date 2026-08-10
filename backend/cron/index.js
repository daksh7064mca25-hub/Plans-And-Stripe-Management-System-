const cron = require('node-cron');
const expireSubscriptions = require('./expireSubscriptions');
const dailyAnalytics = require('./dailyAnalytics');
const sendExpiryReminders = require('./sendExpiryReminders');

/**
 * Initializes and registers scheduled cron jobs
 */
const initCronJobs = () => {
  const isCronEnabled = process.env.ENABLE_CRON === 'true';

  if (!isCronEnabled) {
    console.log('[Cron] Background cron scheduler is disabled (ENABLE_CRON !== "true").');
    return;
  }

  console.log('[Cron] Initializing scheduled cron jobs...');

  // 1. Auto-expire subscriptions: Run every day at midnight (0 0 * * *)
  cron.schedule('0 0 * * *', async () => {
    console.log('[Cron] Job triggered: Auto-expire subscriptions...');
    try {
      await expireSubscriptions();
    } catch (err) {
      console.error('[Cron] Job failed: Auto-expire subscriptions. Error details:', err);
    }
  });

  // 2. Daily revenue analytics: Run every day at 00:10 (10 0 * * *)
  cron.schedule('10 0 * * *', async () => {
    console.log('[Cron] Job triggered: Daily revenue analytics...');
    try {
      await dailyAnalytics();
    } catch (err) {
      console.error('[Cron] Job failed: Daily revenue analytics. Error details:', err);
    }
  });

  // 3. Expiry reminder notifications: Run every day at 09:00 (0 9 * * *)
  cron.schedule('0 9 * * *', async () => {
    console.log('[Cron] Job triggered: Expiry reminder notifications...');
    try {
      await sendExpiryReminders();
    } catch (err) {
      console.error('[Cron] Job failed: Expiry reminder notifications. Error details:', err);
    }
  });

  console.log('[Cron] All background scheduled cron jobs registered successfully.');
};

module.exports = initCronJobs;
