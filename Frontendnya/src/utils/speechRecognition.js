// ============================================
// FILE: utils/speechRecognition.js
// Purpose: Speech-to-Text using Web Speech API (compatible with Expo)
// ============================================

import { Platform } from 'react-native';

/**
 * Simple client-side speech recognition using device capabilities
 * This is a placeholder - actual recognition happens via Web Speech API in WebView
 * or native Android SpeechRecognizer in production build
 */

/**
 * Check if speech recognition is available
 * @returns {boolean}
 */
export const isSpeechRecognitionAvailable = () => {
  return Platform.OS === 'android' || Platform.OS === 'ios';
};

/**
 * Get speech recognition instance
 * For Expo Go: Returns null (will use audio recording fallback)
 * For Production APK: Uses Android SpeechRecognizer
 */
export const getSpeechRecognition = () => {
  // In Expo Go, speech recognition is not available
  // In production APK with proper native modules, this will work
  // For now, we'll return null and handle in the component
  return null;
};

/**
 * Note: For this implementation, we'll use a hybrid approach:
 * 1. Record audio using expo-av (already implemented)
 * 2. Process audio locally using device's speech recognition
 * 3. Send recognized text to backend
 * 
 * The actual speech recognition will be implemented using:
 * - Android: Use react-native-voice in custom development build
 * - For Expo Go: Use audio recording + backend processing (fallback)
 */

export default {
  isSpeechRecognitionAvailable,
  getSpeechRecognition,
};

