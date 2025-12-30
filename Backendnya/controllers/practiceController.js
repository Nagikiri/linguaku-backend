// ============================================
// FILE: controllers/practiceController.js
// Tujuan: Handle practice logic (upload + analyze)
// Updated: Integrated with Gemini AI for detailed feedback
// ============================================

const Practice = require('../models/Practice');
const Material = require('../models/Material');
const { generateDetailedFeedback: generateGeminiFeedback } = require('../services/geminiService');
const { calculateScore } = require('../services/scoringService');
// ✅ NO MORE HARDCODE FALLBACK - Always use Gemini AI

// ==========================================
// @desc    Upload audio and analyze pronunciation
// @route   POST /api/practice/analyze
// @access  Private
// ==========================================
const analyzePronunciation = async (req, res) => {
  try {

    // 1. VALIDATE RECOGNIZED TEXT (from Android Speech Recognition)
    const { recognizedText, materialId } = req.body;
    
    if (!recognizedText) {
      return res.status(400).json({
        success: false,
        message: 'Recognized text is required'
      });
    }

    // 2. VALIDATE MATERIAL ID
    if (!materialId) {
      return res.status(400).json({
        success: false,
        message: 'Material ID harus diisi'
      });
    }

    // 3. GET MATERIAL FROM DATABASE (support nested items)
    let material = await Material.findById(materialId);
    let materialText = null;

    if (!material) {
      // If not found in root, try finding in items._id
      material = await Material.findOne({ 'items._id': materialId });
      if (material) {
        const item = material.items.find(
          (it) => it._id.toString() === materialId
        );
        if (item) materialText = item.text;
      }
    } else {
      // If old format or has direct text field
      if (material.text) {
        materialText = material.text;
      } else if (material.items && material.items.length > 0) {
        materialText = material.items[0].text;
      }
    }

    // If still not found
    if (!material || !materialText) {
      return res.status(404).json({
        success: false,
        message: 'Material atau text latihan tidak ditemukan'
      });
    }

    // 4. USE RECOGNIZED TEXT (from Android Speech Recognition)
    // Normalize transcription
    const transcription = String(recognizedText).toLowerCase().trim();
    
    console.log('📝 Recognized text from device:', transcription);
    console.log('📄 Expected text:', materialText);

    // 5. CALCULATE SCORE
    const result = calculateScore(materialText, transcription);

    // 6. GENERATE AI FEEDBACK USING GEMINI (ALWAYS - NO HARDCODE FALLBACK)
    let detailedFeedback;
    let feedbackSource = 'Gemini AI';
    
    // MANDATORY: Always use Gemini AI for feedback
    try {
      console.log('🤖 Generating feedback with Gemini AI...');
      
      const geminiResult = await generateGeminiFeedback(
        materialText,
        transcription,
        result.mistakeWords || []
      );
      
      if (geminiResult.success) {
        detailedFeedback = geminiResult.feedback;
        feedbackSource = 'Gemini AI';
        console.log('✅ Gemini AI feedback generated successfully');
      } else {
        // If Gemini fails, throw error to trigger retry
        throw new Error(geminiResult.error || 'Gemini AI failed to generate feedback');
      }
    } catch (geminiError) {
      console.error('❌ Gemini AI Error:', geminiError.message);
      
      // Return error response - DO NOT USE HARDCODE FALLBACK
      return res.status(500).json({
        success: false,
        message: 'Gagal menganalisis pengucapan. Mohon coba lagi.',
        error: 'AI feedback generation failed',
        details: geminiError.message
      });
    }

    // 7. VALIDATE USER AUTHENTICATION
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'User tidak terautentikasi'
      });
    }

    // 8. NORMALIZE DATA FOR DATABASE
    const transcriptStr = transcription || '';
    if (!transcriptStr || transcriptStr.trim().length === 0) {
      return res.status(500).json({
        success: false,
        message: 'Transcription kosong, proses analisis gagal'
      });
    }

    // Normalize mistakes array
    let mistakesArr = result.mistakeWords || [];
    if (!Array.isArray(mistakesArr)) {
      mistakesArr = [mistakesArr];
    }
    mistakesArr = mistakesArr.map(m => {
      if (typeof m === 'string') return m;
      if (m && typeof m === 'object') {
        return m.word || m.text || JSON.stringify(m);
      }
      return String(m);
    });

    // 9. PREPARE DATA - LENGKAP UNTUK STATISTIK SEMPURNA
    const practiceData = {
      userId: req.user.id,
      materialId: materialId,
      itemText: materialText,
      score: result.score,
      correctWords: result.correctWords || 0,
      wrongWords: result.mistakeWords ? result.mistakeWords.length : 0,
      totalWords: result.totalWords || 0,
      mistakes: mistakesArr.slice(0, 5), // Max 5 mistakes untuk hemat storage
      feedbackSummary: detailedFeedback ? detailedFeedback.substring(0, 200) : '', // Max 200 chars
      duration: 0 // No audio file, so duration is 0
    };

    // 10. SAVE TO DATABASE
    const practice = await Practice.create(practiceData);

    // 12. SEND RESPONSE
    res.status(201).json({
      success: true,
      message: 'Analysis completed successfully',
      data: {
        practiceId: practice._id,
        material: {
          id: material._id,
          text: materialText,
          level: material.level
        },
        result: {
          score: result.score,
          accuracy: result.accuracy,
          transcription: transcription,
          correctWords: result.correctWords,
          totalWords: result.totalWords,
          mistakeWords: result.mistakeWords,
          feedback: detailedFeedback,
          feedbackSource: feedbackSource
        },
        createdAt: practice.createdAt
      }
    });

  } catch (error) {
    console.error('Practice Error:', error);

    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat analisis',
      error: error.message
    });
  }
};

// ==========================================
// @desc    Get user's practice history
// @route   GET /api/practice/history
// @access  Private
// ==========================================
const getPracticeHistory = async (req, res) => {
  try {
    // Find practices by userId (new schema field)
    const practices = await Practice.find({ userId: req.user.id })
      .populate('materialId', 'title level category')
      .sort({ createdAt: -1 })
      .limit(50); // Increased limit since data is lighter

    // Return practices with their stored feedback (from Gemini AI)
    const practicesWithFeedback = practices.map(practice => {
      return {
        _id: practice._id,
        materialId: practice.materialId,
        itemText: practice.itemText,
        score: practice.score,
        mistakes: practice.mistakes,
        duration: practice.duration,
        createdAt: practice.createdAt,
        feedback: practice.feedbackSummary || 'No feedback available' // Use stored feedback from DB
      };
    });

    res.status(200).json({
      success: true,
      count: practicesWithFeedback.length,
      data: practicesWithFeedback
    });
  } catch (error) {
    console.error('Get History Error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil riwayat latihan'
    });
  }
};

// ==========================================
// @desc    Get single practice detail
// @route   GET /api/practice/:id
// @access  Private
// ==========================================
const getPracticeDetail = async (req, res) => {
  try {
    const practice = await Practice.findById(req.params.id)
      .populate('material', 'text level category');

    if (!practice) {
      return res.status(404).json({
        success: false,
        message: 'Practice tidak ditemukan'
      });
    }

    // Check if practice belongs to user
    if (practice.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Tidak ada akses ke practice ini'
      });
    }

    res.status(200).json({
      success: true,
      data: practice
    });
  } catch (error) {
    console.error('Get Practice Detail Error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil detail practice'
    });
  }
};

// ==========================================
// @desc    Delete practice
// @route   DELETE /api/practice/:id
// @access  Private
// ==========================================
const deletePractice = async (req, res) => {
  try {
    const practice = await Practice.findById(req.params.id);

    if (!practice) {
      return res.status(404).json({
        success: false,
        message: 'Practice tidak ditemukan'
      });
    }

    // Check if practice belongs to user
    if (practice.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Tidak ada akses untuk menghapus practice ini'
      });
    }

    // Delete audio file
    deleteAudioFile('./uploads/audio/' + practice.audioFile);

    // Delete from database
    await practice.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Practice deleted successfully'
    });
  } catch (error) {
    console.error('Delete Practice Error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus practice'
    });
  }
};

// ==========================================
// @desc    Get weekly performance chart data (last 7 days)
// @route   GET /api/practices/weekly-performance
// @access  Private
// ==========================================
const getWeeklyPerformance = async (req, res) => {
  try {
    const userId = req.user._id;
    const { getLastNDays, formatDayName, formatDateString, getDayBoundaries } = require('../utils/dateHelpers');
    
    // Get last 7 days
    const last7Days = getLastNDays(7);
    
    // Build result array
    const performanceData = [];
    
    for (const date of last7Days) {
      const { startOfDay, endOfDay } = getDayBoundaries(date);
      
      // Get all practices for this day
      const practices = await Practice.find({
        userId,
        createdAt: {
          $gte: startOfDay,
          $lte: endOfDay
        }
      }).select('score');
      
      // Calculate average score
      let avgScore = 0;
      const practiceCount = practices.length;
      
      if (practiceCount > 0) {
        const totalScore = practices.reduce((sum, p) => sum + p.score, 0);
        avgScore = Math.round(totalScore / practiceCount);
      }
      
      // Determine color based on performance
      let color = 'gray'; // No data
      if (practiceCount > 0) {
        if (avgScore >= 90) color = 'green';
        else if (avgScore >= 75) color = 'blue';
        else if (avgScore >= 60) color = 'orange';
        else color = 'red';
      }
      
      performanceData.push({
        day: formatDayName(date),
        date: formatDateString(date),
        avgScore,
        practiceCount,
        color
      });
    }
    
    res.json({
      success: true,
      data: performanceData
    });
  } catch (error) {
    console.error('[WEEKLY PERFORMANCE ERROR]:', error);
    // Return 200 with empty array instead of error
    res.status(200).json({
      success: true,
      data: [],
      message: 'No practice data available'
    });
  }
};

// ==========================================
// @desc    Get weekly insight message
// @route   GET /api/practices/weekly-insight
// @access  Private
// ==========================================
const getWeeklyInsight = async (req, res) => {
  try {
    const userId = req.user._id;
    const { getWeekRange } = require('../utils/dateHelpers');
    
    // Get current week (last 7 days)
    const currentWeek = getWeekRange(0);
    const previousWeek = getWeekRange(1);
    
    // Get current week practices
    const currentWeekPractices = await Practice.find({
      userId,
      createdAt: {
        $gte: currentWeek.startDate,
        $lte: currentWeek.endDate
      }
    }).select('score');
    
    // Get previous week practices
    const previousWeekPractices = await Practice.find({
      userId,
      createdAt: {
        $gte: previousWeek.startDate,
        $lte: previousWeek.endDate
      }
    }).select('score');
    
    // Calculate averages
    const currentWeekCount = currentWeekPractices.length;
    const previousWeekCount = previousWeekPractices.length;
    
    let currentWeekAvg = 0;
    if (currentWeekCount > 0) {
      const total = currentWeekPractices.reduce((sum, p) => sum + p.score, 0);
      currentWeekAvg = Math.round((total / currentWeekCount) * 10) / 10;
    }
    
    let previousWeekAvg = 0;
    if (previousWeekCount > 0) {
      const total = previousWeekPractices.reduce((sum, p) => sum + p.score, 0);
      previousWeekAvg = Math.round((total / previousWeekCount) * 10) / 10;
    }
    
    // Calculate improvement
    let improvement = 0;
    if (previousWeekAvg > 0) {
      improvement = Math.round(((currentWeekAvg - previousWeekAvg) / previousWeekAvg) * 1000) / 10;
    }
    
    // Generate message based on performance
    let message = '';
    let color = '';
    
    // No practices this week
    if (currentWeekCount === 0) {
      message = 'No practices this week yet. Start today and build your streak!';
      color = 'gray';
    }
    // Few practices
    else if (currentWeekCount < 3) {
      message = `You practiced ${currentWeekCount} time${currentWeekCount > 1 ? 's' : ''} this week. Try for at least 3-5 sessions!`;
      color = 'orange';
    }
    // No previous data
    else if (previousWeekCount === 0) {
      message = `Great start! You completed ${currentWeekCount} practices this week with an average score of ${currentWeekAvg}!`;
      color = 'blue';
    }
    // Improvement calculations
    else if (improvement > 15) {
      message = `Incredible! Your average score jumped by ${improvement}% this week! You're on fire!`;
      color = 'green';
    }
    else if (improvement > 10) {
      message = `Excellent work! Your average improved by ${improvement}% this week. Keep it up!`;
      color = 'green';
    }
    else if (improvement > 5) {
      message = `Great progress! You improved by ${improvement}% this week. Stay consistent!`;
      color = 'blue';
    }
    else if (improvement > 0) {
      message = `Nice! You're ${improvement}% better than last week. Slow and steady wins!`;
      color = 'blue';
    }
    else if (improvement === 0) {
      message = 'Your score is steady this week. Try pushing a bit harder!';
      color = 'orange';
    }
    else if (improvement > -5) {
      message = `Your score dipped ${Math.abs(improvement)}% this week. Don't give up!`;
      color = 'orange';
    }
    else if (improvement > -10) {
      message = `Score dropped ${Math.abs(improvement)}% this week. Let's get back on track!`;
      color = 'red';
    }
    else {
      message = `Tough week! Score down ${Math.abs(improvement)}%. Remember, progress isn't always linear!`;
      color = 'red';
    }
    
    res.json({
      success: true,
      data: {
        improvement,
        message,
        color,
        currentWeekAvg,
        previousWeekAvg,
        currentWeekPractices: currentWeekCount
      }
    });
  } catch (error) {
    console.error('[WEEKLY INSIGHT ERROR]:', error);
    // Return neutral message instead of error
    res.status(200).json({
      success: true,
      data: {
        message: 'No practices this week yet. Start today and build your streak!',
        color: 'gray',
        currentWeekAvg: 0,
        previousWeekAvg: 0,
        improvement: 0,
        currentWeekPractices: 0
      }
    });
  }
};

// ==========================================
// @desc    Get recent activity (3 latest practices)
// @route   GET /api/practices/recent
// @access  Private
// ==========================================
const getRecentActivity = async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = parseInt(req.query.limit) || 3;
    
    const practices = await Practice.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('itemText score createdAt materialId')
      .populate('materialId', 'title')
      .lean();
    
    // Format response
    const recentActivity = practices.map(practice => ({
      id: practice._id,
      lessonName: practice.materialId?.title || practice.itemText.substring(0, 30) + '...',
      score: practice.score,
      completedAt: practice.createdAt
    }));
    
    res.json({
      success: true,
      data: recentActivity
    });
  } catch (error) {
    console.error('[RECENT ACTIVITY ERROR]:', error);
    // Return 200 with empty array instead of error
    res.status(200).json({
      success: true,
      data: [],
      message: 'No practice history available'
    });
  }
};

module.exports = {
  analyzePronunciation,
  getPracticeHistory,
  getPracticeDetail,
  deletePractice,
  getWeeklyPerformance,
  getWeeklyInsight,
  getRecentActivity
};