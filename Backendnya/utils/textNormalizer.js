// ============================================
// FILE: utils/textNormalizer.js
// Tujuan: Text normalization utilities untuk fair pronunciation evaluation
// ============================================

/**
 * Normalize text for pronunciation comparison
 * - Remove punctuation
 * - Convert to lowercase
 * - Remove filler words
 * - Normalize whitespace
 * - NEVER convert spoken numbers to digits
 */
function normalizeText(text) {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .toLowerCase()                                    // Case insensitive
    .replace(/[.,!?;:"""''`]/g, '')                  // Remove punctuation
    .replace(/\s+/g, ' ')                            // Normalize whitespace
    .replace(/\b(uh|um|eh|hmm|er|ah|erm)\b/gi, '')  // Remove filler words
    .trim();
}

/**
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy word matching
 */
function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  // Initialize matrix
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  // Fill matrix
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
}

/**
 * Calculate similarity percentage between two words
 * Returns 0-100 percentage
 */
function wordSimilarity(word1, word2) {
  if (!word1 || !word2) return 0;
  if (word1 === word2) return 100;
  
  // Use Levenshtein distance
  const distance = levenshteinDistance(word1, word2);
  const maxLen = Math.max(word1.length, word2.length);
  
  if (maxLen === 0) return 100;
  
  // Similarity percentage
  const similarity = ((maxLen - distance) / maxLen) * 100;
  
  return similarity;
}

/**
 * Evaluate pronunciation with fair word-level scoring
 * Returns score, correct words, incorrect words
 */
function evaluatePronunciation(targetSentence, transcribedSentence) {
  // Step 1: Normalize both texts
  const normalizedTarget = normalizeText(targetSentence);
  const normalizedTranscription = normalizeText(transcribedSentence);
  
  // Step 2: Split into words
  const targetWords = normalizedTarget.split(' ').filter(w => w.length > 0);
  const transcribedWords = normalizedTranscription.split(' ').filter(w => w.length > 0);
  
  if (targetWords.length === 0) {
    return { 
      score: 0, 
      correctWords: [], 
      incorrectWords: [],
      totalWords: 0
    };
  }
  
  // Step 3: Calculate word-level scores
  const wordScores = [];
  const correctWords = [];
  const incorrectWords = [];
  
  targetWords.forEach((targetWord, index) => {
    const transcribedWord = transcribedWords[index] || '';
    
    if (transcribedWord) {
      const similarity = wordSimilarity(targetWord, transcribedWord);
      
      wordScores.push(similarity);
      
      // Threshold 70% for "correct"
      if (similarity >= 70) {
        correctWords.push(targetWord);
      } else {
        incorrectWords.push({
          expected: targetWord,
          actual: transcribedWord,
          similarity: Math.round(similarity)
        });
      }
    } else {
      // Missing word
      wordScores.push(0);
      incorrectWords.push({
        expected: targetWord,
        actual: '(not spoken)',
        similarity: 0
      });
    }
  });
  
  // Step 4: Calculate overall score (average)
  const averageScore = wordScores.reduce((a, b) => a + b, 0) / wordScores.length;
  
  // Step 5: Apply bonus for perfect/near-perfect matches
  let finalScore = averageScore;
  
  if (averageScore >= 95) {
    finalScore = 100; // Perfect or near-perfect gets 100%
  } else if (averageScore >= 90) {
    finalScore = Math.min(averageScore + 5, 100); // Bonus for excellent
  }
  
  // Step 6: ROUND to 1 decimal place ONLY
  finalScore = Math.round(finalScore * 10) / 10;
  
  // Clamp between 0 and 100
  finalScore = Math.max(0, Math.min(100, finalScore));
  
  return {
    score: finalScore,
    correctWords,
    incorrectWords,
    totalWords: targetWords.length,
    spokenWords: transcribedWords.length
  };
}

/**
 * Format score consistently (round to 1 decimal place)
 */
function formatScore(score) {
  if (typeof score !== 'number' || isNaN(score)) {
    return 0;
  }
  
  // Round to 1 decimal place
  const rounded = Math.round(score * 10) / 10;
  
  // Clamp between 0 and 100
  return Math.max(0, Math.min(100, rounded));
}

module.exports = {
  normalizeText,
  levenshteinDistance,
  wordSimilarity,
  evaluatePronunciation,
  formatScore
};
