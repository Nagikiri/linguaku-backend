// ============================================
// FILE: models/Practice.js
// Tujuan: Schema untuk hasil latihan pronunciation
// ============================================

const mongoose = require('mongoose');

/**
 * Practice Schema - OPTIMIZED FOR STORAGE
 * Menyimpan RINGKASAN hasil latihan (summary only)
 * Maksimal 30 record per user untuk hemat storage MongoDB Free Tier (512MB)
 */
const practiceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  
  materialId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Material',
    required: false
  },
  
  // Teks yang dilatih (untuk referensi saja, bukan full transcript)
  itemText: {
    type: String,
    required: [true, 'Practice text is required'],
    trim: true
  },
  
  // Skor akurasi (0-100) - DATA UTAMA UNTUK GRAFIK
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  
  // STATISTIK DETAIL UNTUK GRAFIK PROGRES
  correctWords: {
    type: Number,
    required: true,
    default: 0
  },
  
  wrongWords: {
    type: Number,
    required: true,
    default: 0
  },
  
  totalWords: {
    type: Number,
    required: true,
    default: 0
  },
  
  // Kata-kata yang salah (max 5 untuk hemat space)
  mistakes: {
    type: [String],
    default: [],
    validate: {
      validator: function(v) {
        return v.length <= 5;
      },
      message: 'Maksimal 5 kata kesalahan disimpan'
    }
  },
  
  // Feedback summary (max 200 chars untuk hemat storage)
  feedbackSummary: {
    type: String,
    maxlength: 200,
    default: ''
  },
  
  // Durasi dalam detik
  duration: {
    type: Number,
    default: 0
  },
  
  // Timestamp - DATA UTAMA UNTUK GRAFIK
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: false, // Hanya gunakan createdAt manual
  strict: true
});

// CATATAN: Field yang TIDAK disimpan (hemat storage):
// - audioUrl: File audio langsung dihapus setelah diproses
// - transcript: Transkripsi lengkap tidak disimpan
// - feedback: Feedback panjang di-generate on-the-fly, tidak disimpan

/**
 * Compound Index: Untuk query cepat by user dengan sorting by date
 */
practiceSchema.index({ userId: 1, createdAt: -1 });

/**
 * Pre-save Hook: Auto-delete oldest practice jika user punya >10 records
 * Memastikan setiap user max 10 practice history (display limit)
 * Note: Stats tetap dihitung dari semua practice sebelum dihapus
 */
practiceSchema.pre('save', async function(next) {
  if (this.isNew) {
    const count = await this.constructor.countDocuments({ userId: this.userId });
    
    if (count >= 10) {
      // Hapus practice tertua
      const oldest = await this.constructor
        .findOne({ userId: this.userId })
        .sort({ createdAt: 1 });
      
      if (oldest) {
        await oldest.deleteOne();
      }
    }
  }
  next();
});

/**
 * Method: Get practice summary (lighter version)
 */
practiceSchema.methods.getSummary = function() {
  return {
    id: this._id,
    text: this.itemText,
    score: this.score,
    date: this.createdAt,
    mistakes: this.mistakes.slice(0, 3), // Max 3 mistakes in summary
    duration: this.duration
  };
};

/**
 * Static Method: Get user statistics
 * Usage: Practice.getUserStats(userId)
 */
practiceSchema.statics.getUserStats = async function(userId) {
  const practices = await this.find({ userId });
  
  if (practices.length === 0) {
    return {
      total: 0,
      average: 0,
      highest: 0,
      lowest: 0
    };
  }
  
  const scores = practices.map(p => p.score);
  const sum = scores.reduce((a, b) => a + b, 0);
  
  return {
    total: practices.length,
    average: Math.round(sum / practices.length),
    highest: Math.max(...scores),
    lowest: Math.min(...scores),
    recent: practices.slice(-5) // 5 practices terakhir
  };
};

module.exports = mongoose.model('Practice', practiceSchema);