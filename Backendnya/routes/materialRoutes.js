// ============================================
// FILE: routes/materialRoutes.js
// Tujuan: Routes untuk material management
// ============================================

const express = require('express');
const router = express.Router();
const Material = require('../models/Material');

// @route   GET /api/materials
// @desc    Get all materials (grouped by level if needed)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const materials = await Material.find().sort({ level: 1, category: 1 });
    
    res.status(200).json({
      success: true,
      count: materials.length,
      data: materials
    });
  } catch (error) {
    console.error('Get Materials Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch materials',
      error: error.message
    });
  }
});

// @route   GET /api/materials/by-level/:level
// @desc    Get materials by difficulty level
// @access  Public
router.get('/by-level/:level', async (req, res) => {
  try {
    const { level } = req.params;
    
    // Validate level
    const validLevels = ['Beginner', 'Intermediate', 'Advanced'];
    if (!validLevels.includes(level)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid level. Must be: Beginner, Intermediate, or Advanced'
      });
    }
    
    const materials = await Material.find({ level }).sort({ category: 1 });
    
    res.status(200).json({
      success: true,
      level,
      count: materials.length,
      data: materials
    });
  } catch (error) {
    console.error('Get Materials By Level Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch materials',
      error: error.message
    });
  }
});

// @route   GET /api/materials/:id
// @desc    Get single material by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    
    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: material
    });
  } catch (error) {
    console.error('Get Material Detail Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch material',
      error: error.message
    });
  }
});

module.exports = router;
