const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./auth/routes/authRoutes');
const bookwareRoutes = require('./ware/routes/bookRoutes.js')

// Create Express app
const app = express();

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request bodies

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dongbang_reservation';

mongoose.connect(MONGODB_URI)
.then(() => console.log('MongoDB connected successfully'))
.catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/ware', bookwareRoutes);

// Basic error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: '서버 내부 오류가 발생했습니다.',
    error: process.env.NODE_ENV === 'production' ? {} : err.message
  });
});

// Server configuration
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || 'localhost';

// Start server
app.listen(PORT, HOST, () => {
  console.log(`서버가 http://${HOST}:${PORT}에서 실행 중입니다.`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  mongoose.connection.close(() => {
    console.log('MongoDB 연결이 종료되었습니다.');
    process.exit(0);
  });
});

module.exports = app;