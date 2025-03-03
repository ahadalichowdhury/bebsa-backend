const Customer = require('../models/Credit')
const MobileAccount = require('../models/MobileAccount')
const Debit = require('../models/Debit')
const Credit = require('../models/Credit')
const mongoose = require('mongoose')
exports.createCustomer = async (req, res) => {
  try {
    const {
      customerName,
      customerNumber,
      company,
      selectedAccount,
      //totalBalance,
      newAmount,
      remarks,
      entryBy, // Get entryBy from request body
    } = req.body

    // Validate required fields
    const missingFields = []
    if (!customerName) missingFields.push('customerName')
    if (!customerNumber) missingFields.push('customerNumber')
    if (!company) missingFields.push('company')
    //if (!totalBalance) missingFields.push('totalBalance')
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
      newAmount: typeof newAmount === 'number' ? newAmount : 0,
      remarks: remarks ? remarks : 0,
      entryBy: entryBy.trim(), // Use entryBy from request body
      isCredit: true, // Assume customer has credit by default
    })

    // Update mobile account total amount
    const mobileAccount = await MobileAccount.findOne({
      selectCompany: company.trim(),
      mobileNumber: selectedAccount,
    })
    //   console.log(mobileAccount);
    if (mobileAccount) {
      mobileAccount.totalAmount = (mobileAccount.totalAmount || 0) + newAmount
      //save total amount in credit schema also
      newCustomer.totalBalance = mobileAccount.totalAmount || 0
      await newCustomer.save()
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
      totalBalance,
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
      !totalBalance ||
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
          'totalBalance',
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
    customer.totalBalance = totalBalance.trim()
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
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

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
            'Invalid company filter. Allowed values: Bkash Personal, Nagad Personal or Rocket Personal ',
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

    // Calculate total amount and total remarks
    const allCustomers = await Customer.find(query)
    const totalAmount = allCustomers.reduce(
      (sum, customer) => sum + (customer.newAmount || 0),
      0
    )

    // Calculate total remarks
    const totalRemarks = allCustomers.reduce(
      (sum, customer) => sum + (customer.remarks || 0),
      0
    )

    // Execute main query with pagination for the response
    const customers = await Customer.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .populate('entryBy', 'name email')

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit)

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
  // console.log(req.query)
  try {
    const { selectCompany, selectedNumber, startDate, endDate } = req.query

    // Build query object
    let query = {}
    if (selectCompany) {
      query.company = selectCompany
    }
    if (selectedNumber) {
      query.selectedAccount = selectedNumber
    }

    // Date range filtering
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      start.setHours(0, 0, 0, 0) // Start of the day
      end.setHours(23, 59, 59, 999) // End of the day
      query.createdAt = { $gte: start, $lte: end }
    }

    // Fetch ALL results from both collections for balance calculation
    // We need all transactions to calculate running balance correctly
    let allCredits = await Customer.find(query).sort({ createdAt: 1 }) // Oldest first for calculation
    let allDebits = await Debit.find(query).sort({ createdAt: 1 })

    // Add isCredit field

    // Merge and sort results by createdAt in ASCENDING order for balance calculation
    let combinedResults = [...allCredits, ...allDebits].sort(
      (a, b) => a.createdAt - b.createdAt
    )

    // Now sort in DESCENDING order for display (newest first)
    combinedResults.sort((a, b) => b.createdAt - a.createdAt)

    res.status(200).json({
      success: true,
      data: combinedResults, // Now includes balance field
    })
  } catch (error) {
    console.error('Error in getMobileAccountByCompany:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    })
  }
}

exports.getMobileAccountByCompanyDelete = async (req, res) => {
  try {
    const { id, isCredit, selectedCompany, selectedAccount } = req.body
    console.log(id, isCredit, selectedCompany, selectedAccount)

    // Check if id exists and is a valid ObjectId
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format',
      })
    }

    if (isCredit) {
      console.log(isCredit)
      const credit = await Credit.findById(id)
      if (!credit) {
        return res.status(404).json({
          success: false,
          message: 'Credit not found',
        })
      }

      const account = await MobileAccount.findOne({
        selectCompany: selectedCompany,
        mobileNumber: selectedAccount,
      })

      if (account) {
        account.totalAmount -= credit.newAmount
        await account.save()
      }

      // Use deleteOne() instead of remove()
      await Credit.deleteOne({ _id: id })
    } else {
      const debit = await Debit.findById(id)
      if (!debit) {
        return res.status(404).json({
          success: false,
          message: 'Debit not found',
        })
      }

      const account = await MobileAccount.findOne({
        selectCompany: selectedCompany,
        mobileNumber: selectedAccount,
      })

      if (account) {
        account.totalAmount += debit.amount
        await account.save()
      }

      // Use deleteOne() instead of remove()
      await Debit.deleteOne({ _id: id })
    }

    res.status(200).json({
      success: true,
      message: 'Customer deleted successfully', // Note: Changed from res.message which might be undefined
    })
  } catch (error) {
    console.error('Error in getMobileAccountByCompanyDelete:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    })
  }
}
