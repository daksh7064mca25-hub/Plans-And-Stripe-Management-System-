const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: [6, 'Password must be at least 6 characters'],
    },
    role: {
      type: String,
      enum: ['User', 'Admin', 'Owner', 'Employee'],
      default: 'User',
    },
    walletBalance: {
      type: Number,
      default: 0,
    },
    subscription: {
      planId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Plan',
        default: null,
      },
      status: {
        type: String,
        enum: ['Active', 'Past Due', 'Inactive'],
        default: 'Inactive',
      },
      billingPeriod: {
        type: String,
        enum: ['monthly', 'yearly'],
        default: null,
      },
      updatedAt: {
        type: Date,
        default: null,
      },
    },
    subscriptionStatus: {
      type: String,
      enum: ['Active', 'Past Due', 'Inactive', 'Expired'],
      default: 'Inactive',
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    reminderSent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ 'subscription.status': 1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
