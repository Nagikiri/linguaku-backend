// src/screens/Material/PracticeScreen.js
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { Audio } from 'expo-av';
import {
  useSpeechRecognitionEvent,
  addSpeechRecognitionListener,
  ExpoSpeechRecognitionModule,
  AudioEncodingAndroid,
  AudioSourceAndroid,
} from "expo-speech-recognition";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getToken } from '../../utils/storage';
import { formatScore, displayScore } from '../../utils/scoreFormatter';

import { API_URL } from '../../config/api';

// Removed hardcoded API_URL - now using centralized config
const { width, height } = Dimensions.get('window');export const PracticeScreen = ({ route, navigation }) => {
  const material = route.params?.material || {
    _id: '69123b60cd286c75dfb01122',
    title: 'Basic Greetings',
    items: [{ text: 'Hello, how are you?' }],
  };

  // Extract text from material (handle both text and items structure)
  const materialText = material.text || (material.items && material.items[0]?.text) || 'Hello';

  // States
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [result, setResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [usingSpeechRecognition, setUsingSpeechRecognition] = useState(true); // Use speech recognition by default
  
  // Audio playback states (CRITICAL: these were missing, causing ReferenceError crash)
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUri, setAudioUri] = useState(null);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;
  const resultAnim = useRef(new Animated.Value(0)).current;
  const [wordAnimations, setWordAnimations] = useState([]);

  // Speech recognition event handlers with safe error handling
  useSpeechRecognitionEvent("result", (event) => {
    try {
      const transcript = event.results[0]?.transcript;
      if (transcript) {
        setRecognizedText(transcript);
        console.log('Recognized text:', transcript);
      }
    } catch (error) {
      console.error('Error handling speech recognition result:', error);
    }
  });

  useSpeechRecognitionEvent("end", () => {
    try {
      setIsRecording(false);
      console.log('Speech recognition ended');
    } catch (error) {
      console.error('Error handling speech recognition end:', error);
    }
  });

  useSpeechRecognitionEvent("error", (event) => {
    try {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
      Alert.alert(
        'Recognition Error', 
        'Failed to recognize speech. Please try again.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error handling speech recognition error event:', error);
      setIsRecording(false);
    }
  });

  useEffect(() => {
    if (isRecording) {
      startPulseAnimation();
      startWaveAnimation();
    } else {
      stopAnimations();
    }
  }, [isRecording]);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const startWaveAnimation = () => {
    Animated.loop(
      Animated.timing(waveAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();
  };

  const stopAnimations = () => {
    pulseAnim.stopAnimation();
    waveAnim.stopAnimation();
    pulseAnim.setValue(1);
    waveAnim.setValue(0);
  };

  const animateResult = () => {
    Animated.spring(resultAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  };

  // Record Functions - Updated to use BOTH Audio Recording AND Speech Recognition
  const startRecording = async () => {
    try {
      setIsRecording(true);
      setResult(null);
      setShowResult(false);
      setRecognizedText('');
      setAudioUri(null); // Reset audioUri when starting new recording

      // Request permissions
      const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!granted) {
        Alert.alert('Permission required', 'Please allow microphone access to record audio.');
        setIsRecording(false);
        return;
      }

      // ALSO request audio recording permission
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Start AUDIO RECORDING (for playback later)
      const recordingOptions = {
        android: {
          extension: '.m4a',
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_MPEG4AAC,
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
      };

      const { recording: newRecording } = await Audio.Recording.createAsync(recordingOptions);
      setRecording(newRecording);
      console.log('Audio recording started');

      // Start speech recognition with English language
      await ExpoSpeechRecognitionModule.start({
        lang: 'en-US',
        interimResults: true,
        maxAlternatives: 1,
        continuous: false,
        requiresOnDeviceRecognition: false,
        addsPunctuation: false,
        contextualStrings: [materialText], // Hint for better recognition
      });
      
      console.log('Speech recognition started');

    } catch (err) {
      console.error('Failed to start recording/recognition', err);
      setIsRecording(false);
      Alert.alert(
        'Error', 
        'Failed to start recording. Make sure you have internet connection and microphone permission.',
        [{ text: 'OK' }]
      );
    }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);
      
      // Stop speech recognition
      if (ExpoSpeechRecognitionModule) {
        await ExpoSpeechRecognitionModule.stop();
        console.log('Speech recognition stopped');
      }

      // Stop audio recording and get URI
      if (recording) {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        if (uri) {
          setAudioUri(uri); // SAVE URI for playback
          console.log('Audio saved to:', uri);
        }
        setRecording(null);
        console.log('Audio recording stopped');
      }
      
    } catch (err) {
      console.error('Failed to stop recording', err);
      setIsRecording(false);
    }
  };

  // Play Recording - with safe audio handling
  const playRecording = async () => {
    // Check if audioUri exists
    if (!audioUri) {
      console.warn('No audio URI available');
      return;
    }

    try {
      // If currently playing, stop first
      if (isPlaying && sound) {
        try {
          await sound.stopAsync();
          await sound.unloadAsync();
        } catch (stopError) {
          console.error('Error stopping sound:', stopError);
        }
        setSound(null);
        setIsPlaying(false);
        return;
      }

      // Load and play new sound
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true }
      );

      // Check if sound was created successfully
      if (!newSound) {
        throw new Error('Failed to create sound object');
      }

      setSound(newSound);
      setIsPlaying(true);

      // Set playback status update callback
      newSound.setOnPlaybackStatusUpdate((status) => {
        try {
          if (status.didJustFinish) {
            setIsPlaying(false);
            newSound.unloadAsync().catch(err => console.log('Unload error:', err));
            setSound(null);
          }
        } catch (callbackError) {
          console.error('Error in playback status callback:', callbackError);
        }
      });
    } catch (err) {
      console.error('Failed to play recording', err);
      setSound(null);
      setIsPlaying(false);
      Alert.alert('Error', 'Failed to play recording. Please try again.');
    }
  };

  // Cleanup sound on unmount - with safe error handling
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync().catch(err => {
          console.log('Sound cleanup error:', err);
          // Don't crash on cleanup errors
        });
      }
    };
  }, [sound]);

  // Analyze with Speech Recognition (No audio upload needed)
  const handleAnalyze = async (retryCount = 0) => {
    if (!recognizedText || recognizedText.trim() === '') {
      Alert.alert('Error', 'No speech recognized. Please try recording again.');
      return;
    }

    setAnalyzing(true);

    try {
      const token = await getToken();
      
      if (!token) {
        Alert.alert('Authentication Required', 'Please login again', [
          { text: 'OK', onPress: () => navigation.replace('Login') }
        ]);
        setAnalyzing(false);
        return;
      }

      // Send recognized text to backend (no audio file needed)
      const requestBody = {
        recognizedText: recognizedText,
        materialId: material._id
      };

      console.log('📤 Sending recognized text to:', `${API_URL}/practice/analyze`);
      console.log('📝 Material ID:', material._id);
      console.log('🗣️ Recognized Text:', recognizedText);

      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 60000)
      );

      // Race between fetch and timeout
      const response = await Promise.race([
        fetch(`${API_URL}/practice/analyze`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }),
        timeoutPromise
      ]);

      console.log(' Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Server error:', errorText);
        throw new Error(`Server error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Response data:', JSON.stringify(data, null, 2));

      if (data.success && data.data && data.data.result) {
        // Format score consistently
        const resultData = {
          ...data.data.result,
          score: formatScore(data.data.result.score),
          accuracy: formatScore(data.data.result.accuracy || data.data.result.score)
        };
        
        setResult(resultData);
        setShowResult(true);
        animateResult();
        prepareWordHighlight(resultData);
        
        Alert.alert(
          'Analysis Complete!',
          `Your score: ${displayScore(resultData.score)}`,
          [{ text: 'OK' }]
        );
      } else {
        throw new Error(data.message || 'Analysis failed - no result returned');
      }
    } catch (error) {
      console.error('❌ Analyze error:', error);
      
      // Auto retry once on network failure
      if ((error.message.includes('Network request failed') || error.message.includes('timeout')) && retryCount === 0) {
        console.log('🔄 Auto retrying...');
        setAnalyzing(false);
        setTimeout(() => handleAnalyze(1), 1000);
        return;
      }
      
      let errorMessage = 'Failed to analyze pronunciation.';
      
      if (error.message.includes('Network request failed') || error.message.includes('timeout')) {
        errorMessage = 'Connection issue. Please check your network and try again.';
      } else if (error.message.includes('401')) {
        errorMessage = 'Authentication expired. Please login again.';
      } else if (error.message.includes('500')) {
        errorMessage = 'Server error. Please try again later.';
      } else {
        errorMessage = `Error: ${error.message}`;
      }
      
      Alert.alert('Analysis Failed', errorMessage, [
        { text: 'Cancel' },
        { text: 'Retry', onPress: () => handleAnalyze(0) }
      ]);
    } finally {
      setAnalyzing(false);
    }
  };

  // Prepare word-by-word highlight
  const prepareWordHighlight = (resultData) => {
    const words = materialText.toLowerCase().split(' ');
    const transcribedWords = resultData.transcription.toLowerCase().split(' ');
    const mistakes = resultData.mistakeWords || [];

    const animations = words.map(() => new Animated.Value(0));
    setWordAnimations(animations);

    // Animate words one by one
    animations.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 300,
        delay: index * 150,
        useNativeDriver: true,
      }).start();
    });
  };

  const getWordColor = (word, index) => {
    if (!result) return '#0F172A';
    
    const transcribedWords = result.transcription.toLowerCase().split(' ');
    const mistakes = result.mistakeWords || [];
    
    // Check if word is in mistakes
    const isMistake = mistakes.some(m => 
      m.toLowerCase().includes(word.toLowerCase())
    );

    if (isMistake) {
      return '#EF4444'; // Red for mistakes
    } else if (transcribedWords.includes(word.toLowerCase())) {
      return '#10B981'; // Green for correct
    } else {
      return '#F59E0B'; // Orange for missing
    }
  };

  const renderMaterialText = () => {
    const words = materialText.split(' ');

    return (
      <View style={styles.materialTextContainer}>
        <Text style={styles.materialLabel}>Say this:</Text>
        <View style={styles.wordsContainer}>
          {words.map((word, index) => {
            const color = showResult ? getWordColor(word, index) : '#0F172A';
            const scale = wordAnimations[index] || new Animated.Value(1);

            return (
              <Animated.View
                key={index}
                style={{
                  transform: [{ scale: showResult ? scale : 1 }],
                  opacity: showResult ? scale : 1,
                }}
              >
                <Text
                  style={[
                    styles.materialWord,
                    { color: color },
                    showResult && { fontWeight: 'bold' }
                  ]}
                >
                  {word}
                </Text>
              </Animated.View>
            );
          })}
        </View>
      </View>
    );
  };

  const WaveBar = ({ delay }) => {
    const animValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      if (isRecording) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(animValue, {
              toValue: 1,
              duration: 400,
              delay: delay,
              useNativeDriver: true,
            }),
            Animated.timing(animValue, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
          ])
        ).start();
      } else {
        animValue.setValue(0);
      }
    }, [isRecording]);

    const scaleY = animValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.5, 2], // Scale from 50% to 200%
    });

    return (
      <Animated.View
        style={[
          styles.waveBar,
          {
            transform: [{ scaleY }],
          },
        ]}
      />
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{material.title}</Text>
          <Text style={styles.headerSubtitle}>Practice Pronunciation</Text>
        </View>
        <View style={styles.backButton} />
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Material Text Card */}
        <LinearGradient
          colors={['#F1F5F9', '#E2E8F0']}
          style={styles.materialCard}
        >
          {renderMaterialText()}
        </LinearGradient>

        {/* Audio Playback Button (if recorded) */}
        {audioUri && !showResult && (
          <TouchableOpacity 
            style={[styles.playbackButton, isPlaying && styles.playbackButtonActive]}
            onPress={playRecording}
            disabled={analyzing}
          >
            <LinearGradient
              colors={isPlaying ? ['#8B5CF6', '#7C3AED'] : ['#3B82F6', '#2563EB']}
              style={styles.playbackButtonGradient}
            >
              <Text style={styles.playbackIcon}>
                {isPlaying ? '⏸' : '▶'}
              </Text>
              <Text style={styles.playbackText}>
                {isPlaying ? 'Stop Playback' : 'Play Recording'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Recording Section */}
        <View style={styles.recordingSection}>
          {/* Waveform Animation */}
          {isRecording && (
            <View style={styles.waveformContainer}>
              <WaveBar delay={0} />
              <WaveBar delay={100} />
              <WaveBar delay={200} />
              <WaveBar delay={300} />
              <WaveBar delay={400} />
              <WaveBar delay={300} />
              <WaveBar delay={200} />
              <WaveBar delay={100} />
            </View>
          )}

          {/* Record Button */}
          <Animated.View
            style={{
              transform: [{ scale: isRecording ? pulseAnim : 1 }],
            }}
          >
            <TouchableOpacity
              style={[
                styles.recordButton,
                isRecording && styles.recordButtonActive,
              ]}
              onPress={isRecording ? stopRecording : startRecording}
              disabled={analyzing}
            >
              <LinearGradient
                colors={
                  isRecording
                    ? ['#EF4444', '#DC2626']
                    : ['#6366F1', '#8B5CF6']
                }
                style={styles.recordButtonGradient}
              >
                <Text style={styles.recordIcon}>
                  {isRecording ? '⏸' : '🎤'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <Text style={styles.recordText}>
            {isRecording
              ? 'Tap to Stop Recording'
              : recognizedText
              ? 'Tap to Record Again'
              : 'Tap to Start Recording'}
          </Text>

          {/* Show recognized text */}
          {recognizedText && !showResult && (
            <View style={styles.recognizedTextContainer}>
              <Text style={styles.recognizedLabel}>You said:</Text>
              <Text style={styles.recognizedText}>"{recognizedText}"</Text>
            </View>
          )}
        </View>

        {/* Analyze Button */}
        {recognizedText && !showResult && (
          <TouchableOpacity
            style={[styles.analyzeButton, analyzing && styles.analyzeButtonDisabled]}
            onPress={handleAnalyze}
            disabled={analyzing}
          >
            <LinearGradient
              colors={['#10B981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.analyzeButtonGradient}
            >
              <Text style={styles.analyzeButtonText}>
                {analyzing ? '🔄 Analyzing...' : '✨ Analyze Pronunciation'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Result Section */}
        {showResult && result && (
          <Animated.View
            style={[
              styles.resultContainer,
              {
                opacity: resultAnim,
                transform: [
                  {
                    translateY: resultAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {/* Score Circle */}
            <View style={styles.scoreSection}>
              <LinearGradient
                colors={
                  result.score >= 90
                    ? ['#10B981', '#059669']
                    : result.score >= 75
                    ? ['#3B82F6', '#2563EB']
                    : result.score >= 60
                    ? ['#F59E0B', '#D97706']
                    : ['#EF4444', '#DC2626']
                }
                style={styles.scoreCircle}
              >
                <Text style={styles.scoreText}>{displayScore(result.score)}</Text>
                <Text style={styles.scoreLabel}>Score</Text>
              </LinearGradient>
            </View>

            {/* Details */}
            <View style={styles.detailsCard}>
              <Text style={styles.detailsTitle}>📊 Analysis Result</Text>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Your pronunciation:</Text>
                <Text style={styles.detailValue}>"{result.transcription}"</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Accuracy:</Text>
                <Text style={styles.detailValue}>{displayScore(result.accuracy)}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Correct words:</Text>
                <Text style={styles.detailValue}>
                  {result.correctWords} / {result.totalWords}
                </Text>
              </View>

              {result.mistakeWords && result.mistakeWords.length > 0 && (
                <View style={styles.mistakesContainer}>
                  <Text style={styles.mistakesTitle}>⚠️ Words to Practice:</Text>
                  <View style={styles.mistakesRowContainer}>
                    {result.mistakeWords.slice(0, 6).map((mistake, index) => (
                      <View key={index} style={styles.mistakeChipHorizontal}>
                        <Ionicons name="close-circle" size={16} color="#EF4444" />
                        <Text style={styles.mistakeText}>{mistake}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              <View style={styles.feedbackContainer}>
                <Text style={styles.feedbackTitle}>💡 Feedback:</Text>
                <Text style={styles.feedbackText}>{result.feedback}</Text>
              </View>
            </View>

            {/* Try Again Button */}
            <TouchableOpacity
              style={styles.tryAgainButton}
              onPress={() => {
                setResult(null);
                setShowResult(false);
                setRecognizedText('');
                setAudioUri(null); // Reset audio URI
                resultAnim.setValue(0);
              }}
            >
              <Text style={styles.tryAgainText}>🔄 Try Again</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 32,
    color: '#0F172A',
    fontWeight: 'bold',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  materialCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  materialTextContainer: {
    // spacing
  },
  materialLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366F1',
    marginBottom: 12,
  },
  wordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  materialWord: {
    fontSize: 28,
    fontWeight: '600',
    lineHeight: 40,
  },
  playbackButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  playbackButtonActive: {
    shadowColor: '#8B5CF6',
  },
  playbackButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  playbackIcon: {
    fontSize: 20,
    color: '#FFFFFF',
    marginRight: 8,
  },
  playbackText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  recordingSection: {
    alignItems: 'center',
    marginVertical: 32,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 80,
    marginBottom: 24,
    gap: 6,
  },
  waveBar: {
    width: 6,
    height: 30, // Base height yang akan di-scale
    backgroundColor: '#6366F1',
    borderRadius: 3,
  },
  recordButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  recordButtonActive: {
    shadowColor: '#EF4444',
  },
  recordButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordIcon: {
    fontSize: 48,
  },
  recordText: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
  },
  recognizedTextContainer: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3B82F6',
    alignSelf: 'stretch',
    marginHorizontal: 24,
  },
  recognizedLabel: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
    marginBottom: 8,
  },
  recognizedText: {
    fontSize: 16,
    color: '#0F172A',
    fontWeight: '500',
  },
  analyzeButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginVertical: 16,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  analyzeButtonDisabled: {
    opacity: 0.6,
  },
  analyzeButtonGradient: {
    padding: 18,
    alignItems: 'center',
  },
  analyzeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  resultContainer: {
    marginTop: 24,
  },
  scoreSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  scoreCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  scoreText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scoreLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 4,
    opacity: 0.9,
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 20,
  },
  detailRow: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 6,
  },
  detailValue: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0F172A',
  },
  mistakesContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  mistakesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 12,
  },
  mistakesRowContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mistakeChipHorizontal: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  mistakeChip: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  mistakeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
  },
  feedbackContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 8,
  },
  feedbackText: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
  },
  tryAgainButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#6366F1',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  tryAgainText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#6366F1',
  },
  recognizedTextContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  recognizedLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 4,
  },
  recognizedText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E3A8A',
  },
});