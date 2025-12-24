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

    // Construct detailed prompt
    const prompt = `
You are an expert English pronunciation teacher. Analyze this pronunciation practice for a learner.

${accentInstructions}

**Expected Text:** "${materialText}"
**User's Pronunciation:** "${transcription}"
**Identified Mistakes:** ${mistakes.length > 0 ? mistakes.join(', ') : 'None - Perfect pronunciation!'}

Provide a detailed, encouraging feedback that includes:

1. **Overall Assessment** (1-2 sentences)
   - Acknowledge what they did well
   - Overall pronunciation quality

2. **Specific Feedback** (if there are mistakes)
   - For each mistake, explain:
     * What the correct pronunciation should sound like
     * A simple tip or technique to improve
     * Example: "For 'are', emphasize the 'r' sound - try 'arrr' like a pirate!"
   - ${ACCENT_MODE === 'indonesian' ? 'Focus only on mistakes that affect clarity, not accent features.' : 'Be thorough about all pronunciation deviations.'}

3. **Encouragement** (1 sentence)
   - Motivate them to keep practicing
   - Be positive and supportive
   - ${ACCENT_MODE === 'indonesian' ? 'Emphasize that accent is natural and acceptable.' : 'Encourage progress toward native-like pronunciation.'}

**IMPORTANT:**
- Keep it friendly, conversational, and helpful
- Use simple language (avoid technical jargon)
- Maximum 150 words
- If pronunciation is perfect, be enthusiastic!
- Current evaluation mode: ${ACCENT_MODE === 'indonesian' ? 'INDONESIAN ACCENT-AWARE' : 'STRICT NATIVE ENGLISH'}

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