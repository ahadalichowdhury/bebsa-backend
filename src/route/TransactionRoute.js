const express = require('express')
const router = express.Router()
const transactionController = require('../Controllers/Transaction')

// Define routes
router.post('/transactions', transactionController.createUserAndTransaction)
router.get('/get-transactions', transactionController.getAllCustomersWithTransactions)
router.get('/due-history', transactionController.getTodaysTransactionHistory)
router.get('/transactions/:phone', transactionController.getTransaction)
router.post('/transactions/give/:phone', transactionController.giveTransaction)
router.post('/transactions/take/:phone', transactionController.takeTransaction)

module.exports = router
