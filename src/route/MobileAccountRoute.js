const express = require('express');
const router = express.Router();
const mobileAccountController = require('../Controllers/MobileAccount');

router.post('/mobileAccounts', mobileAccountController.createMobileAccount);
router.get('/mobileAccounts', mobileAccountController.getAllMobileAccounts);
router.put('/mobileAccounts/:id', mobileAccountController.updateMobileAccount);
router.delete('/mobileAccounts/:id', mobileAccountController.deleteMobileAccount);
router.get('/mobileAccounts/today-log', mobileAccountController.getTodayLog);
router.get('/mobileAccounts/company', mobileAccountController.getMobileAccountByCompany);
module.exports = router;
