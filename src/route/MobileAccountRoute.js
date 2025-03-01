const express = require('express');
const router = express.Router();
const mobileAccountController = require('../Controllers/MobileAccount');

router.post('/mobileAccounts', mobileAccountController.createMobileAccount);
router.get('/mobileAccounts', mobileAccountController.getAllMobileAccounts);
router.put('/mobileAccounts/:id', mobileAccountController.updateMobileAccount);
router.delete('/mobileAccounts/:id', mobileAccountController.deleteMobileAccount);
router.get('/mobileAccounts/today-log', mobileAccountController.getTodayLog);
router.get('/mobileAccounts/company', mobileAccountController.getMobileAccountByCompany);
router.get('/mobileAccounts/download-pdf', mobileAccountController.downloadAllMobileAccounts);
router.get('/mobileAccounts/account-datas', mobileAccountController.getAccountDatas);


module.exports = router;
