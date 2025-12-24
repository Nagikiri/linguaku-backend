/**
 * User Controller
 * Handles user profile management, statistics, and account settings
 */

const User = require('../models/User');
const Practice = require('../models/Practice');
const bcrypt = require('bcryptjs');
const { calculateStreak } = require('../utils/dateHelpers');

/**
 * GET /api/user/statistics
 * Get user statistics for profile header
 * Returns: totalPractices, averageScore, dayStreak
 */
const getUserStatistics = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all practices for this user
    const practices = await Practice.find({ userId })
      .select('score createdAt')
      .sort({ createdAt: -1 })
      .lean();

    // Calculate total practices
    const totalPractices = practices.length;

    // Calculate average score
    let averageScore = 0;
    if (totalPractices > 0) {
      const totalScore = practices.reduce((sum, p) => sum + p.score, 0);
      averageScore = Math.round(totalScore / totalPractices);
    }

    // Calculate day streak
    const practiceDates = practices.map(p => p.createdAt);
    const dayStreak = calculateStreak(practiceDates);

    res.json({
      success: true,
      data: {
        totalPractices,
        averageScore,
        dayStreak
      }
    });
  } catch (error) {
    console.error('Get user statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user statistics'
    });
  }
};

/**
 * PUT /api/user/profile
 * Update user profile (name, profile picture)
 */
const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, profilePicture } = req.body;

    // Validate name
    if (name !== undefined) {
      if (!name || name.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Name must be at least 2 characters'
        });
      }
      if (name.length > 50) {
        return res.status(400).json({
          success: false,
          message: 'Name must not exceed 50 characters'
        });
      }
    }

    // Build update object
    const updateData = {};
    if (name !== undefined) {
      updateData.name = name.trim();
    }
    if (profilePicture !== undefined) {
      updateData.profilePicture = profilePicture;
    }

    // Update user
    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
};

/**
 * POST /api/user/change-password
 * Change user password (requires current password)
 */
const changePassword = async (req, res) => {
  try {
    const userId = req.user._id;
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters'
      });
    }

    // Get user with password field
    const user = await User.findById(userId).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has password (not Google auth)
    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change password for Google accounts'
      });
    }

    // Verify current password
    const isPasswordMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    user.password = hashedPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully. Please login again.'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password'
    });
  }
};

/**
 * GET /api/user/profile
 * Get current user profile
 */
const getProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
};

module.exports = {
  getUserStatistics,
  updateProfile,
  changePassword,
  getProfile
};
