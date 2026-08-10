const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

/**
 * Finds subscriptions expiring within the next 3 days and sends email alerts
 */
const sendExpiryReminders = async () => {
  const now = new Date();
  const threeDaysFromNow = new Date(now);
  threeDaysFromNow.setDate(now.getDate() + 3);

  console.log(`[Cron: Expiry-Reminders] Running job. Alert range: ${now.toISOString()} to ${threeDaysFromNow.toISOString()}`);

  try {
    // Query users whose subscription expires within the window and who haven't received reminder
    const expiringUsers = await User.find({
      expiresAt: { $gt: now, $lte: threeDaysFromNow },
      reminderSent: { $ne: true },
      subscriptionStatus: { $ne: 'Expired' },
    });

    if (expiringUsers.length === 0) {
      console.log('[Cron: Expiry-Reminders] No users with upcoming subscription expiries require notifications today.');
      return { sentCount: 0 };
    }

    console.log(`[Cron: Expiry-Reminders] Found ${expiringUsers.length} users with expiring subscriptions. Sending emails...`);
    let successfullySent = 0;

    for (const user of expiringUsers) {
      try {
        const expiryFormatted = new Date(user.expiresAt).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

        // HTML & Plain text email contents
        const subject = 'Action Required: Your subscription is expiring soon!';
        const plainText = `Hi ${user.name},\n\nYour premium subscription on Plans & Stripe Management System is expiring on ${expiryFormatted}.\n\nPlease log in to renew your subscription and avoid interruptions in service.\n\nBest regards,\nPlans & Stripe Management Team`;
        const htmlContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 8px;">
            <h2 style="color: #4f46e5; margin-bottom: 20px;">Subscription Expiry Reminder</h2>
            <p>Hi <strong>${user.name}</strong>,</p>
            <p>This is a friendly reminder that your premium subscription is scheduled to expire on <strong>${expiryFormatted}</strong>.</p>
            <p>To avoid service interruptions or losing premium status, please renew your subscription via the dashboard.</p>
            <br />
            <p style="color: #64748b; font-size: 12px; border-t: 1px solid #e2e8f0; padding-top: 15px; margin-top: 20px;">
              Best regards,<br />
              <strong>Plans & Stripe Management Team</strong>
            </p>
          </div>
        `;

        await sendEmail({
          email: user.email,
          subject,
          message: plainText,
          html: htmlContent,
        });

        // Set reminderSent to true to avoid duplicate emails
        user.reminderSent = true;
        await user.save();

        successfullySent++;
        console.log(`[Cron: Expiry-Reminders] Reminder email dispatched to: ${user.email}`);
      } catch (emailErr) {
        // Individual email failure shouldn't crash the loop or script
        console.error(`[Cron: Expiry-Reminders] Failed sending email to ${user.email}:`, emailErr.message);
      }
    }

    console.log(`[Cron: Expiry-Reminders] Finished processing. Dispatched ${successfullySent} of ${expiringUsers.length} reminders.`);
    return { sentCount: successfullySent };
  } catch (err) {
    console.error('[Cron: Expiry-Reminders] General job failure:', err);
    throw err;
  }
};

module.exports = sendExpiryReminders;
