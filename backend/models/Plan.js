const mongoose = require('mongoose');

const planSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a plan name'],
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
    },
    monthlyPrice: {
      type: Number,
      required: [true, 'Please add a monthly price'],
      min: [0, 'Price cannot be negative'],
    },
    yearlyPrice: {
      type: Number,
      required: [true, 'Please add a yearly price'],
      min: [0, 'Price cannot be negative'],
    },
    features: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Plan', planSchema);
