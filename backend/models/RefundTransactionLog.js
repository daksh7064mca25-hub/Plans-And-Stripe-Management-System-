const mongoose = require('mongoose');

const refundTransactionLogSchema = new mongoose.Schema(
  {
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      required: true,
    },
    refund: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Refund',
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    amountReversed: {
      type: Number,
      required: true,
    },
    transactionType: {
      type: String,
      enum: ['OwnerReversal', 'EmployeeReversal'],
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Indexes
refundTransactionLogSchema.index({ owner: 1 });
refundTransactionLogSchema.index({ employee: 1 });
refundTransactionLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('RefundTransactionLog', refundTransactionLogSchema);
