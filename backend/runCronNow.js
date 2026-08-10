const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

const expireSubscriptions = require('./cron/expireSubscriptions');
const dailyAnalytics = require('./cron/dailyAnalytics');
const sendExpiryReminders = require('./cron/sendExpiryReminders');

const run = async () => {
  try {
    console.log('[Cron Manual Trigger] Connecting to database...');
    await connectDB();
    console.log('[Cron Manual Trigger] Connected.\n');

    console.log('--- 1. Executing Subscriptions Expiration Job ---');
    await expireSubscriptions();

    console.log('\n--- 2. Executing Daily Analytics Compilation Job ---');
    await dailyAnalytics();

    console.log('\n--- 3. Executing Expiry Reminders Email Job ---');
    await sendExpiryReminders();

    console.log('\n[Cron Manual Trigger] All jobs triggered and executed successfully.');
  } catch (err) {
    console.error('[Cron Manual Trigger] Execution failed:', err);
  } finally {
    if (mongoose.connection && mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('[Cron Manual Trigger] Database connection closed.');
    }
  }
};

run();
