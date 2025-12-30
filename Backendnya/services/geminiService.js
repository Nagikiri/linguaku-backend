// services/geminiService.js
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Get accent mode from environment variables
const ACCENT_MODE = process.env.ACCENT_MODE || 'indonesian';

/**
 * Generate detailed pronunciation feedback using Gemini AI
 * @param {string} materialText - Expected text to pronounce
 * @param {string} transcription - What user actually said
 * @param {array} mistakes - Array of mistake words
 * @returns {object} - Feedback object
 */
let geminiApiCallCount = 0;

async function generateDetailedFeedback(materialText, transcription, mistakes, retryCount = 0) {
  const MAX_RETRIES = 2;
  
  try {
    // Validate API key first
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured in environment variables');
    }

    // Get Gemini model (updated to 2.5-flash - latest available model)
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    });

    // Build accent-aware instructions based on mode
    const accentInstructions = ACCENT_MODE === 'indonesian' ? `
**IMPORTANT ACCENT RULES FOR INDONESIAN SPEAKERS:**
- The speaker is Indonesian learning English.
- DO NOT penalize natural Indonesian accent features:
  • "th" pronounced as "t" (three → tree, there → tere)
  • Rolling or strong "r" sound
  • "v" and "f" sounding similar (very → fery, five → fife)
  • "z" and "s" sounding similar (zero → sero, zone → sone)
  • Softer or missing aspiration in "p/t/k" sounds
  • Flatter intonation (no native-like melody required)
- ONLY correct mistakes that change meaning or significantly affect clarity.
- Focus on intelligibility and key sounds, NOT native-like accuracy.
- DO NOT compare to US or UK native pronunciation standards.
- Be encouraging and supportive of accent diversity.
` : `
**STRICT NATIVE ENGLISH PRONUNCIATION MODE:**
- Evaluate pronunciation against native English (US/UK) standards.
- Pay attention to all phonetic details including:
  • Correct "th" sound (not "t")
  • Proper "v" and "f" distinction
  • Clear "z" and "s" differences
  • Proper aspiration in "p/t/k" sounds
  • Natural English intonation and rhythm
- Provide detailed corrections for any deviations from native pronunciation.
- Be constructive but thorough in identifying pronunciation errors.
`;

    // Construct ENHANCED prompt for ACCURATE pronunciation evaluation
    const prompt = `You are an EXPERT pronunciation evaluation assistant for LinguaKu - an AI-powered English learning app.

🎯 YOUR MISSION:
Analyze the user's English pronunciation by comparing their spoken transcription with the target sentence.
Provide ACTIONABLE, ENCOURAGING, and PRECISE feedback to help them improve.

📋 CRITICAL ANALYSIS RULES:
1. ✅ Focus on word correctness, clarity, and word order
2. ✅ IGNORE punctuation completely (,!?.;:)
3. ✅ IGNORE case differences (HELLO = hello = Hello)
4. ✅ IGNORE filler words: uh, um, eh, hmm, er, ah, like, you know
5. ✅ DO NOT convert spoken words to digits ("six" ≠ "6")
6. ✅ Be TOLERANT to minor pronunciation variations
7. ✅ If 95%+ words correct → EXCELLENT (score 95-100)
8. ✅ If 80-94% correct → GOOD (score 80-94)
9. ✅ If 60-79% correct → NEEDS PRACTICE (score 60-79)
10. ✅ If <60% correct → KEEP TRYING (score <60)

${ACCENT_MODE === 'indonesian' ? `
🇮🇩 INDONESIAN ACCENT-AWARE MODE (ACTIVE):
- ✅ ACCEPT "th" as "t" (three → tree, think → tink)
- ✅ ACCEPT "v" and "f" interchange (very → fery, five → fife)
- ✅ ACCEPT "z" and "s" similarity (zero → sero, zone → sone)
- ✅ ACCEPT rolling/strong "r" sound (Indonesian-style)
- ✅ ACCEPT softer "p/t/k" sounds (less aspiration)
- ✅ DO NOT penalize flat intonation (no melody required)
- 🎯 ONLY correct mistakes that change MEANING or harm CLARITY
- 💡 Focus on INTELLIGIBILITY, not native-like perfection
- 🚫 DO NOT compare to US/UK native standards
- ❤️ Be ENCOURAGING and celebrate accent diversity!
` : `
🇬🇧 STRICT NATIVE ENGLISH MODE (ACTIVE):
- Evaluate against native English (US/UK) pronunciation standards
- Pay attention to: th-sounds, v/f distinction, z/s clarity, aspiration, intonation
- Provide detailed corrections for deviations from native pronunciation
`}

📝 INPUT DATA:
Target Sentence: "${materialText}"
User's Transcription: "${transcription}"
Detected Mistakes: ${mistakes.length > 0 ? `[${mistakes.join(', ')}]` : 'None - Perfect!'}

📊 REQUIRED OUTPUT FORMAT:

**Penilaian Keseluruhan:**
[1-2 kalimat dalam BAHASA INDONESIA yang memuji apa yang sudah benar dan kualitas secara keseluruhan]

**Feedback Spesifik:**
${mistakes.length > 0 ? `
[Untuk SETIAP kata yang salah, berikan dalam BAHASA INDONESIA:]  
- Kata: [kata yang salah]
- Seharusnya: [bunyi yang benar, contoh: "hello" → "hel-lo"]
- Tips: [saran praktis untuk memperbaiki, maksimal 1-2 kalimat]
- Contoh: "Untuk kata 'are', tekankan bunyi 'r' nya - coba 'arrr' seperti bajak laut! 🏴‍☠️"
` : `
Sempurna! Semua kata diucapkan dengan jelas dan akurat. Tidak ada kesalahan! 🎉`}

**Motivasi:**
[1 kalimat dalam BAHASA INDONESIA untuk memotivasi latihan terus, positif dan mendukung! Gunakan emoji yang relevan]

⚠️ CONSTRAINTS:
- ✅ Gunakan BAHASA INDONESIA untuk semua feedback
- ✅ Ramah, conversational, dan membantu
- ✅ Hindari jargon teknis (fonem, alofon, dll)
- ✅ Maksimal 200 kata total
- ✅ Jika sempurna/hampir sempurna, tunjukkan antusiasme!
- ✅ Gunakan emoji yang relevan (🎯, ✅, 💡, 🎉, 🚀, dll)
- 🚫 JANGAN klaim analisis fonetik akustik (kamu hanya lihat teks)
- 🚫 JANGAN klaim deteksi aksen (kamu tidak bisa dengar audio)
- 🚫 JANGAN klaim analisis intonasi (berbasis teks saja)
- ✅ JUJUR: evaluasi kamu berbasis similaritas teks, bukan analisis audio

Mode: ${ACCENT_MODE === 'indonesian' ? '🇮🇩 INDONESIAN ACCENT-AWARE (Toleran)' : '🇬🇧 STRICT NATIVE ENGLISH'}

🚀 Generate feedback sekarang:
    `.trim();


    // Call Gemini API
    geminiApiCallCount++;
    console.log(`[Gemini API] Call #${geminiApiCallCount} at`, new Date().toISOString());
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const feedback = response.text();

    console.log('Gemini feedback generated successfully!');
    console.log('Feedback length:', feedback.length, 'characters');
    console.log(`Accent Mode: ${ACCENT_MODE}`);
    console.log('');

    return {
      success: true,
      feedback: feedback.trim(),
      source: 'Gemini AI',
      accentMode: ACCENT_MODE
    };

  } catch (error) {
    console.error('❌ Gemini API Error:', error.message);
    
    // Retry mechanism for transient errors
    if (retryCount < MAX_RETRIES && 
        (error.message.includes('timeout') || 
         error.message.includes('503') || 
         error.message.includes('ECONNRESET'))) {
      console.log(`🔄 Retrying Gemini API... (Attempt ${retryCount + 1}/${MAX_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
      return generateDetailedFeedback(materialText, transcription, mistakes, retryCount + 1);
    }
    
    // If all retries fail or non-retriable error, return error
    console.error('❌ All Gemini API attempts failed');
    return {
      success: false,
      feedback: null,
      source: 'Gemini AI (Failed)',
      error: error.message,
      errorType: error.name
    };
  }
}

// ✅ NO HARDCODE FALLBACK - Always use Gemini AI for feedback generation
// If Gemini fails, return error to client instead of using generic template

/**
 * Generate pronunciation tips for specific word
 * @param {string} word - The word to get tips for
 * @returns {string} - Pronunciation tip
 */
async function getWordPronunciationTip(word) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
Give a simple, practical pronunciation tip for the English word "${word}".

Format:
- One sentence explanation of correct pronunciation
- One practical tip or technique
- Maximum 50 words

Example:
"For 'through', pronounce it like 'threw'. The 'th' is soft (tongue between teeth), followed by 'roo'. Try saying 'th-roo' slowly, then blend it together."

Generate tip for "${word}":
    `.trim();

    const result = await model.generateContent(prompt);
    const tip = result.response.text();

    return tip.trim();
  } catch (error) {
    return `Practice the word "${word}" slowly, focusing on each sound. Break it into syllables if needed.`;
  }
}

module.exports = {
  generateDetailedFeedback,
  getWordPronunciationTip
};