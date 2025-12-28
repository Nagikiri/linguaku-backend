// ============================================
// FILE: utils/scoreFormatter.js
// Tujuan: Centralized score formatting for consistency
// ============================================

/**
 * Centralized score formatting
 * Use this EVERYWHERE in the app to ensure consistency
 * @param {number} score - Raw score value
 * @returns {number} - Formatted score (0-100, max 1 decimal)
 */
export function formatScore(score) {
  if (typeof score !== 'number' || isNaN(score)) {
    return 0;
  }
  
  // Round to 1 decimal place
  const rounded = Math.round(score * 10) / 10;
  
  // Clamp between 0 and 100
  return Math.max(0, Math.min(100, rounded));
}

/**
 * Display score as string with % sign
 * @param {number} score - Score value
 * @returns {string} - Formatted string (e.g., "78.5%" or "100%")
 */
export function displayScore(score) {
  const formatted = formatScore(score);
  
  // Remove .0 if whole number
  if (formatted % 1 === 0) {
    return `${Math.round(formatted)}%`;
  }
  
  return `${formatted}%`;
}

/**
 * Get color based on score (for UI styling)
 * @param {number} score - Score value
 * @returns {string} - Hex color code
 */
export function getScoreColor(score) {
  const formatted = formatScore(score);
  
  if (formatted >= 90) return '#10B981'; // Green - Excellent
  if (formatted >= 75) return '#3B82F6'; // Blue - Good
  if (formatted >= 60) return '#F59E0B'; // Orange - Fair
  return '#EF4444'; // Red - Needs Practice
}

/**
 * Get feedback level text based on score
 * @param {number} score - Score value
 * @returns {string} - Level text (e.g., "Excellent", "Good")
 */
export function getScoreLevel(score) {
  const formatted = formatScore(score);
  
  if (formatted >= 90) return 'Excellent';
  if (formatted >= 75) return 'Good';
  if (formatted >= 60) return 'Fair';
  return 'Needs Practice';
}

/**
 * Get emoji based on score
 * @param {number} score - Score value
 * @returns {string} - Emoji
 */
export function getScoreEmoji(score) {
  const formatted = formatScore(score);
  
  if (formatted >= 95) return '🌟'; // Perfect
  if (formatted >= 90) return '🎉'; // Excellent
  if (formatted >= 75) return '👍'; // Good
  if (formatted >= 60) return '💪'; // Fair
  return '📚'; // Needs Practice
}
