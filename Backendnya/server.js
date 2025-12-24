// ============================================
// FILE: server.js (FIXED)
// LinguaKu Backend - Main Entry Point
// ============================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Initialize Express
const app = express();

// ==========================================
// PRODUCTION SECURITY MIDDLEWARE
// ==========================================
const isProduction = process.env.NODE_ENV === 'production';

// Trust proxy for Railway
if (isProduction) {
  app.set('trust proxy', 1);
}

// ==========================================
// MIDDLEWARE
// ==========================================

// CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, Railway health checks)
    if (!origin) return callback(null, true);
    
    // Allow localhost, CLIENT_URL, and Railway domains
    const allowedOrigins = [
      process.env.CLIENT_URL || 'http://localhost:8081',
      process.env.FRONTEND_URL || 'http://localhost:8081',
      'http://localhost:8081',
      'http://localhost:19000', // Expo dev server
      'http://localhost:19001', // Expo dev server
      'http://localhost:19002', // Expo dev server
      /\.railway\.app$/, // Allow all Railway domains
      /\.expo\.dev$/, // Allow Expo Go app
    ];
    
    // Check if origin matches any allowed origin
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        return allowed === origin;
      } else if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return false;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Passport configuration for Google OAuth (temporarily disabled for testing)
// const passport = require('./config/passport');
// app.use(passport.initialize());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Import Models
const User = require('./models/User');
const Practice = require('./models/Practice');
const Material = require('./models/Material');

// ==========================================
// IMPORT ROUTES
// ==========================================
const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const practiceRoutes = require('./routes/practiceRoutes');
const materialRoutes = require('./routes/materialRoutes');
const historyRoutes = require('./routes/historyRoutes');
const progressRoutes = require('./routes/progressRoutes');

// ==========================================
// TEST ROUTES
// ==========================================
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to LinguaKu API',
    version: '1.0.0',
    status: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// ==========================================
// MOUNT MAIN ROUTES
// ==========================================
app.use('/api', healthRoutes); // Health check routes
app.use('/api/auth', authRoutes);
app.use('/api/practice', practiceRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/user', require('./routes/userRoutes'));

// ==========================================
// ERROR HANDLERS
// ==========================================

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// ==========================================
// START SERVER
// ==========================================
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

// ==========================================
// STARTUP: Start server immediately for Railway health checks
// ==========================================
const startServer = async () => {
  // Step 1: Start Express server FIRST (for Railway health checks)
  console.info('Starting Express server...');
  const server = app.listen(PORT, HOST, () => {
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('LinguaKu Backend Server Started');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Port: ${PORT}`);
    console.log(`Health Check: /api/health`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
  });

  // Step 2: Connect to MongoDB in background (don't crash if fails)
  try {
    console.info('Connecting to MongoDB Atlas...');
    await connectDB();
    console.info('MongoDB connected successfully\n');

    // Step 3: Seed materials
    console.info('Seeding materials...');
    try {
      await Material.seedMaterials();
      console.info('Materials seeded successfully\n');
    } catch (seedError) {
      console.warn('Material seeding skipped:', seedError.message, '\n');
    }

    console.info('Server ready with database connection');
  } catch (error) {
    console.error('');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('WARNING: MongoDB Connection Failed');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('Reason:', error.message);
    console.error('');
    console.error('Server is running but database features unavailable.');
    console.error('Please check:');
    console.error('   1. MongoDB Atlas is accessible');
    console.error('   2. IP address is whitelisted (0.0.0.0/0 for Railway)');
    console.error('   3. MONGO_URI environment variable is correct');
    console.error('');
    console.error('Server will continue to respond to health checks.');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('');
    // DON'T exit - let server stay alive for Railway health checks
  }
};

startServer();