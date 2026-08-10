const nodemailer = require('nodemailer');

/**
 * Utility to send emails using nodemailer
 * @param {Object} options Options containing target address, subject, message, and optional html content
 */
const sendEmail = async (options) => {
  // Use mailtrap settings or default to development credentials
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'sandbox.smtp.mailtrap.io',
    port: parseInt(process.env.SMTP_PORT || '2525', 10),
    auth: {
      user: process.env.SMTP_EMAIL || '',
      pass: process.env.SMTP_PASSWORD || '',
    },
  });

  const mailOptions = {
    from: `"${process.env.FROM_NAME || 'Plans Management'}" <${process.env.FROM_EMAIL || 'no-reply@plans-stripe.com'}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
};

module.exports = sendEmail;
