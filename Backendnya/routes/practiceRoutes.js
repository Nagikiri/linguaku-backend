// ============================================
// FILE: routes/practiceRoutes.js
// ============================================

const express = require('express');
const router = express.Router();
const {
  analyzePronunciation,
  getPracticeHistory,
  getPracticeDetail,
  deletePractice,
  getWeeklyPerformance,
  getWeeklyInsight,
  getRecentActivity
} = require('../controllers/practiceController');
const { protect } = require('../middleware/authMiddleware');

// ==========================================
// SEMUA ROUTES BUTUH AUTHENTICATION
// ==========================================

// @route   POST /api/practice/analyze
// @desc    Analyze pronunciation from recognized text (Android Speech Recognition)
// @access  Private
router.post(
  '/analyze',
  protect,
  analyzePronunciation
);

// @route   GET /api/practice/history
// @desc    Get user's practice history
// @access  Private
router.get('/history', protect, getPracticeHistory);

// @route   GET /api/practice/weekly-performance
// @desc    Get weekly performance chart data (last 7 days)
// @access  Private
router.get('/weekly-performance', protect, getWeeklyPerformance);

// @route   GET /api/practice/weekly-insight
// @desc    Get weekly insight message
// @access  Private
router.get('/weekly-insight', protect, getWeeklyInsight);

// @route   GET /api/practice/recent
// @desc    Get recent activity (3 latest practices)
// @access  Private
router.get('/recent', protect, getRecentActivity);

// @route   DELETE /api/practice/:id
// @desc    Delete practice
// @access  Private
router.delete('/:id', protect, deletePractice);

// @route   GET /api/practice/:id
// @desc    Get single practice detail
// @access  Private
// NOTE: Must be LAST because it's a catch-all route
router.get('/:id', protect, getPracticeDetail);

module.exports = router;

