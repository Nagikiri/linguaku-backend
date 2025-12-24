// ============================================
// FILE: controllers/progressController.js
// Tujuan: Handle progress statistics dan dashboard data
// Updated: Endpoint statistik sempurna untuk grafik
// ============================================

const Practice = require('../models/Practice');
const User = require('../models/User');
const mongoose = require('mongoose');

// ==========================================
// @desc    Get dashboard statistics (7 days, weekly, all-time)
// @route   GET /api/progress/stats?days=7|30|90
// @access  Private
// ==========================================
const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get days parameter from query (default 7 days)
    const daysParam = parseInt(req.query.days) || 7;
    const days = [7, 30, 90].includes(daysParam) ? daysParam : 7;
    
    // Date calculations
    const now = new Date();
    const periodStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const last3Months = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    // 1. GET PERIOD SCORES (for bar chart)
    const periodPractices = await Practice.aggregate([
      {
        $match: {
          userId: userId,
          createdAt: { $gte: periodStart }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          avgScore: { $avg: '$score' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);

    // Format for frontend (fill missing days with 0)
    const dailyScores = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // For week view: show last 7 days with day names
    // For month/all: show dates or aggregate by week
    if (days === 7) {
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        const dayName = dayNames[date.getDay()];
        
        const dayData = periodPractices.find(d => d._id === dateStr);
        
        dailyScores.push({
          day: dayName,
          date: dateStr,
          score: dayData ? Math.round(dayData.avgScore) : 0,
          count: dayData ? dayData.count : 0
        });
      }
    } else {
      // For month/all: show weekly aggregates
      const weeksToShow = days === 30 ? 4 : 12;
      for (let i = weeksToShow - 1; i >= 0; i--) {
        const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
        const weekStart = new Date(weekEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        const weekData = periodPractices.filter(p => {
          const pDate = new Date(p._id);
          return pDate >= weekStart && pDate < weekEnd;
        });
        
        const weekAvg = weekData.length > 0
          ? weekData.reduce((sum, d) => sum + d.avgScore, 0) / weekData.length
          : 0;
        const weekCount = weekData.reduce((sum, d) => sum + d.count, 0);
        
        dailyScores.push({
          day: `W${weeksToShow - i}`,
          date: weekStart.toISOString().split('T')[0],
          score: Math.round(weekAvg),
          count: weekCount
        });
      }
    }

    // 2. PERIOD AVERAGE
    const periodAvg = dailyScores.length > 0
      ? dailyScores.reduce((sum, day) => sum + day.score, 0) / dailyScores.length
      : 0;

    // 3. ALL-TIME STATS (last 3 months to keep DB lean)
    const allTimePractices = await Practice.find({
      userId: userId,
      createdAt: { $gte: last3Months }
    }).select('score createdAt');

    const totalPractices = allTimePractices.length;
    const allTimeAvg = totalPractices > 0
      ? allTimePractices.reduce((sum, p) => sum + p.score, 0) / totalPractices
      : 0;

    // 4. RECENT ACTIVITY (last 5 practices)
    const recentActivity = await Practice.find({
      userId: userId
    })
      .populate('materialId', 'title level')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('score itemText createdAt');

    // 5. STREAK CALCULATION
    const streak = await calculateStreak(userId);

    // 6. BEST SCORE
    const bestScore = totalPractices > 0
      ? Math.max(...allTimePractices.map(p => p.score))
      : 0;

    // 7. GENERATE MOTIVATIONAL MESSAGE
    const motivationalMessage = generateMotivationalMessage(
      periodAvg,
      totalPractices,
      streak
    );

    // 8. RESPONSE
    res.status(200).json({
      success: true,
      data: {
        dailyScores,
        weeklyAverage: Math.round(periodAvg),
        allTimeAverage: Math.round(allTimeAvg),
        totalPractices,
        recentActivity,
        streak,
        bestScore,
        motivationalMessage,
        period: {
          periodStart: periodStart.toISOString(),
          days: days,
          last3Months: last3Months.toISOString()
        }
      }
    });
  } catch (error) {
    console.error('Get Dashboard Stats Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message
    });
  }
};

// ==========================================
// Helper: Calculate user streak (consecutive days)
// ==========================================
const calculateStreak = async (userId) => {
  try {
    // Get all practices sorted by date descending
    const practices = await Practice.find({ userId: userId })
      .sort({ createdAt: -1 })
      .select('createdAt');

    if (practices.length === 0) return 0;

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    // Check each day backwards
    for (let i = 0; i < 365; i++) { // Max 1 year streak
      const dateStr = currentDate.toISOString().split('T')[0];
      
      // Check if user practiced on this date
      const practiceOnDate = practices.find(p => {
        const practiceDate = new Date(p.createdAt);
        practiceDate.setHours(0, 0, 0, 0);
        return practiceDate.toISOString().split('T')[0] === dateStr;
      });

      if (practiceOnDate) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1); // Go back 1 day
      } else if (i === 0) {
        // If no practice today, check yesterday
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        // Streak broken
        break;
      }
    }

    return streak;
  } catch (error) {
    console.error('Calculate Streak Error:', error);
    return 0;
  }
};

// ==========================================
// Helper: Calculate user streak in days (for statistics endpoint)
// ==========================================
const calculateStreakDays = async (userId) => {
  try {
    // Get all practices sorted by date descending
    const practices = await Practice.find({ userId: userId })
      .sort({ createdAt: -1 })
      .select('createdAt');

    if (practices.length === 0) return 0;

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    // Check each day backwards
    for (let i = 0; i < 365; i++) { // Max 1 year streak
      const dateStr = currentDate.toISOString().split('T')[0];
      
      // Check if user practiced on this date
      const practiceOnDate = practices.find(p => {
        const practiceDate = new Date(p.createdAt);
        practiceDate.setHours(0, 0, 0, 0);
        return practiceDate.toISOString().split('T')[0] === dateStr;
      });

      if (practiceOnDate) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1); // Go back 1 day
      } else if (i === 0) {
        // If no practice today, check yesterday
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        // Streak broken
        break;
      }
    }

    return streak;
  } catch (error) {
    console.error('Calculate Streak Days Error:', error);
    return 0;
  }
};

// ==========================================
// Helper: Generate motivational message based on performance
// ==========================================
const generateMotivationalMessage = (weeklyAvg, totalPractices, streak) => {
  // Based on weekly average
  if (weeklyAvg >= 90) {
    return "🌟 Excellent work! Your pronunciation is outstanding. Keep up the amazing progress!";
  } else if (weeklyAvg >= 75) {
    return "🚀 Great job! You're making solid progress. Keep practicing to reach perfection!";
  } else if (weeklyAvg >= 60) {
    return "💪 Good effort! You're improving steadily. Focus on your weak areas to boost your score.";
  } else if (weeklyAvg >= 40) {
    return "📚 Keep going! Practice makes perfect. Review the materials and try again.";
  } else if (totalPractices < 5) {
    return "🌱 Just getting started? Great! Practice regularly to see amazing improvements.";
  } else {
    return "Don't give up! Every practice session brings you closer to fluency. You can do it!";
  }
};

// ==========================================
// @desc    Get detailed progress by material/level
// @route   GET /api/progress/by-level
// @access  Private
// ==========================================
const getProgressByLevel = async (req, res) => {
  try {
    const userId = req.user.id;

    // Aggregate by material level
    const progressByLevel = await Practice.aggregate([
      {
        $match: { user: userId }
      },
      {
        $lookup: {
          from: 'materials',
          localField: 'material',
          foreignField: '_id',
          as: 'materialData'
        }
      },
      {
        $unwind: '$materialData'
      },
      {
        $group: {
          _id: '$materialData.level',
          avgScore: { $avg: '$score' },
          count: { $sum: 1 },
          bestScore: { $max: '$score' }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: progressByLevel
    });
  } catch (error) {
    console.error('Get Progress By Level Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch progress by level',
      error: error.message
    });
  }
};

// ==========================================
// @desc    Get STATISTICS untuk GRAFIK PROGRES (ENDPOINT SEMPURNA)
// @route   GET /api/progress/statistics
// @access  Private
// ==========================================
const getStatistics = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get period from query (default 30 days)
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // 1. GET ALL PRACTICES IN PERIOD (sorted chronologically)
    const practices = await Practice.find({
      userId: userId,
      createdAt: { $gte: startDate }
    })
    .sort({ createdAt: 1 }) // Sort ascending untuk grafik
    .select('score correctWords wrongWords totalWords createdAt feedbackSummary')
    .lean();

    console.log(`Found ${practices.length} practices in last ${days} days`);

    // 2. PREPARE DATA FOR GRAFIK (format: { date, score })
    const graphData = practices.map(p => ({
      date: p.createdAt.toISOString().split('T')[0], // YYYY-MM-DD format
      score: p.score,
      correctWords: p.correctWords || 0,
      wrongWords: p.wrongWords || 0,
      totalWords: p.totalWords || 0
    }));

    // 3. CALCULATE STATISTICS
    const totalPractices = practices.length;
    
    let averageScore = 0;
    let highestScore = 0;
    let lowestScore = 100;
    let totalCorrectWords = 0;
    let totalWrongWords = 0;
    
    if (totalPractices > 0) {
      const scores = practices.map(p => p.score);
      averageScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      highestScore = Math.max(...scores);
      lowestScore = Math.min(...scores);
      
      totalCorrectWords = practices.reduce((sum, p) => sum + (p.correctWords || 0), 0);
      totalWrongWords = practices.reduce((sum, p) => sum + (p.wrongWords || 0), 0);
    }

    // 4. CALCULATE IMPROVEMENT (compare first week vs last week)
    let improvementPercentage = 0;
    if (practices.length >= 2) {
      const firstWeekPractices = practices.slice(0, Math.min(7, practices.length));
      const lastWeekPractices = practices.slice(-Math.min(7, practices.length));
      
      const firstWeekAvg = firstWeekPractices.reduce((sum, p) => sum + p.score, 0) / firstWeekPractices.length;
      const lastWeekAvg = lastWeekPractices.reduce((sum, p) => sum + p.score, 0) / lastWeekPractices.length;
      
      if (firstWeekAvg > 0) {
        improvementPercentage = Math.round(((lastWeekAvg - firstWeekAvg) / firstWeekAvg) * 100);
      }
    }

    // 5. CALCULATE STREAK (consecutive days with practice)
    const streak = await calculateStreakDays(userId);

    // 6. GET RECENT FEEDBACK
    const recentFeedback = practices
      .filter(p => p.feedbackSummary && p.feedbackSummary.length > 0)
      .slice(-5) // Last 5 feedback
      .map(p => ({
        date: p.createdAt,
        feedback: p.feedbackSummary,
        score: p.score
      }));

    // 7. PREPARE RESPONSE
    const statistics = {
      // Data untuk grafik (ready to use di chart library)
      graphData: graphData,
      
      // Summary statistics
      summary: {
        totalPractices: totalPractices,
        averageScore: averageScore,
        highestScore: highestScore,
        lowestScore: lowestScore,
        improvementPercentage: improvementPercentage,
        currentStreak: streak,
        totalCorrectWords: totalCorrectWords,
        totalWrongWords: totalWrongWords,
        accuracyRate: totalCorrectWords + totalWrongWords > 0 
          ? Math.round((totalCorrectWords / (totalCorrectWords + totalWrongWords)) * 100)
          : 0
      },
      
      // Motivational message
      message: generateMotivationalMessage(averageScore, totalPractices, streak),
      
      // Recent feedback
      recentFeedback: recentFeedback,
      
      // Period info
      period: {
        days: days,
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString()
      }
    };

    res.status(200).json({
      success: true,
      data: statistics
    });

  } catch (error) {
    console.error('Get Statistics Error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil statistik',
      error: error.message
    });
  }
};

module.exports = {
  getDashboardStats,
  getProgressByLevel,
  getStatistics // ENDPOINT BARU UNTUK GRAFIK
};
