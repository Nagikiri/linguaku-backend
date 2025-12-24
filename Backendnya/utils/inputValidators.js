// ============================================
// FILE: utils/inputValidators.js
// Tujuan: Input validation dengan express-validator
// ============================================

const { body, validationResult } = require('express-validator');

// ==========================================
// Validation Rules
// ==========================================

// Register validation
const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Nama harus diisi')
    .isLength({ min: 2, max: 50 }).withMessage('Nama harus antara 2-50 karakter'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email harus diisi')
    .isEmail().withMessage('Format email tidak valid')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password harus diisi')
    .isLength({ min: 8 }).withMessage('Password minimal 8 karakter')
    .matches(/[A-Z]/).withMessage('Password harus mengandung minimal 1 huruf besar')
    .matches(/[0-9]/).withMessage('Password harus mengandung minimal 1 angka')
];

// Login validation
const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email harus diisi')
    .isEmail().withMessage('Format email tidak valid')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password harus diisi')
];

// Forgot password validation
const forgotPasswordValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email harus diisi')
    .isEmail().withMessage('Format email tidak valid')
    .normalizeEmail()
];

// Reset password validation
const resetPasswordValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email harus diisi')
    .isEmail().withMessage('Format email tidak valid')
    .normalizeEmail(),
  
  body('resetCode')
    .trim()
    .notEmpty().withMessage('Kode reset harus diisi')
    .isLength({ min: 6, max: 6 }).withMessage('Kode reset harus 6 digit'),
  
  body('newPassword')
    .notEmpty().withMessage('Password baru harus diisi')
    .isLength({ min: 8 }).withMessage('Password minimal 8 karakter')
    .matches(/[A-Z]/).withMessage('Password harus mengandung minimal 1 huruf besar')
    .matches(/[0-9]/).withMessage('Password harus mengandung minimal 1 angka')
];

// ==========================================
// Middleware to handle validation errors
// ==========================================
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    // Format errors untuk response
    const formattedErrors = errors.array().map(err => ({
      field: err.path,
      message: err.msg
    }));
    
    return res.status(400).json({
      success: false,
      message: 'Validasi gagal',
      errors: formattedErrors
    });
  }
  
  next();
};

module.exports = {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  validate
};

/**
 * CARA KERJA:
 * 
 * 1. Import di route file:
 *    const { registerValidation, validate } = require('../utils/inputValidators');
 * 
 * 2. Gunakan sebagai middleware:
 *    router.post('/register', registerValidation, validate, registerUser);
 * 
 * 3. Jika validasi gagal, akan return 400 dengan error messages
 * 
 * PASSWORD POLICY:
 * - Minimal 8 karakter
 * - Harus ada minimal 1 huruf besar (A-Z)
 * - Harus ada minimal 1 angka (0-9)
 * 
 * Untuk password lebih strict tambahkan:
 * .matches(/[a-z]/).withMessage('Harus ada huruf kecil')
 * .matches(/[!@#$%^&*]/).withMessage('Harus ada simbol spesial')
 */
