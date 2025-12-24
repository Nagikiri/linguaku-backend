/**
 * Time Ago Utility
 * Converts timestamps to human-readable "X minutes/hours/days ago" format
 * SHARED across all screens to ensure consistency
 */

/**
 * Format timestamp to "X time ago" format
 * @param {string|Date} timestamp - The timestamp to format
 * @returns {string} Formatted time string (e.g., "5 minutes ago")
 */
export const formatTimeAgo = (timestamp) => {
  if (!timestamp) return 'Unknown';
  
  const now = new Date();
  const past = new Date(timestamp);
  
  // Handle invalid dates
  if (isNaN(past.getTime())) return 'Unknown';
  
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins === 1) return '1 minute ago';
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return months === 1 ? '1 month ago' : `${months} months ago`;
  }
  const years = Math.floor(diffDays / 365);
  return years === 1 ? '1 year ago' : `${years} years ago`;
};

/**
 * Format date to readable format (e.g., "Jan 15, 2024")
 * @param {string|Date} timestamp - The timestamp to format
 * @returns {string} Formatted date string
 */
export const formatDate = (timestamp) => {
  if (!timestamp) return 'Unknown';
  
  const date = new Date(timestamp);
  
  if (isNaN(date.getTime())) return 'Unknown';
  
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
};

/**
 * Format date with time (e.g., "Jan 15, 2024 at 3:45 PM")
 * @param {string|Date} timestamp - The timestamp to format
 * @returns {string} Formatted date and time string
 */
export const formatDateTime = (timestamp) => {
  if (!timestamp) return 'Unknown';
  
  const date = new Date(timestamp);
  
  if (isNaN(date.getTime())) return 'Unknown';
  
  const dateOptions = { year: 'numeric', month: 'short', day: 'numeric' };
  const timeOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
  
  const dateStr = date.toLocaleDateString('en-US', dateOptions);
  const timeStr = date.toLocaleTimeString('en-US', timeOptions);
  
  return `${dateStr} at ${timeStr}`;
};

export default {
  formatTimeAgo,
  formatDate,
  formatDateTime
};
