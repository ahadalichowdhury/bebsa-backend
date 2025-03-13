const express = require('express')
const router = express.Router()
const transactionController = require('../Controllers/Transaction')

// Define routes
router.get('/transactions/:phone', transactionController.getTransaction)
router.post('/transactions/give/:phone', transactionController.giveTransaction)
router.post('/transactions/take/:phone', transactionController.takeTransaction)

module.exports = router
