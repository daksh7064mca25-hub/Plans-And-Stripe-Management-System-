const mongoose = require('mongoose');

const dailyAnalyticsSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
      unique: true,
    },
    totalSuccessfulPayments: {
      type: Number,
      default: 0,
    },
    totalRefundAmount: {
      type: Number,
      default: 0,
    },
    netRevenue: {
      type: Number,
      default: 0,
    },
    activePremiumUsers: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexing date for fast analytical queries
dailyAnalyticsSchema.index({ date: -1 });

module.exports = mongoose.model('DailyAnalytics', dailyAnalyticsSchema);
