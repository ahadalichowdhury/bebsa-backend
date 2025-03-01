const Customer = require("../models/Customer");

// Create a new customer
exports.createCustomer = async (req, res) => {
  try {
    const { customerName, mobileNumber } = req.body;

    // Validate required fields
    if (!customerName || !mobileNumber) {
      return res.status(400).json({
        success: false,
        message: "Customer name and mobile number are required",
      });
    }

    // Check if mobile number already exists
    const existingCustomer = await Customer.findOne({ mobileNumber });
    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: "Customer with this mobile number already exists",
      });
    }

    // Create new customer
    const newCustomer = await Customer.create({ customerName, mobileNumber });

    res.status(201).json({
      success: true,
      message: "Customer created successfully",
      data: newCustomer,
    });
  } catch (error) {
    console.error("Error in createCustomer:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : {},
    });
  }
};


// Get all customers
exports.getAllCustomers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query; // Default values for pagination and search query

    // Pagination settings
    const pageNumber = parseInt(page);
    const pageSize = parseInt(limit);
    const skip = (pageNumber - 1) * pageSize;

    // Create a filter based on search
    let filter = {};
    if (search) {
      const regex = new RegExp(search.trim(), "i"); // Case-insensitive search
      filter = {
        $or: [{ customerName: regex }, { mobileNumber: regex }],
      };
    }

    // Query with filter, pagination, and sorting
    const customers = await Customer.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize);

    // Count total matching customers for pagination metadata
    const totalCustomers = await Customer.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: customers,
      pagination: {
        totalRecords: totalCustomers,
        totalPages: Math.ceil(totalCustomers / pageSize),
        currentPage: pageNumber,
        pageSize,
      },
    });
  } catch (error) {
    console.error("Error in getAllCustomers:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


// Get a single customer by ID
exports.getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findById(id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    console.error("Error in getCustomerById:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Update customer details
exports.updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { customerName, mobileNumber } = req.body;

    // Validate input
    if (!customerName && !mobileNumber) {
      return res.status(400).json({
        success: false,
        message: "At least one field (customerName or mobileNumber) is required to update",
      });
    }

    // Find and update customer
    const updatedCustomer = await Customer.findByIdAndUpdate(
      id,
      { customerName, mobileNumber },
      { new: true, runValidators: true }
    );

    if (!updatedCustomer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Customer updated successfully",
      data: updatedCustomer,
    });
  } catch (error) {
    console.error("Error in updateCustomer:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Delete a customer
exports.deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    // Find and delete customer
    const deletedCustomer = await Customer.findByIdAndDelete(id);

    if (!deletedCustomer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Customer deleted successfully",
    });
  } catch (error) {
    console.error("Error in deleteCustomer:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

exports.searchCustomer = async (req, res) => {
  try {
    const { customer } = req.query;
    
    if (!customer) {
      return res.status(200).json({
        success: false,
        data: null,
      });
    }

    const regex = new RegExp(customer, "i"); // Case-insensitive regex search

    const customers = await Customer.find({  $or: [
      { customerName: { $regex: regex } },
      { mobileNumber: { $regex: regex } }
    ] });

    if (customers.length === 0) {
      return res.status(200).json({
        success: false,
        data: null,
      });
    }

    res.status(200).json({
      success: true,
      data: customers.length ? customers : null,
    });
  } catch (error) {
    console.error("Error searching for customer:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

