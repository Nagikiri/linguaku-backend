// ============================================
// FILE: routes/authRoutes.js
// Tujuan: Define endpoint untuk auth (register, login, password reset)
// ============================================

const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getMe,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  googleAuth,
  googleCallback
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authLimiter, strictAuthLimiter } = require('../middleware/rateLimiter');
// @route   POST /api/auth/register
// @desc    Registrasi pengguna baru
// @access  Public
// @limiter 5 requests per 15 minutes
router.post('/register', authLimiter, registerUser);

// @route   POST /api/auth/login
// @desc    Login pengguna
// @access  Public
// @limiter 5 requests per 15 minutes
router.post('/login', authLimiter, loginUser);

// ==========================================
// EMAIL VERIFICATION ROUTES
// ==========================================

// @route   GET /api/auth/verify-email (with ?token=xxx query param)
// @desc    Verify email dengan token dari email
// @access  Public
router.get('/verify-email', verifyEmail);

// @route   POST /api/auth/resend-verification
// @desc    Resend email verifikasi
// @access  Public
// @limiter 3 requests per 15 minutes
router.post('/resend-verification', strictAuthLimiter, resendVerification);

// ==========================================
// PASSWORD RESET ROUTES
// ==========================================

// @route   POST /api/auth/forgot-password
// @desc    Request password reset link
// @access  Public
// @limiter 3 requests per 1 hour (stricter)
router.post('/forgot-password', strictAuthLimiter, forgotPassword);

// @route   GET /api/auth/reset-password/:token
// @desc    Show reset password form (HTML page)
// @access  Public
router.get('/reset-password/:token', (req, res) => {
  const { token } = req.params;
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Password - LinguaKu</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
        .container { max-width: 400px; width: 100%; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 20px rgba(0,0,0,0.2); }
        h1 { color: #333; margin-bottom: 10px; font-size: 24px; text-align: center; }
        p { color: #666; margin-bottom: 24px; text-align: center; font-size: 14px; }
        .form-group { margin-bottom: 20px; position: relative; }
        label { display: block; margin-bottom: 8px; color: #333; font-weight: 600; font-size: 14px; }
        input { width: 100%; padding: 12px; padding-right: 40px; border: 1px solid #ddd; border-radius: 6px; font-size: 15px; }
        input:focus { outline: none; border-color: #667eea; }
        .eye-icon { position: absolute; right: 12px; top: 38px; cursor: pointer; user-select: none; color: #999; font-size: 18px; }
        .eye-icon:hover { color: #667eea; }
        button { width: 100%; padding: 14px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 6px; font-size: 16px; font-weight: 600; cursor: pointer; }
        button:hover { opacity: 0.9; }
        button:disabled { opacity: 0.6; cursor: not-allowed; }
        .error { color: #dc3545; font-size: 13px; margin-top: 8px; display: none; }
        .success { color: #28a745; font-size: 13px; margin-top: 8px; display: none; }
        .loading { display: none; text-align: center; margin-top: 16px; color: #666; }
        .requirements { background: #f8f9fa; padding: 12px; border-radius: 6px; margin-bottom: 20px; font-size: 13px; }
        .requirements ul { margin: 8px 0 0 20px; }
        .requirements li { color: #666; margin: 4px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Reset Password</h1>
        <p>Enter your new password below</p>
        <div class="requirements">
          <strong>Password must contain:</strong>
          <ul>
            <li>At least 8 characters</li>
            <li>At least 1 uppercase letter</li>
            <li>At least 1 number</li>
            <li>At least 1 symbol (!@#$%^&*...)</li>
          </ul>
        </div>
        <form id="resetForm">
          <div class="form-group">
            <label for="password">New Password</label>
            <input type="password" id="password" name="password" placeholder="Enter new password" required>
            <span class="eye-icon" onclick="togglePassword('password')">\u{1F441}\u{FE0F}</span>
          </div>
          <div class="form-group">
            <label for="confirmPassword">Confirm Password</label>
            <input type="password" id="confirmPassword" name="confirmPassword" placeholder="Re-enter password" required>
            <span class="eye-icon" onclick="togglePassword('confirmPassword')">\u{1F441}\u{FE0F}</span>
          </div>
          <button type="submit" id="submitBtn">Reset Password</button>
          <div class="error" id="error"></div>
          <div class="success" id="success"></div>
          <div class="loading" id="loading">Processing...</div>
        </form>
      </div>
      <script>
        function togglePassword(fieldId) {
          const field = document.getElementById(fieldId);
          field.type = field.type === 'password' ? 'text' : 'password';
        }
        
        document.getElementById('resetForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          
          const password = document.getElementById('password').value;
          const confirmPassword = document.getElementById('confirmPassword').value;
          const errorDiv = document.getElementById('error');
          const successDiv = document.getElementById('success');
          const loadingDiv = document.getElementById('loading');
          const submitBtn = document.getElementById('submitBtn');
          
          errorDiv.style.display = 'none';
          successDiv.style.display = 'none';
          
          // Validation
          if (password !== confirmPassword) {
            errorDiv.textContent = 'Passwords do not match!';
            errorDiv.style.display = 'block';
            return;
          }
          
          if (password.length < 8) {
            errorDiv.textContent = 'Password must be at least 8 characters!';
            errorDiv.style.display = 'block';
            return;
          }
          
          if (!/[A-Z]/.test(password)) {
            errorDiv.textContent = 'Password must contain at least 1 uppercase letter!';
            errorDiv.style.display = 'block';
            return;
          }
          
          if (!/[0-9]/.test(password)) {
            errorDiv.textContent = 'Password must contain at least 1 number!';
            errorDiv.style.display = 'block';
            return;
          }
          
          if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errorDiv.textContent = 'Password must contain at least 1 symbol!';
            errorDiv.style.display = 'block';
            return;
          }
          
          loadingDiv.style.display = 'block';
          submitBtn.disabled = true;
          
          try {
            const response = await fetch(\`/api/auth/reset-password/${token}\`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ password })
            });
            
            const data = await response.json();
            loadingDiv.style.display = 'none';
            submitBtn.disabled = false;
            
            if (data.success) {
              successDiv.textContent = 'Password successfully reset! You can now login with your new password.';
              successDiv.style.display = 'block';
              document.getElementById('resetForm').reset();
              setTimeout(() => {
                window.close();
              }, 3000);
            } else {
              errorDiv.textContent = data.message || 'Failed to reset password';
              errorDiv.style.display = 'block';
            }
          } catch (error) {
            loadingDiv.style.display = 'none';
            submitBtn.disabled = false;
            errorDiv.textContent = 'An error occurred. Please try again.';
            errorDiv.style.display = 'block';
          }
        });
      </script>
    </body>
    </html>
  `);
});

// @route   POST /api/auth/reset-password/:token
// @desc    Reset password dengan token
// @access  Public
// @limiter 5 requests per 15 minutes
router.post('/reset-password/:token', authLimiter, resetPassword);

// ==========================================
// PRIVATE ROUTES (butuh token)
// ==========================================

// @route   GET /api/auth/me
// @desc    Get user profile yang sedang login
// @access  Private
router.get('/me', protect, getMe);

// ==========================================
// GOOGLE OAUTH ROUTES
// ==========================================

// @route   POST /api/auth/google
// @desc    Google OAuth Login/Register
// @access  Public
router.post('/google', googleAuth);

module.exports = router;

/**
 * STRUKTUR ROUTES:
 * 
 * BASE URL: http://localhost:5000/api/auth
 * 
 * PUBLIC ENDPOINTS (tidak perlu token):
 * - POST /register     → Daftar akun baru
 * - POST /login        → Login ke aplikasi
 * 
 * PRIVATE ENDPOINTS (perlu token di header):
 * - GET /me            → Lihat profil sendiri
 * 
 * CARA PAKAI (di Postman/Frontend):
 * 
 * 1. REGISTER:
 *    POST http://localhost:5000/api/auth/register
 *    Body (JSON):
 *    {
 *      "name": "Test User",
 *      "email": "test@mail.com",
 *      "password": "Test123!"
 *    }
 * 
 * 2. LOGIN:
 *    POST http://localhost:5000/api/auth/login
 *    Body (JSON):
 *    {
 *      "email": "test@mail.com",
 *      "password": "Test123!"
 *    }
 * 
 * 3. GET PROFILE:
 *    GET http://localhost:5000/api/auth/me
 *    Headers:
 *    Authorization: Bearer <token_dari_login>
 * 
 * MIDDLEWARE:
 * - protect: Verifikasi JWT token sebelum akses route
 */