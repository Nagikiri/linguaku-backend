// ============================================
// FILE: controllers/historyController.js
// Tujuan: Handle history logic (max 5 recent practices)
// ============================================

const Practice = require('../models/Practice');
const Material = require('../models/Material');

// ==========================================
// @desc    Get user's practice history (max 5 recent)
// @route   GET /api/history
// @access  Private
// ==========================================
const getPracticeHistory = async (req, res) => {
  try {
    // Fetch ALL practices for this user (not limited to 10)
    const practices = await Practice.find({ userId: req.user.id })
      .populate('materialId', 'title level category')
      .sort({ createdAt: -1 })
      .select('score correctWords wrongWords totalWords createdAt itemText materialId feedback transcription');

    const totalCount = practices.length;
    

    res.status(200).json({
      success: true,
      count: totalCount,
      data: practices,
      message: totalCount === 0 ? 'No practice history yet. Start practicing!' : undefined
    });
  } catch (error) {
    console.error('Get History Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch practice history',
      error: error.message
    });
  }
};

// ==========================================
// @desc    Delete specific practice from history
// @route   DELETE /api/history/:id
// @access  Private
// ==========================================
const deletePracticeFromHistory = async (req, res) => {
  try {
    const practice = await Practice.findById(req.params.id);

    if (!practice) {
      return res.status(404).json({
        success: false,
        message: 'Practice not found'
      });
    }

    // Check if practice belongs to user (FIXED: user -> userId)
    if (practice.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this practice'
      });
    }

    await practice.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Practice deleted successfully'
    });
  } catch (error) {
    console.error('Delete Practice Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete practice',
      error: error.message
    });
  }
};

// ==========================================
// @desc    Clear all history for user
// @route   DELETE /api/history/clear
// @access  Private
// ==========================================
const clearHistory = async (req, res) => {
  try {
    const result = await Practice.deleteMany({ userId: req.user.id });

    res.status(200).json({
      success: true,
      message: `Cleared ${result.deletedCount} practices from history`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Clear History Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear history',
      error: error.message
    });
  }
};

module.exports = {
  getPracticeHistory,
  deletePracticeFromHistory,
  clearHistory
};
