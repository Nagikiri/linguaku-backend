// ============================================
// FILE: middleware/rateLimiter.js
// Tujuan: Rate limiting untuk mencegah brute-force attacks
// ============================================

const rateLimit = require('express-rate-limit');

// ==========================================
// Auth Rate Limiter (Login, Register, Forgot Password)
// ==========================================
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Terlalu banyak percobaan dari IP ini. Coba lagi dalam 15 menit.'
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  // Skip successful requests
  skipSuccessfulRequests: false,
  // Skip failed requests (only count all attempts)
  skipFailedRequests: false
});

// ==========================================
// Strict Auth Limiter (untuk forgot-password yang lebih ketat)
// ==========================================
const strictAuthLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit to 3 requests per hour
  message: {
    success: false,
    message: 'Terlalu banyak permintaan reset password. Coba lagi dalam 1 jam.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// ==========================================
// General API Rate Limiter
// ==========================================
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Terlalu banyak request. Coba lagi nanti.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  authLimiter,       // For login, register
  strictAuthLimiter, // For forgot-password
  apiLimiter         // For general API endpoints
};

/**
 * PENGGUNAAN:
 * 
 * Di server.js atau route file:
 * 
 * const { authLimiter, strictAuthLimiter } = require('./middleware/rateLimiter');
 * 
 * // Apply ke semua auth routes
 * router.post('/login', authLimiter, loginUser);
 * router.post('/register', authLimiter, registerUser);
 * router.post('/forgot-password', strictAuthLimiter, forgotPassword);
 * 
 * CATATAN:
 * - authLimiter: 5 requests per 15 menit (untuk login/register)
 * - strictAuthLimiter: 3 requests per 1 jam (untuk forgot-password)
 * - apiLimiter: 100 requests per 15 menit (untuk general API)
 * 
 * Rate limit based on IP address, cocok untuk mencegah:
 * - Brute force login attacks
 * - Spam registrations
 * - Password reset abuse
 */
