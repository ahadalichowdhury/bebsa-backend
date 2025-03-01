const express = require('express');
const router = express.Router();
const { 
    createCustomer,
    getPersonalCustomers ,
    updateCustomer,
    deleteCustomer,
    downloadPdfCustomers,
    getMobileAccountByCompany
} = require('../Controllers/Credit');

/**
 * @route   POST /api/customers
 * @desc    Create a new customer
 * @access  Private
 */
router.post('/credit', createCustomer);

/**
 * @route   GET /api/customers/personal
 * @desc    Get all Bkash Personal and Nagad Personal customers
 * @access  Private
 */
router.get('/credit/personal', getPersonalCustomers);

/**
 * @route   PUT /api/customers/:id
 * @desc    Update a customer
 * @access  Private
 */
router.put('/credit/:id', updateCustomer);

/**
 * @route   DELETE /api/customers/:id
 * @desc    Delete a customer
 * @access  Private
 */
router.delete('/credit/:id', deleteCustomer);

/**
 * @route   GET /api/customers/download-pdf
 * @desc    Download PDF of customers
 * @access  Private
 */
router.get('/credit/download-pdf', downloadPdfCustomers);

router.get('/credit/account-datas',getMobileAccountByCompany );

module.exports = router; 