// ============================================
// FILE: controllers/authController.js
// Tujuan: Handle logic Register & Login & Password Reset
// ============================================

const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { OAuth2Client } = require('google-auth-library');
const { sendVerificationEmail, sendResetPasswordEmail } = require('../config/emailService');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Daftar domain email valid yang umum digunakan
const VALID_EMAIL_DOMAINS = [
  'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 
  'icloud.com', 'aol.com', 'protonmail.com', 'zoho.com',
  'mail.com', 'yandex.com', 'gmx.com', 'tutanota.com',
  'live.com', 'msn.com', 'yahoo.co.id', 'yahoo.co.uk',
  // Email domain institusi (tambahkan sesuai kebutuhan)
  'student.ub.ac.id', 'ub.ac.id', 'ui.ac.id', 'itb.ac.id',
  'ugm.ac.id', 'unpad.ac.id', 'its.ac.id', 'undip.ac.id',
  // Email testing untuk admin
  'admin.test', 'test.com', 'example.com'
];

// ==========================================
// @desc    Register pengguna baru
// @route   POST /api/auth/register
// @access  Public
// ==========================================
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 1. VALIDASI INPUT
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Mohon isi semua field (name, email, password)'
      });
    }

    // 2. VALIDASI FORMAT EMAIL
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Format email tidak valid'
      });
    }

    // 3. VALIDASI DOMAIN EMAIL (pastikan menggunakan email provider yang valid)
    const emailDomain = email.toLowerCase().split('@')[1];
    const isValidDomain = VALID_EMAIL_DOMAINS.includes(emailDomain);
    
    // Jangan validasi domain untuk admin testing email
    const isTestEmail = email.toLowerCase().includes('admin') || email.toLowerCase().includes('test');
    
    if (!isValidDomain && !isTestEmail) {
      return res.status(400).json({
        success: false,
        message: 'Gunakan email provider yang valid (Gmail, Yahoo, Outlook, dll) atau email institusi'
      });
    }

    // 4. CEK EMAIL SUDAH ADA ATAU BELUM
    let userExists = await User.findOne({ email });
    
    if (userExists) {
      // Jika user sudah verified, return error
      if (userExists.isEmailVerified) {
        return res.status(400).json({
          success: false,
          message: 'Email sudah terdaftar. Silahkan login.'
        });
      }
      
      // Jika belum verified, resend verification email
      try {
        const verificationToken = userExists.generateEmailVerificationToken();
        await userExists.save();
        await sendVerificationEmail(email, verificationToken, userExists.name);
        
        return res.status(200).json({
          success: true,
          message: 'Email sudah terdaftar tapi belum diverifikasi. Email verifikasi baru telah dikirim.',
          requiresVerification: true,
          data: {
            email: userExists.email,
            name: userExists.name
          }
        });
      } catch (emailError) {
        console.error('[EMAIL ERROR]:', emailError);
        return res.status(500).json({
          success: false,
          message: 'Gagal mengirim email verifikasi'
        });
      }
    }

    // 5. VALIDASI PASSWORD - STRICT RULES
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters'
      });
    }

    // Check uppercase
    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least 1 uppercase letter'
      });
    }

    // Check number
    if (!/[0-9]/.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least 1 number'
      });
    }

    // Check symbol
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least 1 symbol'
      });
    }

    // 6. BUAT USER BARU (isEmailVerified default: false)
    const user = await User.create({
      name,
      email,
      password,
      authProvider: 'email',
      isEmailVerified: false
    });

    // 7. GENERATE EMAIL VERIFICATION TOKEN
    const verificationToken = user.generateEmailVerificationToken();
    await user.save();

    // 8. SEND VERIFICATION EMAIL
    try {
      await sendVerificationEmail(email, verificationToken, name);
      console.log('[AUTH] User registered successfully:', email);
      console.log('[AUTH] Verification email sent to:', email);
      
      // Send success response
      res.status(201).json({
        success: true,
        message: 'Registration successful! Please check your email for verification.',
        requiresVerification: true,
        data: {
          email: user.email,
          name: user.name
        }
      });
    } catch (emailError) {
      // Rollback: Delete user if email sending fails
      await User.findByIdAndDelete(user._id);
      console.error('[EMAIL ERROR] Failed to send verification email:', emailError);
      
      return res.status(500).json({
        success: false,
        message: 'Gagal mengirim email verifikasi. Silakan coba lagi.'
      });
    }

  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

// ==========================================
// @desc    Login pengguna
// @route   POST /api/auth/login
// @access  Public
// ==========================================
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. VALIDASI INPUT
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Mohon isi email dan password'
      });
    }

    // 2. CEK USER ADA ATAU TIDAK
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah'
      });
    }

    // 3. CEK APAKAH EMAIL SUDAH DIVERIFIKASI
    if (!user.isEmailVerified && user.authProvider === 'email') {
      return res.status(403).json({
        success: false,
        message: 'Email belum diverifikasi. Silakan cek inbox Anda.',
        requiresVerification: true,
        email: user.email
      });
    }

    // 4. CEK APAKAH AKUN TERKUNCI (brute-force protection)
    if (user.isLocked()) {
      return res.status(423).json({
        success: false,
        message: 'Akun terkunci karena terlalu banyak percobaan login gagal. Coba lagi dalam 15 menit.'
      });
    }

    // 5. CEK PASSWORD COCOK ATAU TIDAK
    const isPasswordMatch = await user.matchPassword(password);

    if (!isPasswordMatch) {
      // Increment failed attempts
      await user.incrementLoginAttempts();
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah'
      });
    }

    // 5. RESET FAILED ATTEMPTS ON SUCCESSFUL LOGIN
    if (user.failedLoginAttempts > 0 || user.lockUntil) {
      await user.resetLoginAttempts();
    }

    // 6. UPDATE LAST LOGIN
    user.lastLogin = Date.now();
    await user.save();

    // 7. GENERATE JWT TOKEN (expires in 3 days)
    const token = generateToken(user._id);

    // Send success response
    res.status(200).json({
      success: true,
      message: 'Login successful!',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          profilePicture: user.profilePicture,
          isEmailVerified: user.isEmailVerified,
          lastLogin: user.lastLogin
        },
        token
      }
    });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: error.message
    });
  }
};

// ==========================================
// @desc    Get user profile (untuk test)
// @route   GET /api/auth/me
// @access  Private (butuh token)
// ==========================================
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Get Me Error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

// ==========================================
// @desc    Request password reset
// @route   POST /api/auth/forgot-password
// @access  Public
// ==========================================
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email harus diisi'
      });
    }

    // Check if user exists (don't reveal if exists - security best practice)
    const user = await User.findOne({ email });
    
    // Always return success message (don't leak info)
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'Jika email terdaftar, link reset password akan dikirim.'
      });
    }

    // Generate reset token
    const resetToken = user.generatePasswordResetToken();
    await user.save();

    // Send reset password email
    try {
      await sendResetPasswordEmail(email, resetToken, user.name);
      console.log('[AUTH] Password reset email sent to:', email);

      res.status(200).json({
        success: true,
        message: 'Jika email terdaftar, link reset password akan dikirim.'
      });
    } catch (emailError) {
      // Rollback: Remove token if email sending fails
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      
      console.error('[EMAIL ERROR]:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Gagal mengirim email reset password'
      });
    }
  } catch (error) {
    console.error('[FORGOT PASSWORD ERROR]:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal memproses permintaan reset password'
    });
  }
};

// ==========================================
// @desc    Reset password with token
// @route   POST /api/auth/reset-password/:token
// @access  Public
// ==========================================
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Validate inputs
    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Token dan password baru diperlukan'
      });
    }

    // Validate password length
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters'
      });
    }

    // Check uppercase
    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least 1 uppercase letter'
      });
    }

    // Check number
    if (!/[0-9]/.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least 1 number'
      });
    }

    // Check symbol
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least 1 symbol'
      });
    }

    // Verify token and find user
    const user = await User.verifyResetToken(token);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token tidak valid atau sudah kadaluarsa. Silakan minta reset password baru.'
      });
    }

    // Update password (will be hashed by pre-save hook)
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    
    // Also clear old resetPasswordCode if exists
    user.resetPasswordCode = undefined;
    user.resetPasswordExpire = undefined;
    
    await user.save();

    console.log('[AUTH] Password reset successful for:', user.email);

    // NO AUTO-LOGIN - User must login manually (security best practice)
    res.status(200).json({
      success: true,
      message: 'Password reset successful! Please login with your new password.'
    });
  } catch (error) {
    console.error('[RESET PASSWORD ERROR]:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal reset password'
    });
  }
};

// ==========================================
// @desc    Google OAuth Login/Register
// @route   POST /api/auth/google
// @access  Public
// ==========================================
const googleAuth = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'Google ID token diperlukan'
      });
    }

    // Verify Google token
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Check if user exists
    let user = await User.findOne({ email });

    if (user) {
      // User exists - update Google ID if not set
      if (!user.googleId) {
        user.googleId = googleId;
        user.authProvider = 'google';
        await user.save();
      }
      
      // Update last login
      user.lastLogin = Date.now();
      await user.save();
    } else {
      // Create new user with Google auth
      user = await User.create({
        name,
        email,
        googleId,
        authProvider: 'google',
        profilePicture: picture,
        isEmailVerified: true, // Google emails are already verified
        lastLogin: Date.now()
      });
    }

    // Generate JWT token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Google login successful!',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          profilePicture: user.profilePicture,
          authProvider: user.authProvider,
          lastLogin: user.lastLogin
        },
        token
      }
    });

  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal login dengan Google',
      error: error.message
    });
  }
};

// ==========================================
// @desc    Verify email with token
// @route   GET /api/auth/verify-email?token=xxx
// @access  Public
// ==========================================
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).send('<html><body style="font-family:Arial;text-align:center;padding:50px"><h1>Verification Failed</h1><p>Token tidak ditemukan</p></body></html>');
    }

    // Verify token and find user
    const user = await User.verifyEmailToken(token);

    if (!user) {
      return res.status(400).send('<html><body style="font-family:Arial;text-align:center;padding:50px"><h1>Verification Failed</h1><p>Token tidak valid atau sudah kadaluarsa</p></body></html>');
    }

    // Set email as verified and remove token - optimize with lean save
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });

    console.log('[AUTH] Email verified for:', user.email);

    // Send clear success response with instructions
    res.status(200).send(`<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Email Verified</title></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#667eea;display:flex;align-items:center;justify-content:center;min-height:100vh">
<div style="background:white;padding:40px;border-radius:12px;max-width:500px;margin:20px;box-shadow:0 4px 20px rgba(0,0,0,0.1);text-align:center">
<div style="font-size:60px;margin-bottom:20px">✅</div>
<h1 style="color:#28a745;margin:0 0 10px 0;font-size:28px">Email Verified Successfully!</h1>
<p style="color:#666;font-size:16px;line-height:1.6;margin:20px 0">Your email has been verified. You can now return to the LinguaKu app and log in.</p>
<div style="background:#e7f3ff;padding:15px;border-radius:8px;margin-top:20px">
<p style="color:#0066cc;margin:0;font-size:14px"><strong>Next step:</strong> Close this browser and open the LinguaKu app to log in.</p>
</div>
</div></body></html>`);
  } catch (error) {
    console.error('[VERIFY EMAIL ERROR]:', error);
    res.status(500).send('<html><body style="font-family:Arial;text-align:center;padding:50px"><h1>Server Error</h1><p>Terjadi kesalahan saat memverifikasi email</p></body></html>');
  }
};

// ==========================================
// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Public
// ==========================================
const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email diperlukan'
      });
    }

    // Find user (don't reveal if exists - security)
    const user = await User.findOne({ email });

    // Always return success message (don't reveal if email exists)
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'Jika email terdaftar, email verifikasi akan dikirim.'
      });
    }

    // Check if already verified
    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email sudah diverifikasi. Silakan login.'
      });
    }

    // Generate new verification token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save();

    // Send verification email
    try {
      await sendVerificationEmail(email, verificationToken, user.name);
      console.log('[AUTH] Verification email resent to:', email);

      res.status(200).json({
        success: true,
        message: 'Email verifikasi telah dikirim. Silakan cek inbox Anda.'
      });
    } catch (emailError) {
      console.error('[EMAIL ERROR]:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Gagal mengirim email verifikasi'
      });
    }
  } catch (error) {
    console.error('[RESEND VERIFICATION ERROR]:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengirim email verifikasi'
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  googleAuth
};

/**
 * FLOW REGISTER:
 * 1. Terima data dari frontend (name, email, password)
 * 2. Validasi input lengkap
 * 3. Cek email sudah ada atau belum
 * 4. Validasi password minimal 6 karakter
 * 5. Buat user baru (password otomatis di-hash)
 * 6. Generate JWT token
 * 7. Kirim response: user data + token
 * 
 * FLOW LOGIN:
 * 1. Terima email + password dari frontend
 * 2. Validasi input
 * 3. Cari user berdasarkan email
 * 4. Compare password dengan bcrypt
 * 5. Update lastLogin
 * 6. Generate JWT token
 * 7. Kirim response: user data + token
 * 
 * KEAMANAN:
 * - Password di-hash dengan bcryptjs (di model)
 * - Token JWT untuk autentikasi
 * - Error message generic untuk mencegah user enumeration
 * - Semua error di-log untuk debugging
 */

// ==========================================
// @desc    Google OAuth: Redirect to Google
// @route   GET /api/auth/google
// @access  Public
// ==========================================
exports.googleAuth = (req, res, next) => {
  const passport = require('passport');
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })(req, res, next);
};

// ==========================================
// @desc    Google OAuth: Callback setelah login
// @route   GET /api/auth/google/callback
// @access  Public
// ==========================================
exports.googleCallback = (req, res, next) => {
  const passport = require('passport');
  passport.authenticate('google', { session: false }, (err, user, info) => {
    if (err) {
      console.error('Google callback error:', err);
      return res.redirect('http://localhost:8081?error=auth_failed');
    }

    if (!user) {
      console.log('No user returned from Google');
      return res.redirect('http://localhost:8081?error=no_user');
    }

    // Generate JWT token
    const token = generateToken(user._id);

    console.log('✅ Google login successful:', user.email);

    // Redirect ke frontend dengan token
    // Frontend akan catch token dari URL dan save ke AsyncStorage
    return res.redirect(`http://localhost:8081?token=${token}&email=${encodeURIComponent(user.email)}&name=${encodeURIComponent(user.name)}`);
  })(req, res, next);
};