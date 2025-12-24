// ============================================
// FILE: routes/healthRoutes.js
// Purpose: Health check endpoints for Railway and monitoring
// ============================================

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// ==========================================
// @desc    Health check endpoint
// @route   GET /api/health
// @access  Public
// ==========================================
router.get('/health', (req, res) => {
  const health = {
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      unit: 'MB'
    }
  };
  
  res.status(200).json(health);
});

// ==========================================
// @desc    Readiness check (for Railway)
// @route   GET /api/ready
// @access  Public
// ==========================================
router.get('/ready', (req, res) => {
  if (mongoose.connection.readyState === 1) {
    res.status(200).json({ 
      ready: true,
      database: 'Connected',
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(503).json({ 
      ready: false,
      database: 'Disconnected',
      timestamp: new Date().toISOString()
    });
  }
});

// ==========================================
// @desc    Simple ping endpoint
// @route   GET /api/ping
// @access  Public
// ==========================================
router.get('/ping', (req, res) => {
  res.status(200).json({ 
    message: 'pong',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
