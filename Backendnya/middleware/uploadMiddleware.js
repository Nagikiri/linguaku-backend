// ============================================
// FILE: middleware/uploadMiddleware.js
// Tujuan: Handle upload file audio dengan Multer
// ============================================

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Pastikan folder uploads/audio ada
const uploadDir = './uploads/audio';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ==========================================
// STORAGE CONFIGURATION
// ==========================================
const storage = multer.diskStorage({
  // Tentukan folder penyimpanan
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  
  // Tentukan nama file
  filename: function (req, file, cb) {
    // Format: user_timestamp_originalname.ext
    const userId = req.user ? req.user.id : 'guest';
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const filename = `${userId}_${timestamp}${ext}`;
    cb(null, filename);
  }
});

// ==========================================
// FILE FILTER (hanya audio)
// ==========================================
const fileFilter = (req, file, cb) => {


  // Allowed audio formats (MIME types)
  const allowedMimes = [
    'audio/wav',
    'audio/wave',
    'audio/x-wav',
    'audio/mpeg',
    'audio/mp3',
    'audio/mp4',
    'audio/x-m4a',
    'audio/webm',
    'audio/ogg',
    'application/octet-stream' // Kadang file download jadi generic
  ];

  // Allowed extensions
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = ['.wav', '.mp3', '.m4a', '.webm', '.ogg'];

  // Cek MIME type ATAU extension
  if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
    console.log('✅ File accepted');
    cb(null, true); // Accept file
  } else {
    console.log('❌ File rejected');
    cb(
      new Error(
        `Format file tidak didukung. Gunakan format: WAV, MP3, M4A, WEBM, OGG. (Detected: ${file.mimetype})`
      ),
      false
    );
  }
};

// ==========================================
// MULTER CONFIGURATION
// ==========================================
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // Max 10MB
  }
});

// ==========================================
// MIDDLEWARE: Upload single audio file
// ==========================================
const uploadAudio = upload.single('audio');

// ==========================================
// MIDDLEWARE: Error handler untuk multer
// ==========================================
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Multer error
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File terlalu besar. Maksimal 10MB.'
      });
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`
    });
  } else if (err) {
    // Other errors
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  next();
};

module.exports = {
  uploadAudio,
  handleUploadError
};

/**
 * CARA KERJA:
 * 
 * 1. Multer menerima file dari form-data dengan key "audio"
 * 2. File filter cek apakah format audio valid
 * 3. File disimpan di folder uploads/audio/
 * 4. Nama file: {userId}_{timestamp}.{ext}
 * 5. Jika error (size/format), middleware handleUploadError menangani
 * 
 * PENGGUNAAN DI ROUTE:
 * router.post('/upload', 
 *   protect,           // Auth middleware
 *   uploadAudio,       // Upload middleware
 *   handleUploadError, // Error handler
 *   uploadController   // Controller
 * );
 * 
 * CARA TEST DI POSTMAN:
 * Method: POST
 * URL: http://localhost:5000/api/practice/upload
 * Headers:
 *   Authorization: Bearer <token>
 * Body (form-data):
 *   audio: [pilih file audio.wav]
 * 
 * KEAMANAN:
 * - Max file size: 10MB
 * - Hanya audio format yang diizinkan
 * - File disimpan dengan nama unik (userId + timestamp)
 * - Folder uploads/ sudah di-gitignore
 */