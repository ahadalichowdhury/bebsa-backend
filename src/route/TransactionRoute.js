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

router.delete('/transactions/:transactionId', transactionController.deleteTransaction)
router.put('/transactions/:transactionId', transactionController.editTransaction)
router.delete('/transactions/users/:userId', transactionController.deleteUser)
router.put('/transactions/users/:userId', transactionController.updateUser)

module.exports = router
