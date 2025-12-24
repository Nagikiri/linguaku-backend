// ============================================
// FILE: models/User.js
// Tujuan: Schema untuk data pengguna (user account)
// ============================================

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Nama harus diisi'],
      trim: true,
      maxlength: [50, 'Nama maksimal 50 karakter']
    },
    email: {
      type: String,
      required: [true, 'Email harus diisi'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Format email tidak valid'
      ]
    },
    password: {
      type: String,
      required: function() {
        // Password hanya required jika bukan Google auth
        return this.authProvider === 'email';
      },
      minlength: [8, 'Password minimal 8 karakter'],
      select: false // Tidak akan muncul saat query kecuali diminta
    },
    profilePicture: {
      type: String,
      default: null
    },
    lastLogin: {
      type: Date,
      default: null
    },
    // Google auth fields
    googleId: {
      type: String,
      sparse: true, // Allow null but must be unique if exists
      unique: true
    },
    authProvider: {
      type: String,
      enum: ['email', 'google'],
      default: 'email'
    },
    // Email verification fields
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    emailVerificationToken: {
      type: String,
      default: null,
      select: false // Don't return by default
    },
    emailVerificationExpires: {
      type: Date,
      default: null
    },
    // Password reset fields
    resetPasswordCode: {
      type: String
    },
    resetPasswordExpire: {
      type: Date
    },
    resetPasswordToken: {
      type: String,
      default: null,
      select: false // Don't return by default
    },
    resetPasswordExpires: {
      type: Date,
      default: null
    },
    // Role management
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    // Account lockout (brute-force protection)
    failedLoginAttempts: {
      type: Number,
      default: 0
    },
    lockUntil: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true // Otomatis tambah createdAt & updatedAt
  }
);

// ==========================================
// MIDDLEWARE: Hash password sebelum save
// ==========================================
userSchema.pre('save', async function (next) {
  // Hanya hash jika password dimodifikasi
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Generate salt dan hash password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// ==========================================
// METHOD: Compare password untuk login
// ==========================================
userSchema.methods.matchPassword = async function (enteredPassword) {
  // Compare password yang diinput dengan password di database
  return await bcrypt.compare(enteredPassword, this.password);
};

// ==========================================
// METHOD: Get public profile (tanpa password)
// ==========================================
userSchema.methods.getPublicProfile = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    profilePicture: this.profilePicture,
    lastLogin: this.lastLogin,
    createdAt: this.createdAt,
    role: this.role
  };
};

// ==========================================
// METHOD: Check if account is locked
// ==========================================
userSchema.methods.isLocked = function () {
  // Check if lock time has expired
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// ==========================================
// METHOD: Increment failed login attempts
// ==========================================
userSchema.methods.incrementLoginAttempts = async function () {
  // If we have a previous lock that has expired, reset attempts
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return await this.updateOne({
      $set: { failedLoginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }

  // Otherwise increment
  const updates = { $inc: { failedLoginAttempts: 1 } };

  // Lock account after 5 failed attempts (15 minutes)
  const MAX_LOGIN_ATTEMPTS = 5;
  const LOCK_TIME = 15 * 60 * 1000; // 15 minutes in milliseconds

  if (this.failedLoginAttempts + 1 >= MAX_LOGIN_ATTEMPTS && !this.isLocked()) {
    updates.$set = { lockUntil: Date.now() + LOCK_TIME };
  }

  return await this.updateOne(updates);
};

// ==========================================
// METHOD: Reset failed login attempts
// ==========================================
userSchema.methods.resetLoginAttempts = async function () {
  return await this.updateOne({
    $set: { failedLoginAttempts: 0 },
    $unset: { lockUntil: 1 }
  });
};

// ==========================================
// METHOD: Generate email verification token
// ==========================================
const crypto = require('crypto');

userSchema.methods.generateEmailVerificationToken = function () {
  // Generate random token (32 bytes)
  const verificationToken = crypto.randomBytes(32).toString('hex');
  
  // Hash token and set to emailVerificationToken field
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
  
  // Set expire to 24 hours from now
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  
  // Return unhashed token (this will be sent in email)
  return verificationToken;
};

// ==========================================
// STATIC: Verify email token
// ==========================================
userSchema.statics.verifyEmailToken = async function (token) {
  // Hash incoming token
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  // Find user with matching hashed token and not expired
  const user = await this.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() }
  });
  
  return user;
};

// ==========================================
// METHOD: Generate password reset token
// ==========================================
userSchema.methods.generatePasswordResetToken = function () {
  // Generate random token (32 bytes)
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  // Set expire to 10 minutes from now
  this.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  // Return unhashed token (this will be sent in email)
  return resetToken;
};

// ==========================================
// STATIC: Verify reset token
// ==========================================
userSchema.statics.verifyResetToken = async function (token) {
  // Hash incoming token
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
  
  // Find user with matching hashed token and not expired
  const user = await this.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() }
  }).select('+password'); // Include password for reset
  
  return user;
};

module.exports = mongoose.model('User', userSchema);

/**
 * PENJELASAN SCHEMA:
 * 
 * FIELDS:
 * - name: Nama pengguna (max 50 karakter)
 * - email: Email unik, lowercase, dengan validasi format
 * - password: Password (min 6 karakter, select: false)
 * - profilePicture: URL foto profil (optional)
 * - lastLogin: Timestamp login terakhir
 * - timestamps: createdAt & updatedAt otomatis
 * 
 * MIDDLEWARE:
 * - pre('save'): Hash password sebelum disimpan ke database
 * 
 * METHODS:
 * - matchPassword(password): Compare password untuk login
 *   Returns: true/false
 * 
 * - getPublicProfile(): Return data user tanpa password
 *   Returns: object dengan data public
 * 
 * KEAMANAN:
 * - Password di-hash dengan bcryptjs (10 rounds)
 * - Password tidak muncul di query kecuali select('+password')
 * - Email unique untuk mencegah duplikasi
 */