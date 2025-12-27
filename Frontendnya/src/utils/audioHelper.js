import { Audio } from 'expo-av';
import { Alert } from 'react-native';

/**
 * Safe audio utility functions with comprehensive error handling
 * Prevents all common audio-related crashes
 */

class AudioHelper {
  /**
   * Request microphone permission safely
   */
  static async requestMicrophonePermission() {
    try {
      const { status, canAskAgain } = await Audio.requestPermissionsAsync();
      
      if (status === 'granted') {
        return true;
      }
      
      if (!canAskAgain) {
        Alert.alert(
          'Permission Denied',
          'Please enable microphone permission in your device settings.',
          [{ text: 'OK' }]
        );
      }
      
      return false;
      
    } catch (error) {
      console.error('Error requesting microphone permission:', error);
      return false;
    }
  }
  
  /**
   * Create audio recording safely
   */
  static async createRecording() {
    try {
      // Request permission
      const hasPermission = await this.requestMicrophonePermission();
      if (!hasPermission) {
        return null;
      }
      
      // Set audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false,
      });
      
      // Create recording object
      const recording = new Audio.Recording();
      
      // Prepare to record
      await recording.prepareToRecordAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      return recording;
      
    } catch (error) {
      console.error('Error creating recording:', error);
      Alert.alert('Error', 'Could not initialize audio recording.');
      return null;
    }
  }
  
  /**
   * Start recording safely
   */
  static async startRecording(recording) {
    try {
      if (!recording) {
        throw new Error('Recording object is null');
      }
      
      await recording.startAsync();
      console.log('Recording started');
      return true;
      
    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Error', 'Could not start recording.');
      return false;
    }
  }
  
  /**
   * Stop recording safely
   */
  static async stopRecording(recording) {
    try {
      if (!recording) {
        console.warn('No recording to stop');
        return null;
      }
      
      const status = await recording.getStatusAsync();
      
      if (!status.isRecording) {
        console.warn('Recording is not active');
        return null;
      }
      
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });
      
      console.log('Recording stopped, URI:', uri);
      return uri;
      
    } catch (error) {
      console.error('Error stopping recording:', error);
      return null;
    }
  }
  
  /**
   * Load sound file safely
   */
  static async loadSound(source) {
    try {
      const { sound, status } = await Audio.Sound.createAsync(
        source,
        { shouldPlay: false },
        null  // No status update callback initially
      );
      
      if (!sound) {
        throw new Error('Failed to create sound object');
      }
      
      console.log('Sound loaded successfully');
      return sound;
      
    } catch (error) {
      console.error('Error loading sound:', error);
      Alert.alert('Error', 'Could not load audio file.');
      return null;
    }
  }
  
  /**
   * Play sound safely
   */
  static async playSound(sound) {
    try {
      if (!sound) {
        console.warn('Sound object is null');
        return false;
      }
      
      const status = await sound.getStatusAsync();
      
      if (!status.isLoaded) {
        console.warn('Sound not loaded');
        return false;
      }
      
      // If already playing, stop first
      if (status.isPlaying) {
        await sound.stopAsync();
      }
      
      // Reset position to start
      await sound.setPositionAsync(0);
      
      // Play
      await sound.playAsync();
      console.log('Sound playing');
      return true;
      
    } catch (error) {
      console.error('Error playing sound:', error);
      return false;
    }
  }
  
  /**
   * Stop sound safely
   */
  static async stopSound(sound) {
    try {
      if (!sound) {
        return;
      }
      
      const status = await sound.getStatusAsync();
      
      if (status.isLoaded && status.isPlaying) {
        await sound.stopAsync();
        console.log('Sound stopped');
      }
      
    } catch (error) {
      console.error('Error stopping sound:', error);
    }
  }
  
  /**
   * Unload sound safely (cleanup)
   */
  static async unloadSound(sound) {
    try {
      if (!sound) {
        return;
      }
      
      const status = await sound.getStatusAsync();
      
      if (status.isLoaded) {
        await sound.unloadAsync();
        console.log('Sound unloaded');
      }
      
    } catch (error) {
      console.error('Error unloading sound:', error);
    }
  }
  
  /**
   * Get recording duration safely
   */
  static async getRecordingDuration(recording) {
    try {
      if (!recording) {
        return 0;
      }
      
      const status = await recording.getStatusAsync();
      return status.durationMillis || 0;
      
    } catch (error) {
      console.error('Error getting recording duration:', error);
      return 0;
    }
  }
}

export default AudioHelper;
