const mongoose = require('mongoose')

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DueUser',
    required: true,
  }, // Reference to User
  date: { type: Date, default: Date.now }, // Transaction Date
  given: { type: Number, default: 0 }, // Amount given
  taken: { type: Number, default: 0 }, // Amount taken
  balance: { type: Number, required: true }, // Running balance after transaction
  notes: { type: String, default: '' }, // 🆕 Notes field
})

const Transaction = mongoose.model('Transaction', transactionSchema)
module.exports = Transaction
