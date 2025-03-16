const User = require('../models/DueUser')
const Transaction = require('../models/Transaction')

/** 🔵 Get today's transaction history with total given and total taken */
exports.getTodaysTransactionHistory = async (req, res) => {
  try {
    // Get the current date
    const today = new Date()

    // Set the start of the day (midnight) for filtering
    const startOfDay = new Date(today.setHours(0, 0, 0, 0))

    // Set the end of the day (11:59:59 PM) for filtering
    const endOfDay = new Date(today.setHours(23, 59, 59, 999))

    // Fetch all transactions that occurred today
    const transactions = await Transaction.find({
      date: { $gte: startOfDay, $lt: endOfDay },
    })
      .sort({ date: 1 })
      .populate('user')
      .exec()
    console.log(transactions)

    // If there are no transactions for today
    if (transactions.length === 0) {
      return res
        .status(404)
        .json({ message: 'No transactions found for today.' })
    }

    // Calculate total given and total taken for today's transactions
    const totalGivenToday = transactions.reduce(
      (sum, transaction) => sum + transaction.given,
      0
    )
    const totalTakenToday = transactions.reduce(
      (sum, transaction) => sum + transaction.taken,
      0
    )

    // Send the response with transactions and total amounts
    res.json({
      transactions,
      totalGivenToday,
      totalTakenToday,
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}


/** 🔵 Get all customers with transaction history (with search by name or number and total due balance calculation) */
exports.getAllCustomersWithTransactions = async (req, res) => {
  try {
    const { search } = req.query
    let filter = {}

    if (search) {
      filter = {
        $or: [
          { customerName: { $regex: search, $options: 'i' } },
          { mobileNumber: { $regex: search, $options: 'i' } },
        ],
      }
    }

    const customers = await User.find(filter).lean()
    const customersWithTransactions = await Promise.all(
      customers.map(async (customer) => {
        const transactions = await Transaction.find({
          user: customer._id,
        }).sort({ date: 1 })
        return { ...customer, transactions }
      })
    )

    // Calculate total due balance based on filter
    const totalDueBalance = customers.reduce(
      (sum, customer) => sum + customer.dueBalance,
      0
    )

    res.json({ totalDueBalance, customers: customersWithTransactions })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.createUserAndTransaction = async (req, res) => {
  try {
    const { name, mobileNumber, amount, notes, dicchi } = req.body // 🆕 Accept user details and transaction type

    // Check if user already exists
    let user = await User.findOne({ mobileNumber })
    if (user) {
      return res.status(400).json({ success: false, message: 'User with this mobile number already exists' })
      // If user exists, update the total given/taken amount and save
    }

    if (!user) {
      // Create new user if not found
      user = new User({
        customerName: name,
        mobileNumber,
        totalGiven: 0,
        totalTaken: 0,
        dueBalance: 0,
      })
      await user.save()
    }

    // Determine transaction type
    let newBalance
    if (dicchi) {
      // Follow giveTransaction logic
      newBalance = user.dueBalance + amount
      user.totalGiven += amount
    } else {
      // Follow takeTransaction logic
      newBalance = user.dueBalance - amount
      user.totalTaken += amount
    }

    // Create transaction
    const transaction = new Transaction({
      user: user._id,
      given: dicchi ? amount : 0,
      taken: dicchi ? 0 : amount,
      balance: newBalance,
      notes,
    })

    await transaction.save()

    // Update user's dueBalance and save
    user.dueBalance = newBalance
    await user.save()

    res.json({ user, transaction })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

/** 🔵 Get user by phone (with transaction history) */
exports.getTransaction = async (req, res) => {
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

// 🔵 API to edit transaction
exports.editTransaction = async (req, res) => {
  try {
    const { transactionId } = req.params
    const { amount, notes, dicchi } = req.body // dicchi -> true for given, false for taken

    // Find transaction
    let transaction = await Transaction.findById(transactionId)
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' })

    // Find user
    let user = await User.findById(transaction.user)
    if (!user) return res.status(404).json({ message: 'User not found' })

    // Calculate the difference to adjust due balance
    let difference = 0

    if (dicchi) {
      // Editing a "given" transaction
      difference = amount - transaction.given
      transaction.given = amount
      transaction.taken = 0
    } else {
      // Editing a "taken" transaction
      difference = transaction.taken - amount
      transaction.given = 0
      transaction.taken = amount
    }

    // Update balance in transaction and user
    transaction.balance = user.dueBalance + difference
    transaction.notes = notes || transaction.notes
    await transaction.save()

    user.dueBalance += difference
    await user.save()

    res.json({ success: true, message: 'Transaction updated successfully', transaction })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.deleteTransaction = async (req, res) => {
  try {
    const { transactionId } = req.params;

    // Find the transaction
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

    // Find the user associated with this transaction
    const user = await User.findById(transaction.user);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Reverse the transaction effect
    if (transaction.given > 0) {
      // Decrease dueBalance because user "gave" money
      user.dueBalance -= transaction.given;
      user.totalGiven -= transaction.given;
    } else if (transaction.taken > 0) {
      // Increase dueBalance because user "took" money
      user.dueBalance += transaction.taken;
      user.totalTaken -= transaction.taken;
    }

    // Ensure values don't go negative
    user.totalGiven = Math.max(0, user.totalGiven);
    user.totalTaken = Math.max(0, user.totalTaken);
    user.dueBalance = Math.max(0, user.dueBalance); // Prevent negative balance

    // Save the updated user before deleting transaction
    await user.save();

    // Delete the transaction
    await transaction.deleteOne();

    res.json({ success: true, message: 'Transaction deleted successfully', updatedUser: user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


/** 🔵 Update user details */
exports.updateUser = async (req, res) => {
  try {
    const { name, mobileNumber } = req.body; // Fields to update
    
    const user = await User.findOne({ _id: req.params.userId });

    if (!user) return res.status(404).json({ message: 'User not found' });

    // Update fields
    if (name) user.customerName = name;
    if (mobileNumber) user.mobileNumber = mobileNumber;

    await user.save();

    res.json({ message: 'User updated successfully', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/** 🔴 Delete user and their transactions */
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.userId });

    if (!user) return res.status(404).json({ message: 'User not found' });

    // Delete all transactions related to this user
    await Transaction.deleteMany({ user: user._id });

    // Delete the user
    await user.deleteOne();

    res.json({ message: 'User and associated transactions deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
