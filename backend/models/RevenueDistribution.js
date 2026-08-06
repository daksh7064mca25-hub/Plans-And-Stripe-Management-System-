const mongoose = require('mongoose');

const revenueDistributionSchema = new mongoose.Schema(
  {
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      required: true,
    },
    refundId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Refund',
      default: null,
    },
    type: {
      type: String,
      enum: ['Distribution', 'RefundReversal'],
      default: 'Distribution',
    },
    amount: {
      type: Number,
      required: true,
    },
    mode: {
      type: String,
      enum: ['Equal', 'Percentage'],
      required: true,
    },
    ownerShare: {
      type: Number,
      required: true,
    },
    employeeShareTotal: {
      type: Number,
      required: true,
    },
    employeeSharePerPerson: {
      type: Number,
      required: true,
    },
    splits: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        role: {
          type: String,
          enum: ['Owner', 'Employee'],
          required: true,
        },
        amount: {
          type: Number,
          required: true,
        },
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Optimize search queries on the nested splits array
revenueDistributionSchema.index({ 'splits.userId': 1 });
revenueDistributionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('RevenueDistribution', revenueDistributionSchema);
