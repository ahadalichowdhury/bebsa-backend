const express = require("express");
const router = express.Router();
const customerController = require("../Controllers/Customer");

// Define routes
router.post("/customers", customerController.createCustomer);
router.get("/customers", customerController.getAllCustomers);
router.get("/customers/search", customerController.searchCustomer);
router.get("/customers/:id", customerController.getCustomerById);
router.put("/customers/:id", customerController.updateCustomer);
router.delete("/customers/:id", customerController.deleteCustomer);

module.exports = router;
