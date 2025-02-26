const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
    },
    mobileNumber: {
      type: String,
      required: [true, "Customer number is required"],
      trim: true,
    },
  },
  {
    timestamps: true, // This will add createdAt and updatedAt fields automatically
  }
);

const Customer = mongoose.model("Customer", customerSchema);

module.exports = Customer;
