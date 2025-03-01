const express = require("express");
const router = express.Router();
const userController = require("../Controllers/User");

// Define routes
router.post("/user/register", userController.register);
router.post("/user/login", userController.login);
router.post("/user/verify", userController.verifyUser);
router.post("/user/decode", userController.decodeToken);
router.post("/user/reset-password", userController.resetPassword);

module.exports = router;
