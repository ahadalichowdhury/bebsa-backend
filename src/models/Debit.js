const mongoose = require('mongoose');

const debitSchema = new mongoose.Schema({
    company: {
        type: String,
        required: [true, 'Company selection is required'],
        trim: true,
        enum: [
            'Bkash Personal', 'Bkash Agent',
            'Nagad Personal', 'Nagad Agent',
            'Rocket Personal', 'Rocket Agent'
        ]
    },
    selectedAccount: {
        type: String,
        required: [true, 'Number selection is required'],
        trim: true
    },
    amount: {
        type: Number,
        required: [true, 'Debit amount is required'],
        default: 0
    },
    remarks: {
        type: String,
        trim: true
    },
    entryBy: {
        type: String,
        required: [true, 'Entry by user is required'],
        enum: ['ahad', 'aditto'] // Only 2 users can make entries
    },
    statement: {
        type: String,
        trim: true
    }
}, {
    timestamps: true // Automatically adds createdAt and updatedAt fields
});

const Debit = mongoose.model('Debit', debitSchema);

module.exports = Debit;
