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
async function generateDetailedFeedback(materialText, transcription, mistakes) {
  try {


    // Get Gemini model (updated to 1.5-flash)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

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

    // Construct improved prompt for better evaluation
    const prompt = `You are a pronunciation evaluation assistant for a language learning app.

Your task:
Compare the user's transcribed speech with the target sentence.
Evaluate pronunciation accuracy based on word-by-word similarity.

CRITICAL RULES:
1. Focus on word correctness and word order
2. IGNORE punctuation completely
3. IGNORE case differences (uppercase/lowercase)
4. IGNORE filler words (uh, um, eh, hmm, er, ah)
5. DO NOT convert spoken numbers to digits or time formats
   Example: "six" must stay "six" (NOT "6", "06", "06:00")
6. Be TOLERANT to small pronunciation variations
7. If 90%+ of words are correct, consider it excellent (score 90-100)
8. For long sentences (3-4+ words), do NOT penalize harshly for one mistake
9. Calculate score per word, then average
10. Round final score to ONE decimal place only
${ACCENT_MODE === 'indonesian' ? `
11. INDONESIAN ACCENT-AWARE MODE:
   - Accept "th" as "t" (three → tree)
   - Accept "v" and "f" similar sounds
   - Accept "z" and "s" similar sounds
   - Accept rolling/strong "r"
   - DO NOT penalize Indonesian accent features
   - Focus ONLY on intelligibility and word correctness
` : ''}

Target sentence: "${materialText}"
User's transcription: "${transcription}"
Identified mistakes: ${mistakes.length > 0 ? mistakes.join(', ') : 'None'}

Provide evaluation feedback in this format:

**Overall Assessment:**
[1-2 sentences acknowledging what they did well and overall quality]

**Specific Feedback:**
${mistakes.length > 0 ? `
- For each mistake word, explain:
  * What the correct pronunciation should sound like
  * A simple tip to improve
  * Example: "For 'are', emphasize the 'r' sound - try 'arrr' like a pirate!"
` : 'Perfect pronunciation! All words were clear and accurate.'}

**Encouragement:**
[1 sentence to motivate continued practice, be positive and supportive]

**IMPORTANT CONSTRAINTS:**
- Keep it friendly, conversational, and helpful
- Use simple language (avoid technical jargon)
- Maximum 150 words total
- If pronunciation is perfect or near-perfect, be enthusiastic!
- Current mode: ${ACCENT_MODE === 'indonesian' ? 'INDONESIAN ACCENT-AWARE (tolerant)' : 'STRICT NATIVE ENGLISH'}
- DO NOT claim phoneme analysis (you cannot do acoustic analysis)
- DO NOT claim accent detection (you cannot hear audio)
- DO NOT claim intonation analysis (text-based only)
- BE HONEST: Your evaluation is text-based similarity, not acoustic analysis

Generate the feedback now:
    `.trim();

    // Call Gemini API
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
    console.error('Gemini API Error:', error.message);
    console.log('Falling back to generic feedback...');
    console.log('');

    // Fallback to generic feedback
    return {
      success: false,
      feedback: generateGenericFeedback(materialText, transcription, mistakes),
      source: 'Fallback Generic',
      error: error.message
    };
  }
}

/**
 * Generate generic feedback (fallback when Gemini fails)
 * @param {string} materialText - Expected text
 * @param {string} transcription - User's transcription
 * @param {array} mistakes - Mistake words
 * @returns {string} - Generic feedback
 */
function generateGenericFeedback(materialText, transcription, mistakes) {
  if (mistakes.length === 0) {
    return `Excellent! Your pronunciation of "${materialText}" is very clear and accurate. You pronounced all words correctly! Keep up the great work and continue practicing to maintain this level of fluency.`;
  } else if (mistakes.length === 1) {
    return `Great job! You pronounced most of the words correctly. Just pay attention to the word "${mistakes[0]}" - try pronouncing it more clearly. Practice this word separately a few times, then try the full sentence again. You're doing well!`;
  } else if (mistakes.length <= 3) {
    return `Good effort! You got the overall rhythm right. Focus on these words: ${mistakes.join(', ')}. Try breaking them into syllables and pronounce each syllable slowly. For example, "hel-lo" or "beau-ti-ful". Then gradually speed up. Keep practicing!`;
  } else {
    return `Keep practicing! This sentence is challenging. Focus on the first few words: ${mistakes.slice(0, 3).join(', ')}. Master these first before moving to the rest. Remember: slow and clear is better than fast and unclear. You can do it!`;
  }
}

/**
 * Generate pronunciation tips for specific word
 * @param {string} word - The word to get tips for
 * @returns {string} - Pronunciation tip
 */
async function getWordPronunciationTip(word) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

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