const mongoose = require('mongoose');

const refundSchema = new mongoose.Schema(
  {
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      required: true,
    },
    stripeRefundId: {
      type: String,
      required: true,
      unique: true,
    },
    stripePaymentIntentId: {
      type: String,
      required: true,
    },
    refundAmount: {
      type: Number,
      required: true,
    },
    refundType: {
      type: String,
      enum: ['Full', 'Partial'],
      required: true,
    },
    refundReason: {
      type: String,
      default: 'requested_by_customer',
    },
    refundStatus: {
      type: String,
      required: true,
      default: 'succeeded',
    },
    refundedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    affectedEmployees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes
refundSchema.index({ payment: 1 });
refundSchema.index({ refundedBy: 1 });
refundSchema.index({ owner: 1 });
refundSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Refund', refundSchema);
