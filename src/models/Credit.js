const mongoose = require('mongoose');

const creditSchema = new mongoose.Schema({
    customerName: {
        type: String,
        required: [true, 'Customer name is required'],
        trim: true
    },
    customerNumber: {
        type: String,
        required: [true, 'Customer number is required'],
        trim: true
    },
    company: {
        type: String,
        required: [true, 'Company selection is required'],
        trim: true,
        enum: ['Bkash Personal', 'Bkash Agent', 'Nagad Personal', 'Nagad Agent', 'Rocket Personal', 'Rocket Agent', 'Others']
    },
    selectedAccount: {
        type: String,
        required: [true, 'Account selection is required'],
        trim: true
    },
    totalBalance: {
        type: String,
        required: [true, 'Number selection is required'],
        trim: true
    },
    newAmount: {
        type: Number,
        required: [true, 'Credit amount is required'],
        default: 0
    },
    remarks: {
        type: Number,
        trim: true
    },
    entryBy: {
        type: String,
        required: [true, 'Entry by user is required'],
        enum: ['Rony', 'Rajib']
    }
}, {
    timestamps: true // This will add createdAt and updatedAt fields automatically
});


const Credit = mongoose.model('Credit', creditSchema);

module.exports = Credit;