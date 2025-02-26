const mongoose = require('mongoose');

const mobileAccountSchema = new mongoose.Schema({
   selectCompany: {
    type: String,
    required: [true, 'Company selection is required'],
    trim: true,
    enum: ['Bkash Personal', 'Nagad Personal']
   },
    mobileNumber: {
        type: String,
        required: [true, 'Customer number is required'],
        trim: true
    },
    totalAmount: {
        type: Number,
        trim: true,
        default: 0
    },
}, {
    timestamps: true // This will add createdAt and updatedAt fields automatically
});


const mobileAccount = mongoose.model('mobileAccount', mobileAccountSchema);

module.exports = mobileAccount;