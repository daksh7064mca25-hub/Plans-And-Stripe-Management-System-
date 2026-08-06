const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // Check authorization header or cookies
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
    
    // Select user without password
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }
    next();
  } catch (error) {
    console.error('JWT Verification Error:', error.message);
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: `Access denied. Role '${req.user ? req.user.role : 'None'}' is unauthorized.` });
    }
    next();
  };
};

const requireSubscription = (req, res, next) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: 'Not authorized, no user session' });
  }

  // Admins bypass subscription checks to manage the system
  if (user.role === 'Admin') {
    return next();
  }

  const sub = user.subscription;
  if (!sub || !sub.planId) {
    return res.status(403).json({
      message: 'Access denied. Active subscription required to access this premium resource.',
      code: 'SUBSCRIPTION_REQUIRED',
    });
  }

  if (sub.status !== 'Active') {
    return res.status(403).json({
      message: `Access denied. Your subscription is currently ${sub.status}. Please make a payment.`,
      code: 'SUBSCRIPTION_INACTIVE',
    });
  }

  // Calculate dynamic expiration date
  const lastBilling = sub.updatedAt ? new Date(sub.updatedAt) : null;
  if (!lastBilling) {
    return res.status(403).json({
      message: 'Access denied. Invalid subscription billing date.',
      code: 'SUBSCRIPTION_INVALID',
    });
  }

  const expiryDate = new Date(lastBilling);
  if (sub.billingPeriod === 'monthly') {
    expiryDate.setDate(expiryDate.getDate() + 30);
  } else if (sub.billingPeriod === 'yearly') {
    expiryDate.setDate(expiryDate.getDate() + 365);
  }

  if (new Date() > expiryDate) {
    return res.status(403).json({
      message: 'Access denied. Your subscription has expired. Please renew.',
      code: 'SUBSCRIPTION_EXPIRED',
      expiryDate,
    });
  }

  next();
};

module.exports = {
  protect,
  authorize,
  requireSubscription,
};
