// ============================================
// FILE: src/config/api.js
// Purpose: API configuration for different environments
// ============================================

// ==========================================
// ENVIRONMENT CONFIGURATION
// ==========================================

// Development: Use your local IP address
// Find your IP: ipconfig (Windows) or ifconfig (Mac/Linux)
const DEV_API_URL = 'http://192.168.1.17:5000/api';

// Production: Railway deployment URL
const PROD_API_URL = 'https://linguaku-backend-production.up.railway.app/api';

// Automatically use dev URL in Expo Go, prod URL in built APK
export const API_URL = __DEV__ ? DEV_API_URL : PROD_API_URL;

// Request timeout configuration
export const REQUEST_TIMEOUT = 30000; // 30 seconds for slow connections

// Log current configuration (helps with debugging)
console.log('🔧 API Configuration:', {
  environment: __DEV__ ? 'development' : 'production',
  apiUrl: API_URL
});

// ==========================================
// API Endpoints
// ==========================================
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  LOGOUT: '/auth/logout',
  ME: '/auth/me',
  GOOGLE_AUTH: '/auth/google',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: (token) => `/auth/reset-password/${token}`,
  
  // User Profile
  USER_PROFILE: '/user/profile',
  USER_STATISTICS: '/user/statistics',
  UPDATE_PROFILE: '/user/profile',
  CHANGE_PASSWORD: '/user/change-password',
  
  // Materials
  MATERIALS: '/materials',
  MATERIAL_BY_ID: (id) => `/materials/${id}`,
  
  // Practice
  PRACTICE_ANALYZE: '/practice/analyze',
  PRACTICE_HISTORY: '/practice/history',
  PRACTICE_BY_ID: (id) => `/practice/${id}`,
  DELETE_PRACTICE: (id) => `/practice/${id}`,
  WEEKLY_PERFORMANCE: '/practice/weekly-performance',
  WEEKLY_INSIGHT: '/practice/weekly-insight',
  RECENT_ACTIVITY: '/practice/recent',
  
  // Progress
  PROGRESS_STATS: '/progress/statistics',
  
  // History
  HISTORY: '/history',
  CLEAR_HISTORY: '/history/clear',
  DELETE_HISTORY: (id) => `/history/${id}`,
  
  // Health Check
  HEALTH: '/health',
};

// Fetch with timeout and retry mechanism
export const fetchWithTimeout = async (url, options = {}, timeout = REQUEST_TIMEOUT, retries = 2) => {
  let lastError;
  
  for (let i = 0; i <= retries; i++) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(id);
      return response;
    } catch (error) {
      clearTimeout(id);
      lastError = error;
      
      // If it's the last retry, throw the error
      if (i === retries) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout. Please check your internet connection and try again.');
        }
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  
  throw lastError;
};

// Helper function to get full URL
export const getFullUrl = (endpoint) => {
  if (endpoint.startsWith('http')) {
    return endpoint;
  }
  return `${API_URL}${endpoint}`;
};

