const Customer = require('../models/Credit')
const MobileAccount = require('../models/MobileAccount')

exports.createCustomer = async (req, res) => {
  try {
    const {
      customerName,
      customerNumber,
      company,
      selectedAccount,
      selectedNumber,
      newAmount,
      remarks,
      entryBy, // Get entryBy from request body
    } = req.body

    // Validate required fields
    const missingFields = []
    if (!customerName) missingFields.push('customerName')
    if (!customerNumber) missingFields.push('customerNumber')
    if (!company) missingFields.push('company')
    if (!selectedNumber) missingFields.push('selectedNumber')
    if (!entryBy) missingFields.push('entryBy') // Ensure entryBy is present
    if (!selectedAccount) missingFields.push('selectedAccount')

    if (missingFields.length) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        requiredFields: missingFields,
      })
    }

    // Ensure company is valid
    const allowedCompanies = [
      'Bkash Personal',
      'Bkash Agent',
      'Nagad Personal',
      'Nagad Agent',
      'Rocket Personal',
      'Rocket Agent',
      'Others',
    ]
    if (!allowedCompanies.includes(company.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid company value',
        allowedValues: allowedCompanies,
      })
    }

    // Validate entryBy field
    const allowedUsers = ['Rony', 'Rajib']
    if (!allowedUsers.includes(entryBy.trim())) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized user for entryBy',
        allowedUsers,
      })
    }

    // // Check for duplicate customer number
    // const existingCustomer = await Customer.findOne({ customerNumber: customerNumber.trim() });
    // if (existingCustomer) {
    //     return res.status(409).json({
    //         success: false,
    //         message: 'Customer number already exists',
    //         customerNumber
    //     });
    // }

    // Create new customer with sanitized input
    const newCustomer = await Customer.create({
      customerName: customerName.trim(),
      customerNumber: customerNumber.trim(),
      company: company.trim(),
      selectedAccount: selectedAccount.trim(),
      selectedNumber: selectedNumber.trim(),
      newAmount: typeof newAmount === 'number' ? newAmount : 0,
      remarks: remarks ? remarks : 0,
      entryBy: entryBy.trim(), // Use entryBy from request body
    })

    // Update mobile account total amount
    const mobileAccount = await MobileAccount.findOne({
      mobileNumber: selectedAccount,
    })
    //   console.log(mobileAccount);
    if (mobileAccount) {
      mobileAccount.totalAmount = (mobileAccount.totalAmount || 0) + newAmount
      await mobileAccount.save()
    }

    // Send success response
    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: newCustomer,
    })
  } catch (error) {
    console.error('Error in createCustomer:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error while creating customer',
      error: process.env.NODE_ENV === 'development' ? error.message : {},
    })
  }
}

exports.updateCustomer = async (req, res) => {
  try {
    const { id } = req.params // Get customer ID from params
    const {
      customerName,
      customerNumber,
      company,
      selectedAccount,
      selectedNumber,
      newAmount,
      remarks,
      entryBy,
    } = req.body

    // Find the customer by ID
    let customer = await Customer.findById(id)
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      })
    }

    // Validate required fields
    if (
      !customerName ||
      !customerNumber ||
      !company ||
      !selectedNumber ||
      !entryBy ||
      !selectedAccount
    ) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        requiredFields: [
          'customerName',
          'customerNumber',
          'company',
          'selectedNumber',
          'entryBy',
          'selectedAccount',
        ],
      })
    }

    // Ensure company is valid
    const allowedCompanies = [
      'Bkash Personal',
      'Bkash Agent',
      'Nagad Personal',
      'Nagad Agent',
      'Rocket Personal',
      'Rocket Agent',
      'Others',
    ]
    if (!allowedCompanies.includes(company.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid company value',
        allowedValues: allowedCompanies,
      })
    }

    // Validate entryBy field
    const allowedUsers = ['Rony', 'Rajib']
    if (!allowedUsers.includes(entryBy.trim())) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized user for entryBy',
        allowedUsers,
      })
    }

    // Check if customerNumber is unique (excluding the current customer)
    const existingCustomer = await Customer.findOne({
      customerNumber: customerNumber.trim(),
      _id: { $ne: id },
    })
    if (existingCustomer) {
      return res.status(409).json({
        success: false,
        message: 'Customer number already exists',
        customerNumber,
      })
    }

    // Update the mobile account total amount if `newAmount` is changed
    if (newAmount !== undefined && typeof newAmount === 'number') {
      const mobileAccount = await MobileAccount.findOne({
        mobileNumber: selectedAccount,
      })

      if (mobileAccount) {
        // Adjust the total amount
        const amountDifference = newAmount - (customer.newAmount || 0)
        mobileAccount.totalAmount =
          (mobileAccount.totalAmount || 0) + amountDifference
        await mobileAccount.save()
      }
    }

    // Update customer details
    customer.customerName = customerName.trim()
    customer.customerNumber = customerNumber.trim()
    customer.company = company.trim()
    customer.selectedAccount = selectedAccount.trim()
    customer.selectedNumber = selectedNumber.trim()
    customer.newAmount =
      typeof newAmount === 'number' ? newAmount : customer.newAmount
    customer.remarks = remarks ? remarks : customer.remarks
    customer.entryBy = entryBy.trim()

    await customer.save()

    res.status(200).json({
      success: true,
      message: 'Customer updated successfully',
      data: customer,
    })
  } catch (error) {
    console.error('Error in updateCustomer:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error while updating customer',
      error: process.env.NODE_ENV === 'development' ? error.message : {},
    })
  }
}

exports.deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params // Get customer ID from params

    // Find the customer by ID
    const customer = await Customer.findById(id)
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      })
    }

    // Get selected account details for mobile account update
    const selectedAccount = customer.selectedAccount
    const newAmount = customer.newAmount

    // Remove the customer from the database
    await Customer.findByIdAndDelete(id)

    // Update the mobile account total amount by subtracting the deleted customer's amount
    const mobileAccount = await MobileAccount.findOne({
      mobileNumber: selectedAccount,
    })
    if (mobileAccount) {
      mobileAccount.totalAmount = (mobileAccount.totalAmount || 0) - newAmount
      await mobileAccount.save()
    }

    // Send success response
    res.status(200).json({
      success: true,
      message: 'Customer deleted successfully',
    })
  } catch (error) {
    console.error('Error in deleteCustomer:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error while deleting customer',
      error: process.env.NODE_ENV === 'development' ? error.message : {},
    })
  }
}

exports.getPersonalCustomers = async (req, res) => {
  try {
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Search and filter parameters
    const { search, entryBy, company, sortBy, sortOrder, startDate, endDate } = req.query;

    // Base query for personal companies
    let query = {};

    // Company filter logic
    if (entryBy) {
      if (['Rony', 'Rajib'].includes(entryBy)) {
        query.entryBy = entryBy;
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid company filter. Allowed values: Rony, Rajib',
        });
      }
    } else {
      query.entryBy = { $in: ['Rony', 'Rajib'] };
    }

    if (company) {
      if (
        [
          'Bkash Personal',
          'Bkash Agent',
          'Nagad Personal',
          'Nagad Agent',
          'Rocket Personal',
          'Rocket Agent',
          'Others',
        ].includes(company)
      ) {
        query.company = company;
      } else {
        return res.status(400).json({
          success: false,
          message:
            'Invalid company filter. Allowed values: Bkash Personal, Nagad Personal or Rocket Personal ',
        });
      }
    } else {
      query.company = {
        $in: [
          'Bkash Personal',
          'Bkash Agent',
          'Nagad Personal',
          'Nagad Agent',
          'Rocket Personal',
          'Rocket Agent',
          'Others',
        ],
      };
    }

    // Add phone number search if provided
    if (search) {
      query.customerNumber = { $regex: search, $options: 'i' };
    }

    // Date Range Filter
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      // Adjust the start and end dates to cover full days
      start.setHours(0, 0, 0, 0); // Start of the day
      end.setHours(23, 59, 59, 999); // End of the day

      // Apply the date filter
      query.createdAt = { $gte: start, $lte: end };
    }

    // Prepare sort options
    const sortOptions = {};
    if (sortBy) {
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    } else {
      sortOptions.createdAt = -1; // Default sort by newest
    }

    // Get total count for pagination
    const totalCount = await Customer.countDocuments(query);

    // Calculate total amount and total remarks
    const allCustomers = await Customer.find(query);
    const totalAmount = allCustomers.reduce(
      (sum, customer) => sum + (customer.newAmount || 0),
      0
    );

    // Calculate total remarks
    const totalRemarks = allCustomers.reduce(
      (sum, customer) => sum + (customer.remarks || 0),
      0
    );
    

    // Execute main query with pagination for the response
    const customers = await Customer.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .populate('entryBy', 'name email');

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({
      success: true,
      message: 'Personal customers retrieved successfully',
      data: {
        customers,
        totalAmount, // Total sum of newAmount
        totalRemarks, // Total count of remarks
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
        },
      },
    });
  } catch (error) {
    console.error('Error in getPersonalCustomers:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching personal customers',
      error: process.env.NODE_ENV === 'development' ? error.message : {},
    });
  }
};


exports.downloadPdfCustomers = async (req, res) => {
  try {
    // Search and filter parameters
    const { search, entryBy, company, sortBy, sortOrder, startDate, endDate } =
      req.query

    // Base query for personal companies
    let query = {}

    // Company filter logic
    if (entryBy) {
      if (['Rony', 'Rajib'].includes(entryBy)) {
        query.entryBy = entryBy
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid company filter. Allowed values: Rony, Rajib',
        })
      }
    } else {
      query.entryBy = { $in: ['Rony', 'Rajib'] }
    }

    if (company) {
      if (
        [
          'Bkash Personal',
          'Bkash Agent',
          'Nagad Personal',
          'Nagad Agent',
          'Rocket Personal',
          'Rocket Agent',
          'Others',
        ].includes(company)
      ) {
        query.company = company
      } else {
        return res.status(400).json({
          success: false,
          message:
            'Invalid company filter. Allowed values: Bkash Personal, Nagad Personal',
        })
      }
    } else {
      query.company = {
        $in: [
          'Bkash Personal',
          'Bkash Agent',
          'Nagad Personal',
          'Nagad Agent',
          'Rocket Personal',
          'Rocket Agent',
          'Others',
        ],
      }
    }

    // Add phone number search if provided
    if (search) {
      query.customerNumber = { $regex: search, $options: 'i' }
    }

    // Date Range Filter
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)

      // Adjust the start and end dates to cover full days
      start.setHours(0, 0, 0, 0) // Start of the day
      end.setHours(23, 59, 59, 999) // End of the day

      // Apply the date filter
      query.createdAt = { $gte: start, $lte: end }
    }

    // Prepare sort options
    const sortOptions = {}
    if (sortBy) {
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1
    } else {
      sortOptions.createdAt = -1 // Default sort by newest
    }

    // Get total count for pagination
    const totalCount = await Customer.countDocuments(query)

    // Execute main query with pagination
    const customers = await Customer.find(query).populate(
      'entryBy',
      'name email'
    )

    // Calculate the total sum of the `newAmount` field
    const totalAmount = customers.reduce(
      (sum, customer) => sum + customer.newAmount,
      0
    )

    res.status(200).json({
      success: true,
      message: 'Personal customers retrieved successfully',
      data: {
        customers,
        totalAmount,
      },
    })
  } catch (error) {
    console.error('Error in getPersonalCustomers:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching personal customers',
      error: process.env.NODE_ENV === 'development' ? error.message : {},
    })
  }
}

exports.getMobileAccountByCompany = async (req, res) => {
  console.log(req.query);
  try {
    const {
      selectCompany, // Should be company
      selectedNumber,
      page = 1,
      limit = 10,
      startDate,
      endDate,
    } = req.query;

    // Convert page & limit to numbers
    const pageNumber = parseInt(page, 10) || 1;
    const limitNumber = parseInt(limit, 10) || 10;
    const skip = (pageNumber - 1) * limitNumber;

    // Build query object
    let query = {};

    if (selectCompany) {
      query.company = selectCompany; // Corrected field name
    }

    if (selectedNumber) {
      query.selectedAccount = selectedNumber;
    }

    // Date range filtering
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      start.setHours(0, 0, 0, 0); // Start of the day
      end.setHours(23, 59, 59, 999); // End of the day

      query.createdAt = { $gte: start, $lte: end };
    }

    // Get total count for pagination
    const totalCount = await Customer.countDocuments(query); // Changed to 'Credit'

    // Fetch filtered and paginated results
    const accounts = await Customer.find(query) // Changed to 'Credit'
      .sort({ createdAt: -1 }) // Default sorting by newest
      .skip(skip)
      .limit(limitNumber);

    // Calculate total pages
    const totalPages = Math.ceil(totalCount / limitNumber);

    res.status(200).json({
      success: true,
      data: accounts, // Always return an array, even if empty
      pagination: {
        currentPage: pageNumber,
        totalPages,
        totalCount,
        limit: limitNumber,
      },
    });
  } catch (error) {
    console.error("Error in getMobileAccountByCompany:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


