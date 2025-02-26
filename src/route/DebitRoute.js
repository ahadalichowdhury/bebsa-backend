const express = require('express');
const router = express.Router();
const { 
    createDebit,
    deleteDebit,
    updateDebit
} = require('../Controllers/Debit');

router.post('/debit', createDebit);

router.delete('/debit/:id', deleteDebit);

router.put('/debit/:id', updateDebit);


module.exports = router;