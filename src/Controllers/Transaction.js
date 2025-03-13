const User = require("../models/Customer")
const Transaction = require("../models/Transaction")

/** 🔵 Get user by phone (with transaction history) */
 exports.getTransaction=async (req, res) => {
  try {
    const user = await User.findOne({ mobileNumber: req.params.phone })
    if (!user) return res.status(404).json({ message: 'User not found' })

    const transactions = await Transaction.find({ user: user._id }).sort({
      date: 1,
    })

    res.json({ ...user.toObject(), transactions })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
 }

exports.giveTransaction = async (req, res) => {
  try {
    const { amount, notes } = req.body // 🆕 Accept notes from request
    const user = await User.findOne({ mobileNumber: req.params.phone })

    if (!user) return res.status(404).json({ message: 'User not found' })

    // ✅ Fix: Increase dueBalance (not decrease)
    const newBalance = user.dueBalance + amount

    // Create transaction
    const transaction = new Transaction({
      user: user._id,
      given: amount,
      taken: 0,
      balance: newBalance,
      notes, // 🆕 Save notes in transaction
    })

    await transaction.save()

    // Update user totals
    user.totalGiven += amount
    user.dueBalance = newBalance
    await user.save()

    res.json(transaction)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}


/** 🔵 API to record "Take" transactions */
exports.takeTransaction = async (req, res) => {
  try {
    const { amount, notes } = req.body // 🆕 Accept notes from request
    const user = await User.findOne({ mobileNumber: req.params.phone })

    if (!user) return res.status(404).json({ message: 'User not found' })

    // Calculate new balance
    const newBalance = user.dueBalance - amount

    // Create transaction
    const transaction = new Transaction({
      user: user._id,
      given: 0,
      taken: amount,
      balance: newBalance,
      notes, // 🆕 Save notes in transaction
    })

    await transaction.save()

    // Update user totals
    user.totalTaken += amount
    user.dueBalance = newBalance
    await user.save()

    res.json(transaction)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

