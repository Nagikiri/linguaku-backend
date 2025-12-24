/**
 * User Routes
 * Routes for user profile management and statistics
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getUserStatistics,
  updateProfile,
  changePassword,
  getProfile
} = require('../controllers/userController');

// All routes require authentication
router.use(protect);

// GET /api/user/profile - Get current user profile
router.get('/profile', getProfile);

// GET /api/user/statistics - Get user statistics (for profile header)
router.get('/statistics', getUserStatistics);

// PUT /api/user/profile - Update user profile
router.put('/profile', updateProfile);

// POST /api/user/change-password - Change password
router.post('/change-password', changePassword);

module.exports = router;
