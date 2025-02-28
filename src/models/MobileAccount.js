const mongoose = require('mongoose');

const mobileAccountSchema = new mongoose.Schema(
  {
    selectCompany: {
      type: String,
      required: [true, 'Company selection is required'],
      trim: true,
      enum: [
        'Bkash Personal',
        'Bkash Agent',
        'Nagad Personal',
        'Nagad Agent',
        'Rocket Personal',
        'Rocket Agent',
        'Others',
      ],
    },
    mobileNumber: {
      type: String,
      required: [true, 'Customer number is required'],
      trim: true,
    },
    totalAmount: {
      type: Number,
      trim: true,
      default: 0,
    },
  },
  {
    timestamps: true, // This will add createdAt and updatedAt fields automatically
  }
)


const mobileAccount = mongoose.model('mobileAccount', mobileAccountSchema);

module.exports = mobileAccount;