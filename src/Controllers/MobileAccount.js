const MobileAccount = require("../models/MobileAccount");
const Debit = require("../models/Debit");
const Credit = require("../models/Credit");

exports.createMobileAccount = async (req, res) => {
  try {
    const { selectCompany, mobileNumber } = req.body;

    // Validate required fields
    if (!selectCompany || !mobileNumber) {
      return res.status(400).json({
        success: false,
        message: "Both selectCompany and mobileNumber are required",
      });
    }

    // Allowed companies
    const allowedCompanies = [
      "Bkash Personal",
      "Bkash Agent",
      "Nagad Personal",
      "Nagad Agent",
      "Rocket Personal",
      "Rocket Agent",
    ];
    if (!allowedCompanies.includes(selectCompany.trim())) {
      return res.status(400).json({
        success: false,
        message: "Invalid company selection",
        allowedValues: allowedCompanies,
      });
    }

    // Create mobile account
    const newAccount = await MobileAccount.create({
      selectCompany: selectCompany.trim(),
      mobileNumber: mobileNumber.trim(),
      totalAmount: 0,
    });

    res.status(201).json({
      success: true,
      message: "Mobile account created successfully",
      data: newAccount,
    });
  } catch (error) {
    console.error("Error creating mobile account:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.getAllMobileAccounts = async (req, res) => {
  try {


    // Date range filter
    const { startDate, endDate } = req.query;
    let query = {};

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      start.setHours(0, 0, 0, 0); // Start of the day
      end.setHours(23, 59, 59, 999); // End of the day

      query.createdAt = { $gte: start, $lte: end };
    }

    // Get total count for pagination
    const totalCount = await MobileAccount.countDocuments(query);

    // Calculate total sum for all records (independent of pagination)
    const allAccounts = await MobileAccount.find(query);
    const totalSum = allAccounts.reduce(
      (sum, account) => sum + account.totalAmount,
      0
    );

    // Fetch accounts with pagination
    const accounts = await MobileAccount.find(query)
      .sort({ createdAt: 1 })



    res.status(200).json({
      success: true,
      message: "Mobile accounts retrieved successfully",
      data: {
        accounts,
        totalSum,
      },
    });
  } catch (error) {
    console.error("Error fetching mobile accounts:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.downloadAllMobileAccounts = async (req, res) => {
  try {
    // Date range filter
    const { startDate, endDate } = req.query;
    let query = {};

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      start.setHours(0, 0, 0, 0); // Start of the day
      end.setHours(23, 59, 59, 999); // End of the day

      query.createdAt = { $gte: start, $lte: end };
    }

    // Fetch accounts with pagination
    const accounts = await MobileAccount.find(query).sort({ createdAt: -1 }); // Default sorting by newest

    // Calculate total sum of totalAmount from the response data
    const totalSum = accounts.reduce(
      (sum, account) => sum + account.totalAmount,
      0
    );

    res.status(200).json({
      success: true,
      message: "Mobile accounts retrieved successfully",
      data: {
        accounts,
        totalSum,
      },
    });
  } catch (error) {
    console.error("Error fetching mobile accounts:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.updateMobileAccount = async (req, res) => {
  try {
    const { selectCompany, mobileNumber } = req.body;

    // Allowed companies
    const allowedCompanies = ["Bkash Personal", "Nagad Personal"];
    if (selectCompany && !allowedCompanies.includes(selectCompany.trim())) {
      return res.status(400).json({
        success: false,
        message: "Invalid company selection",
        allowedValues: allowedCompanies,
      });
    }

    // Update account
    const updatedAccount = await MobileAccount.findByIdAndUpdate(
      req.params.id,
      {
        selectCompany: selectCompany?.trim(),
        mobileNumber: mobileNumber?.trim(),
      },
      { new: true, runValidators: true }
    );

    if (!updatedAccount) {
      return res.status(404).json({
        success: false,
        message: "Mobile account not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Mobile account updated successfully",
      data: updatedAccount,
    });
  } catch (error) {
    console.error("Error updating mobile account:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.deleteMobileAccount = async (req, res) => {
  console.log(req.params.id);
  try {
    const deletedAccount = await MobileAccount.findByIdAndDelete({
      _id: req.params.id,
    });

    if (!deletedAccount) {
      return res.status(404).json({
        success: false,
        message: "Mobile account not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Mobile account deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting mobile account:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.getTodayLog = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

  

    // Fetch debit and credit transactions separately
    const debits = await Debit.find({
      createdAt: { $gte: today, $lte: endOfDay },
    }).lean();
    const credits = await Credit.find({
      createdAt: { $gte: today, $lte: endOfDay },
    }).lean();

    // Calculate total debit and total credit amounts
    const totalDebit = debits.reduce((sum, d) => sum + d.amount, 0);
    const totalCredit = credits.reduce((sum, c) => sum + c.newAmount, 0);

    // Merge transactions with `isDebit` flag
    const transactions = [
      ...debits.map((d) => ({ ...d, isDebit: true })),
      ...credits.map((c) => ({ ...c, isDebit: false })),
    ];

    // Sort by createdAt (latest first)
    transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));



    res.status(200).json({
      success: true,
      message: "Today's transaction log retrieved successfully",
      data: {
        transactions: transactions,
        summary: {
          totalDebit,
          totalCredit,
        },
        
      },
    });
  } catch (error) {
    console.error("Error fetching today's log:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.getMobileAccountByCompany = async (req, res) => {
  try {
    const { selectCompany } = req.query;

    if (!selectCompany) {
      return res.status(400).json({
        success: false,
        message: "selectCompany query parameter is required",
      });
    }

    // Validate if selectCompany is one of the allowed values
    const allowedCompanies = ['Bkash Personal',
      'Bkash Agent',
      'Nagad Personal',
      'Nagad Agent',
      'Rocket Personal',
      'Rocket Agent',
      'Others'];
    if (!allowedCompanies.includes(selectCompany)) {
      return res.status(400).json({
        success: false,
        message: `Invalid selectCompany. Allowed values: ${allowedCompanies.join(
          ", "
        )}`,
      });
    }

    // Find records based on selectCompany
    const accounts = await MobileAccount.find({ selectCompany });

    res.status(200).json({
      success: true,
      data: accounts.length ? accounts : null,
    });
  } catch (error) {
    console.error("Error fetching mobile accounts:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

exports.getAccountDatas = async (req, res) => {
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
        $or: [{ selectCompany: regex }, { mobileNumber: regex }],
      };
    }

    // Query with filter, pagination, and sorting
    const accounts = await MobileAccount.find(filter)
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(pageSize);

    // Count total matching customers for pagination metadata
    const totalAccounts = await MobileAccount.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: accounts,
      pagination: {
        totalRecords: totalAccounts,
        totalPages: Math.ceil(totalAccounts / pageSize),
        currentPage: pageNumber,
        pageSize,
      },
    });
  } catch (error) {
    console.error("Error in getAccountDatas:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

