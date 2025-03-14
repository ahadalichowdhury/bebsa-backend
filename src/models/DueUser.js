const mongoose = require("mongoose");

const fueUserSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    mobileNumber: {
      type: String,
      required: [true, 'Customer number is required'],
      trim: true,
    },
    totalGiven: { type: Number, default: 0 }, // Total amount given
    totalTaken: { type: Number, default: 0 }, // Total amount taken
    dueBalance: { type: Number, default: 0 }, // Remaining balance
  },
  {
    timestamps: true, // This will add createdAt and updatedAt fields automatically
  }
)

const dueUser = mongoose.model('DueUser', fueUserSchema)

module.exports = dueUser
