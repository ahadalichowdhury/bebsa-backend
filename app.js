const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Import routes
const creditRoutes = require('./src/route/CreditRoute');
const debitRoutes = require('./src/route/DebitRoute');
const mobileAccountRoutes = require('./src/route/MobileAccountRoute');
const customerRoutes = require('./src/route/CustomerRoute');
// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bebsa')
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.log('MongoDB connection error:', err));

// Mount routes
app.use('/api', creditRoutes);
app.use('/api', debitRoutes);
app.use('/api', mobileAccountRoutes);
app.use('/api', customerRoutes);
// Base route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Bebsa API' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Server setup
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;