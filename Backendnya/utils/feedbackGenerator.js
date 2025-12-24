// ============================================
// FILE: utils/feedbackGenerator.js
// Tujuan: Generate varied, dynamic feedback tanpa menyimpan ke DB
// ============================================

/**
 * Generate dynamic feedback dengan 3 komponen:
 * 1. Achievement Praise (pujian pencapaian)
 * 2. Specific Error Highlight (kesalahan spesifik)
 * 3. Motivation (motivasi ringan)
 */
const generateDynamicFeedback = (score, mistakes = [], totalWords = 0) => {
  const components = [];

  // 1. ACHIEVEMENT PRAISE (berdasarkan skor)
  const achievementPhrases = {
    excellent: [
      "Outstanding pronunciation!",
      "Your clarity is impressive!",
      "Nearly perfect pronunciation!",
      "Excellent job on your pronunciation!",
      "Your pronunciation skills are shining!"
    ],
    good: [
      "Pronunciation clarity is improving!",
      "Good progress on your pronunciation!",
      "You're doing well with your pronunciation!",
      "Nice work on most of the words!",
      "Your pronunciation is getting better!"
    ],
    fair: [
      "You're making progress!",
      "Keep practicing, you're improving!",
      "Some good pronunciation there!",
      "You're on the right track!",
      "Good effort, keep it up!"
    ],
    needsWork: [
      "Keep practicing, improvement is coming!",
      "Don't give up, you can do this!",
      "Every practice makes you better!",
      "Practice makes perfect!",
      "You're learning, keep going!"
    ]
  };

  let category;
  if (score >= 90) category = 'excellent';
  else if (score >= 75) category = 'good';
  else if (score >= 60) category = 'fair';
  else category = 'needsWork';

  const randomAchievement = achievementPhrases[category][
    Math.floor(Math.random() * achievementPhrases[category].length)
  ];
  components.push(randomAchievement);

  // 2. SPECIFIC ERROR HIGHLIGHT (jika ada kesalahan)
  if (mistakes && mistakes.length > 0) {
    const errorPhrases = [
      `You struggled with '${mistakes[0]}'—practice the sound carefully.`,
      `Watch the pronunciation of '${mistakes[0]}'.`,
      `'${mistakes[0]}' needs more attention—try breaking it down.`,
      `Focus on '${mistakes[0]}'—listen to native speakers.`,
      `The word '${mistakes[0]}' is tricky—practice it slowly.`
    ];

    if (mistakes.length > 1) {
      errorPhrases.push(
        `Work on '${mistakes[0]}' and '${mistakes[1]}'—they're challenging.`,
        `Pay attention to '${mistakes[0]}' and '${mistakes[1]}'.`
      );
    }

    const randomError = errorPhrases[Math.floor(Math.random() * errorPhrases.length)];
    components.push(randomError);
  } else {
    // Jika tidak ada kesalahan, beri pujian tambahan
    const perfectPhrases = [
      "All words pronounced correctly!",
      "No mistakes detected—amazing!",
      "Perfect pronunciation throughout!",
      "You nailed every word!"
    ];
    const randomPerfect = perfectPhrases[Math.floor(Math.random() * perfectPhrases.length)];
    components.push(randomPerfect);
  }

  // 3. MOTIVATION (motivasi ringan)
  const motivationPhrases = [
    "You're getting closer each time!",
    "Keep up the great work!",
    "You're making real progress!",
    "Your hard work is paying off!",
    "One step closer to fluency!",
    "You're doing amazing!",
    "Stay consistent and you'll succeed!",
    "You've got this!",
    "Your pronunciation journey is going well!",
    "Every practice counts!"
  ];

  const randomMotivation = motivationPhrases[
    Math.floor(Math.random() * motivationPhrases.length)
  ];
  components.push(randomMotivation);

  // Gabungkan ketiga komponen
  return components.join(' ');
};

/**
 * Generate feedback untuk detail hasil practice
 * Lebih panjang dengan tips spesifik
 */
const generateDetailedFeedback = (score, mistakes = [], correctWords = 0, totalWords = 0) => {
  const feedback = [];

  // Header dengan skor
  feedback.push(`Score: ${score}/100 (${correctWords}/${totalWords} words correct)\n`);

  // Analisis performa
  if (score >= 90) {
    feedback.push("🌟 Excellent! Your pronunciation is nearly perfect.");
  } else if (score >= 75) {
    feedback.push("👍 Good job! Your pronunciation is clear and understandable.");
  } else if (score >= 60) {
    feedback.push("📈 You're making progress. Keep practicing to improve clarity.");
  } else {
    feedback.push("Don't give up! Focus on each word and practice regularly.");
  }

  // Detail kesalahan
  if (mistakes && mistakes.length > 0) {
    feedback.push(`\nWords needing practice: ${mistakes.slice(0, 5).join(', ')}`);
    feedback.push("\nTips:");
    feedback.push("• Listen to native speakers pronouncing these words");
    feedback.push("• Break down each word into syllables");
    feedback.push("• Practice slowly, then gradually increase speed");
    feedback.push("• Record yourself and compare with native pronunciation");
  } else {
    feedback.push("\n✅ All words pronounced correctly! Excellent work!");
  }

  return feedback.join('\n');
};

module.exports = {
  generateDynamicFeedback,
  generateDetailedFeedback
};
