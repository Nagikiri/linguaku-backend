// ============================================
// FILE: services/scoringService.js
// Tujuan: Calculate pronunciation score & feedback
// ============================================

// Get accent mode from environment variables
const ACCENT_MODE = process.env.ACCENT_MODE || 'indonesian';

/**
 * Normalize word for accent-aware comparison
 * Tolerates Indonesian accent features when in 'indonesian' mode
 * @param {String} word - Word to normalize
 * @returns {String} - Normalized word
 */
const normalizeForAccent = (word) => {
  // If strict mode, return as-is (only lowercase)
  if (ACCENT_MODE !== 'indonesian') {
    return word.toLowerCase();
  }

  // Indonesian accent tolerance rules:
  return word
    .toLowerCase()
    // "th" often pronounced as "t" (three -> tree, there -> tere)
    .replace(/th/g, 't')
    // "v" and "f" sound similar (very -> fery, five -> fife)
    .replace(/v/g, 'f')
    // "z" often pronounced as "s" (zero -> sero, zone -> sone)
    .replace(/z/g, 's')
    // Rolled or strong "r" is acceptable (normalize multiple r's)
    .replace(/r+/g, 'r')
    // Missing aspiration in p/t/k (pen -> ben, tea -> dea)
    .replace(/^p([aeiou])/g, 'b$1')
    .replace(/^t([aeiou])/g, 'd$1')
    .replace(/^k([aeiou])/g, 'g$1');
};

/**
 * Calculate pronunciation score
 * Compare transcription with original text
 * @param {String} originalText - Text asli dari material
 * @param {String} transcribedText - Text hasil speech-to-text
 * @returns {Object} - Score and feedback
 */
const calculateScore = (originalText, transcribedText) => {
  // Normalize text
  const original = originalText.toLowerCase().trim().replace(/\s+/g, ' ');
  const transcribed = transcribedText.toLowerCase().trim().replace(/\s+/g, ' ');

  // Split into words
  const originalWords = original.split(' ');
  const transcribedWords = transcribed.split(' ');

  // Calculate word-level accuracy with accent-aware comparison
  let correctWords = 0;
  let mistakes = [];

  originalWords.forEach((word, index) => {
    const normalizedExpected = normalizeForAccent(word);
    const normalizedActual = normalizeForAccent(transcribedWords[index] || '');

    if (normalizedActual === normalizedExpected) {
      correctWords++;
    } else {
      mistakes.push({
        expected: word,
        actual: transcribedWords[index] || '(missing)',
        position: index
      });
    }
  });

  // Calculate score (0-100)
  const accuracy = (correctWords / originalWords.length) * 100;
  const score = Math.round(accuracy);

  // Generate feedback based on score
  let feedback = '';
  if (score >= 90) {
    feedback = 'Excellent! Your pronunciation is very clear.';
  } else if (score >= 75) {
    feedback = 'Good job! Keep practicing to improve.';
  } else if (score >= 60) {
    feedback = 'Not bad, but there is room for improvement.';
  } else if (score >= 40) {
    feedback = 'Keep practicing! Focus on the words that need improvement.';
  } else {
    feedback = 'Don\'t give up! Practice more and you will improve.';
  }

  // Highlight mistakes
  const mistakeWords = mistakes.map(m => m.expected);

  return {
    score,
    accuracy,
    correctWords,
    totalWords: originalWords.length,
    mistakes,
    mistakeWords,
    feedback,
    transcription: transcribed,
    accentMode: ACCENT_MODE // Include mode info in response
  };
};

/**
 * Calculate Levenshtein Distance (for more accurate comparison)
 * Measures the difference between two strings
 */
const levenshteinDistance = (str1, str2) => {
  const matrix = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
};

/**
 * Calculate similarity percentage using Levenshtein
 */
const calculateSimilarity = (str1, str2) => {
  const distance = levenshteinDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);
  const similarity = ((maxLength - distance) / maxLength) * 100;
  return Math.round(similarity);
};

module.exports = {
  calculateScore,
  calculateSimilarity,
  levenshteinDistance,
  normalizeForAccent // Export for testing purposes
};

/**
 * CARA KERJA:
 * 
 * 1. Terima 2 input:
 *    - originalText: "Hello how are you"
 *    - transcribedText: "Hello how you"
 * 
 * 2. Normalize (lowercase, trim, remove extra spaces)
 * 
 * 3. Split jadi array kata:
 *    - original: ["hello", "how", "are", "you"]
 *    - transcribed: ["hello", "how", "you"]
 * 
 * 4. Compare kata per kata:
 *    - "hello" = "hello" ✅
 *    - "how" = "how" ✅
 *    - "are" ≠ "you" ❌ → mistake
 *    - "you" = missing ❌ → mistake
 * 
 * 5. Hitung accuracy:
 *    - Correct: 2/4 = 50%
 *    - Score: 50
 * 
 * 6. Generate feedback berdasarkan score
 * 
 * 7. Return object:
 *    {
 *      score: 50,
 *      accuracy: 50,
 *      correctWords: 2,
 *      totalWords: 4,
 *      mistakes: [...],
 *      mistakeWords: ["are"],
 *      feedback: "Keep practicing!",
 *      transcription: "hello how you"
 *    }
 * 
 * ALGORITMA TAMBAHAN:
 * - Levenshtein Distance: Ukur perbedaan 2 string
 * - Similarity: Convert distance jadi persentase
 * 
 * IMPROVEMENT NANTI:
 * - Phonetic comparison (sound alike words)
 * - Confidence score dari Whisper
 * - Word-level timing analysis
 */