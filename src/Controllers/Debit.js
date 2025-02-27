const Debit = require("../models/Debit"); // Import the Debit model
const MobileAccount = require("../models/MobileAccount");
exports.createDebit = async (req, res) => {
  try {
    const { company, selectedAccount, amount, remarks, statement, entryBy } =
      req.body;

    // Validate required fields
    const missingFields = [];
    if (!company) missingFields.push("company");
    if (!selectedAccount) missingFields.push("selectedAccount");
    if (!entryBy) missingFields.push("entryBy");

    if (missingFields.length) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
        requiredFields: missingFields,
      });
    }

    // Ensure company is valid
    const allowedCompanies = [
      "Bkash Personal",
      "Bkash Agent",
      "Nagad Personal",
      "Nagad Agent",
      "Rocket Personal",
      "Rocket Agent",
    ];
    if (!allowedCompanies.includes(company.trim())) {
      return res.status(400).json({
        success: false,
        message: "Invalid company value",
        allowedValues: allowedCompanies,
      });
    }

    // Validate entryBy field
    const allowedUsers = ["Rony", "Rajib"];
    if (!allowedUsers.includes(entryBy.trim())) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized user for entryBy",
        allowedUsers,
      });
    }

    // Create new debit entry
    const newDebit = await Debit.create({
      company: company.trim(),
      selectedAccount: selectedAccount.trim(),
      stockBalance: typeof stockBalance === "number" ? stockBalance : 0,
      amount: typeof amount === "number" ? amount : 0,
      remarks: remarks ? remarks.trim() : "",
      entryBy: entryBy.trim(),
      statement: statement ? statement.trim() : "",
    });

    // Update mobile account total amount
    const mobileAccount = await MobileAccount.findOne({
      mobileNumber: selectedAccount,
    });
    console.log(mobileAccount);
    if (mobileAccount) {
      mobileAccount.totalAmount = (mobileAccount.totalAmount || 0) - amount;
      await mobileAccount.save();
    }

    // Send success response
    res.status(201).json({
      success: true,
      message: "Debit entry created successfully",
      data: newDebit,
    });
  } catch (error) {
    console.error("Error in createDebit:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while creating debit entry",
      error: process.env.NODE_ENV === "development" ? error.message : {},
    });
  }
};

exports.updateDebit = async (req, res) => {
  try {
      const { id } = req.params; // Get debit entry ID from URL params
      const { company, selectedAccount, amount, remarks, statement, entryBy } = req.body;

      // Validate required fields
      const missingFields = [];
      if (!company) missingFields.push("company");
      if (!selectedAccount) missingFields.push("selectedAccount");
      if (!entryBy) missingFields.push("entryBy");

      if (missingFields.length) {
          return res.status(400).json({
              success: false,
              message: "Missing required fields",
              requiredFields: missingFields,
          });
      }

      // Ensure company is valid
      const allowedCompanies = [
          "Bkash Personal",
          "Bkash Agent",
          "Nagad Personal",
          "Nagad Agent",
          "Rocket Personal",
          "Rocket Agent",
      ];
      if (!allowedCompanies.includes(company.trim())) {
          return res.status(400).json({
              success: false,
              message: "Invalid company value",
              allowedValues: allowedCompanies,
          });
      }

      // Validate entryBy field
      const allowedUsers = ["Rony", "Rajib"];
      if (!allowedUsers.includes(entryBy.trim())) {
          return res.status(403).json({
              success: false,
              message: "Unauthorized user for entryBy",
              allowedUsers,
          });
      }

      // Find the existing debit entry
      const existingDebit = await Debit.findById(id);
      if (!existingDebit) {
          return res.status(404).json({
              success: false,
              message: "Debit entry not found",
          });
      }

      // Calculate the difference in amount to update the mobile account balance
      const amountDifference = amount - existingDebit.amount;

      // Update the debit entry
      existingDebit.company = company.trim();
      existingDebit.selectedAccount = selectedAccount.trim();
      existingDebit.amount = typeof amount === "number" ? amount : 0;
      existingDebit.remarks = remarks ? remarks.trim() : "";
      existingDebit.entryBy = entryBy.trim();
      existingDebit.statement = statement ? statement.trim() : "";

      await existingDebit.save();

      // Update the mobile account total amount based on the amount difference
      const mobileAccount = await MobileAccount.findOne({
          mobileNumber: selectedAccount,
      });
      if (mobileAccount) {
          mobileAccount.totalAmount = (mobileAccount.totalAmount || 0) - amountDifference;
          await mobileAccount.save();
      }

      // Send success response
      res.status(200).json({
          success: true,
          message: "Debit entry updated successfully",
          data: existingDebit,
      });
  } catch (error) {
      console.error("Error in updateDebit:", error);
      res.status(500).json({
          success: false,
          message: "Internal server error while updating debit entry",
          error: process.env.NODE_ENV === "development" ? error.message : {},
      });
  }
};

exports.deleteDebit = async (req, res) => {
  try {
      const { id } = req.params; // Get debit entry ID from URL params

      // Find the debit entry by ID
      const debitEntry = await Debit.findById(id);
      if (!debitEntry) {
          return res.status(404).json({
              success: false,
              message: "Debit entry not found",
          });
      }

      // Get the selected account and amount from the debit entry
      const selectedAccount = debitEntry.selectedAccount;
      const amount = debitEntry.amount;

      // Remove the debit entry
      await Debit.findByIdAndDelete(id);

      // Update the mobile account total amount by adding the debit entry's amount back
      const mobileAccount = await MobileAccount.findOne({
          mobileNumber: selectedAccount,
      });
      if (mobileAccount) {
          mobileAccount.totalAmount = (mobileAccount.totalAmount || 0) + amount;
          await mobileAccount.save();
      }

      // Send success response
      res.status(200).json({
          success: true,
          message: "Debit entry deleted successfully",
      });
  } catch (error) {
      console.error("Error in deleteDebit:", error);
      res.status(500).json({
          success: false,
          message: "Internal server error while deleting debit entry",
          error: process.env.NODE_ENV === "development" ? error.message : {},
      });
  }
};
