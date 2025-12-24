// ============================================
// FILE: middleware/authMiddleware.js
// Tujuan: Middleware untuk protect routes dengan JWT
// ============================================

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware: Protect Routes
 * Verifikasi JWT token di header request
 */
const protect = async (req, res, next) => {
  let token;

  try {
    // 1. CEK TOKEN ADA DI HEADER ATAU TIDAK
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      // Ambil token dari header: "Bearer <token>"
      token = req.headers.authorization.split(' ')[1];
    }

    // 2. KALAU TOKEN TIDAK ADA
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Tidak ada token, akses ditolak. Silahkan login terlebih dahulu.'
      });
    }

    // 3. VERIFIKASI TOKEN
    try {
      // Decode token dan extract payload
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 4. AMBIL USER DARI DATABASE
      // decoded.id adalah userId yang kita masukkan saat generate token
      req.user = await User.findById(decoded.id).select('-password');

      // 5. CEK USER MASIH ADA ATAU SUDAH DIHAPUS
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User tidak ditemukan'
        });
      }

      // 6. LANJUT KE CONTROLLER
      next();

    } catch (error) {
      console.error('Token verification failed:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Token tidak valid atau sudah kadaluarsa'
      });
    }

  } catch (error) {
    console.error('Auth Middleware Error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
};

module.exports = { protect };

/**
 * CARA KERJA MIDDLEWARE:
 * 
 * 1. Request datang dengan header:
 *    Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 * 
 * 2. Middleware extract token dari header
 * 
 * 3. Verifikasi token dengan jwt.verify()
 *    - Jika valid: extract userId dari payload
 *    - Jika invalid/expired: return error 401
 * 
 * 4. Ambil data user dari database berdasarkan userId
 * 
 * 5. Simpan user di req.user untuk dipakai di controller
 * 
 * 6. Panggil next() untuk lanjut ke controller
 * 
 * CONTOH PENGGUNAAN:
 * 
 * router.get('/profile', protect, getProfile);
 *                       ↑
 *                   middleware ini
 * 
 * Di controller bisa akses req.user:
 * const getProfile = (req, res) => {
 *   console.log(req.user.name); // Data user yang login
 * };
 * 
 * ERROR HANDLING:
 * - Token tidak ada → 401 Unauthorized
 * - Token invalid → 401 Unauthorized
 * - Token expired → 401 Unauthorized
 * - User dihapus → 401 Unauthorized
 */