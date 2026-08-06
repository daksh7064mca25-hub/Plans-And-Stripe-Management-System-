const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plan',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['Succeeded', 'Failed'],
      required: true,
    },
    stripePaymentIntentId: {
      type: String,
      required: true,
      unique: true,
    },
    billingPeriod: {
      type: String,
      enum: ['monthly', 'yearly'],
      required: true,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    refundStatus: {
      type: String,
      enum: ['None', 'Partial', 'Full'],
      default: 'None',
    },
    refundedAmount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ userId: 1 });
paymentSchema.index({ paymentDate: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
