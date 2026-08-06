const mongoose = require('mongoose');

const revenueSettingsSchema = new mongoose.Schema(
  {
    mode: {
      type: String,
      enum: ['Equal', 'Percentage'],
      default: 'Percentage',
      required: true,
    },
    ownerPercentage: {
      type: Number,
      default: 70,
      min: 0,
      max: 100,
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('RevenueSettings', revenueSettingsSchema);
