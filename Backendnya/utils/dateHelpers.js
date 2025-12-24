/**
 * Date Helper Utilities
 * Provides timezone-aware date calculations for user data
 */

/**
 * Get start and end of day in user's timezone
 * @param {Date} date - The date to get boundaries for
 * @param {string} timezone - User's timezone (optional, defaults to UTC)
 * @returns {Object} { startOfDay, endOfDay }
 */
const getDayBoundaries = (date = new Date(), timezone = 'UTC') => {
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  
  // Start of day: 00:00:00
  const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
  
  // End of day: 23:59:59.999
  const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);
  
  return { startOfDay, endOfDay };
};

/**
 * Get last N days (including today)
 * @param {number} days - Number of days to go back
 * @returns {Array} Array of date objects for last N days
 */
const getLastNDays = (days = 7) => {
  const dates = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    dates.push(date);
  }
  
  return dates;
};

/**
 * Format date to readable day name
 * @param {Date} date - Date to format
 * @returns {string} Day name (e.g., "Mon", "Tue")
 */
const formatDayName = (date) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[date.getDay()];
};

/**
 * Format date to YYYY-MM-DD
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
const formatDateString = (date) => {
  return date.toISOString().split('T')[0];
};

/**
 * Check if two dates are the same day
 * @param {Date} date1 
 * @param {Date} date2 
 * @returns {boolean}
 */
const isSameDay = (date1, date2) => {
  return formatDateString(date1) === formatDateString(date2);
};

/**
 * Get date range for a week
 * @param {number} weeksAgo - 0 for current week, 1 for last week, etc.
 * @returns {Object} { startDate, endDate }
 */
const getWeekRange = (weeksAgo = 0) => {
  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() - (weeksAgo * 7));
  
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 6);
  
  return {
    startDate: new Date(startDate.setHours(0, 0, 0, 0)),
    endDate: new Date(endDate.setHours(23, 59, 59, 999))
  };
};

/**
 * Calculate consecutive day streak
 * @param {Array} dates - Array of practice dates (sorted, most recent first)
 * @returns {number} Number of consecutive days
 */
const calculateStreak = (dates) => {
  if (!dates || dates.length === 0) return 0;
  
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let checkDate = new Date(today);
  
  for (const practiceDate of dates) {
    const practice = new Date(practiceDate);
    practice.setHours(0, 0, 0, 0);
    
    if (practice.getTime() === checkDate.getTime()) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (practice.getTime() < checkDate.getTime()) {
      // Gap found, streak broken
      break;
    }
  }
  
  return streak;
};

module.exports = {
  getDayBoundaries,
  getLastNDays,
  formatDayName,
  formatDateString,
  isSameDay,
  getWeekRange,
  calculateStreak
};
