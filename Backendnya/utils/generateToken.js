// ============================================
// FILE: utils/generateToken.js
// Tujuan: Generate JWT tokens untuk autentikasi
// ============================================

const jwt = require('jsonwebtoken');

/**
 * Generate JWT Access Token (simple version)
 * @param {String} userId - ID pengguna dari database
 * @returns {String} JWT access token
 */
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '3d' } // Default 3 days
  );
};

module.exports = generateToken;

/**
 * CARA KERJA:
 * 1. Function menerima userId dari database
 * 2. jwt.sign() membuat token dengan 3 komponen:
 *    - Payload: { id: userId }
 *    - Secret: dari JWT_SECRET di .env
 *    - Options: expiresIn = 30 hari
 * 3. Return token string yang akan dikirim ke frontend
 * 
 * CONTOH TOKEN:
 * eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYwY...
 * 
 * KEAMANAN:
 * - Secret key harus kuat dan disimpan di .env
 * - Token expire otomatis setelah 30 hari
 * - Frontend harus simpan token di AsyncStorage
 * - Setiap request ke backend harus kirim token di header
 */