// ============================================
// FILE: routes/progressRoutes.js
// ============================================

const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getProgressByLevel,
  getStatistics
} = require('../controllers/progressController');
const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// @route   GET /api/progress/stats
// @desc    Get dashboard statistics (7 days, weekly, all-time, recent activity)
// @access  Private
router.get('/stats', getDashboardStats);

// @route   GET /api/progress/statistics
// @desc    Get COMPLETE statistics untuk GRAFIK PROGRES (ENDPOINT SEMPURNA)
// @access  Private
router.get('/statistics', getStatistics);

// @route   GET /api/progress/by-level
// @desc    Get progress breakdown by material level
// @access  Private
router.get('/by-level', getProgressByLevel);

module.exports = router;
