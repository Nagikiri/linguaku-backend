// ============================================
// FILE: routes/historyRoutes.js
// ============================================

const express = require('express');
const router = express.Router();
const {
  getPracticeHistory,
  deletePracticeFromHistory,
  clearHistory
} = require('../controllers/historyController');
const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// @route   GET /api/history
// @desc    Get user's practice history (max 5 recent, auto-archive old)
// @access  Private
router.get('/', getPracticeHistory);

// @route   DELETE /api/history/clear
// @desc    Clear all history for user
// @access  Private
router.delete('/clear', clearHistory);

// @route   DELETE /api/history/:id
// @desc    Delete specific practice from history
// @access  Private
router.delete('/:id', deletePracticeFromHistory);

module.exports = router;
