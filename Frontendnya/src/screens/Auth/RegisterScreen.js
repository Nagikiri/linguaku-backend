// src/screens/Auth/RegisterScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  StatusBar,
  Keyboard,
  ActivityIndicator,
  TouchableWithoutFeedback,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { saveToken, saveUser } from '../../utils/storage';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

const { width, height } = Dimensions.get('window');

import { API_URL } from '../../config/api';

// Removed hardcoded API_URL - now using centralized config

export const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // CRITICAL FIX: Use ref for focus state to prevent re-render
  const nameFocused = useRef(false);
  const emailFocused = useRef(false);
  const passwordFocused = useRef(false);
  const confirmPasswordFocused = useRef(false);

  // Animations - simplified, no entrance animation
  const buttonAnim = useRef(new Animated.Value(1)).current;
  
  // Refs for TextInput
  const nameInputRef = useRef(null);
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const confirmPasswordInputRef = useRef(null);
  const scrollViewRef = useRef(null);
  
  // CRITICAL FIX: Keyboard state in REF to prevent re-render
  const keyboardState = useRef({ visible: false, height: 0 });

  // Google Sign-In
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: 'YOUR_EXPO_CLIENT_ID',
    iosClientId: 'YOUR_IOS_CLIENT_ID',
    androidClientId: 'YOUR_ANDROID_CLIENT_ID',
    webClientId: 'YOUR_WEB_CLIENT_ID',
  });

  // CRITICAL FIX: Keyboard listeners only - no animations
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    
    const keyboardDidShowListener = Keyboard.addListener(showEvent, (e) => {
      // Update ref ONLY - no setState, no re-render
      keyboardState.current = { visible: true, height: e.endCoordinates.height };
    });
    
    const keyboardDidHideListener = Keyboard.addListener(hideEvent, () => {
      // Update ref ONLY - no setState, no re-render
      keyboardState.current = { visible: false, height: 0 };
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  useEffect(() => {
    if (response?.type === 'success') {
      handleGoogleSignIn(response.authentication.idToken);
    }
  }, [response]);

  const handleRegister = async () => {
    // CRITICAL: Dismiss keyboard FIRST to prevent flicker
    Keyboard.dismiss();
    
    // Validation
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Required Fields', 'Please complete all required fields');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    // Password validation - STRICT RULES
    if (password.length < 8) {
      Alert.alert('Weak Password', 'Password must be at least 8 characters');
      return;
    }

    if (!/[A-Z]/.test(password)) {
      Alert.alert('Weak Password', 'Password must contain at least 1 uppercase letter');
      return;
    }

    if (!/[0-9]/.test(password)) {
      Alert.alert('Weak Password', 'Password must contain at least 1 number');
      return;
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      Alert.alert('Weak Password', 'Password must contain at least 1 symbol (!@#$%^&*...)');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Password and confirmation password must match');
      return;
    }

    // Animate button
    Animated.sequence([
      Animated.timing(buttonAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.toLowerCase().trim(),
          password: password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // CHECK IF REQUIRES VERIFICATION (new flow)
        if (data.requiresVerification) {
          console.log('✅ Registration successful - Email verification required');
          Alert.alert(
            '✅ Registration Successful!',
            'Please check your email for verification.',
            [
              {
                text: 'OK',
                onPress: () =>
                  navigation.navigate('EmailVerification', {
                    email: data.data.email,
                    name: data.data.name || name
                  })
              }
            ]
          );
        } else {
          // Old flow - with auto-login (for backward compatibility)
          await saveToken(data.data.token);
          await saveUser(data.data.user);
          console.log('✅ Registration successful');
          navigation.replace('Main');
        }
      } else {
        Alert.alert('Registration Failed', data.message || 'An error occurred');
      }
    } catch (error) {
      console.error('Register error:', error);
      Alert.alert('Connection Error', 'Cannot connect to server. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async (idToken) => {
    if (!idToken) {
      Alert.alert('Failed', 'Google sign-in was unsuccessful');
      return;
    }

    setGoogleLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      });

      const data = await response.json();

      if (data.success) {
        await saveToken(data.data.token);
        await saveUser(data.data.user);
        
        console.log('✅ Google registration successful');
        navigation.replace('Main');
      } else {
        Alert.alert('Registration Failed', data.message || 'An error occurred while registering with Google');
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      Alert.alert('Connection Error', 'Cannot connect to server.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={['#58CC02', '#89E219']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.background}
      >
        {/* Decorative Circles */}
        <View style={styles.circle1} />
        <View style={styles.circle2} />
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
            removeClippedSubviews={false}
          >
          {/* Logo Section - NO ANIMATION */}
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
                <LinearGradient
                  colors={['#FFFFFF', '#F0F0F0']}
                  style={styles.logoCircle}
                >
                  <Ionicons name="mic" size={48} color="#58CC02" />
                </LinearGradient>
              </View>
            <Text style={styles.logoText}>LinguaKu</Text>
            <Text style={styles.logoSubtext}>Start Your Learning Journey</Text>
          </View>

          {/* Form Section - NO ANIMATION */}
          <View style={styles.formSection}>
            <View style={styles.formCard}>
              <Text style={styles.welcomeText}>Create Account</Text>
              <Text style={styles.subtitleText}>Sign up to get started</Text>

              {/* Name Input */}
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="person-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    ref={nameInputRef}
                    style={styles.input}
                    placeholder="Enter your full name"
                    placeholderTextColor="#94A3B8"
                    value={name}
                    onChangeText={(text) => setName(text)}
                    onFocus={() => { nameFocused.current = true; }}
                    onBlur={() => { nameFocused.current = false; }}
                    autoCapitalize="words"
                    returnKeyType="next"
                    textContentType="name"
                    importantForAutofill="yes"
                    editable={!loading && !googleLoading}
                    blurOnSubmit={false}
                    onSubmitEditing={() => emailInputRef.current?.focus()}
                  />
                </View>
              </View>

              {/* Email Input */}
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Email</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="mail-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    ref={emailInputRef}
                    style={styles.input}
                    placeholder="Enter your email address"
                    placeholderTextColor="#94A3B8"
                    value={email}
                    onChangeText={(text) => setEmail(text)}
                    onFocus={() => { emailFocused.current = true; }}
                    onBlur={() => { emailFocused.current = false; }}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoCorrect={false}
                    returnKeyType="next"
                    textContentType="emailAddress"
                    importantForAutofill="yes"
                    editable={!loading && !googleLoading}
                    blurOnSubmit={false}
                    onSubmitEditing={() => passwordInputRef.current?.focus()}
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    ref={passwordInputRef}
                    style={styles.input}
                    placeholder="At least 6 characters"
                    placeholderTextColor="#94A3B8"
                    value={password}
                    onChangeText={(text) => setPassword(text)}
                    onFocus={() => { passwordFocused.current = true; }}
                    onBlur={() => { passwordFocused.current = false; }}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    returnKeyType="next"
                    textContentType="newPassword"
                    importantForAutofill="yes"
                    editable={!loading && !googleLoading}
                    blurOnSubmit={false}
                    onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons 
                      name={showPassword ? 'eye-outline' : 'eye-off-outline'} 
                      size={20} 
                      color="#94A3B8" 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirm Password Input */}
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Confirm Password</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" style={styles.inputIcon} />
                  <TextInput
                    ref={confirmPasswordInputRef}
                    style={styles.input}
                    placeholder="Re-enter password"
                    placeholderTextColor="#94A3B8"
                    value={confirmPassword}
                    onChangeText={(text) => setConfirmPassword(text)}
                    onFocus={() => { confirmPasswordFocused.current = true; }}
                    onBlur={() => { confirmPasswordFocused.current = false; }}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    returnKeyType="done"
                    onSubmitEditing={handleRegister}
                    textContentType="newPassword"
                    importantForAutofill="yes"
                    editable={!loading && !googleLoading}
                    blurOnSubmit={true}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons 
                      name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'} 
                      size={20} 
                      color="#94A3B8" 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Register Button */}
              <Animated.View style={{ transform: [{ scale: buttonAnim }], marginTop: 8 }}>
                <TouchableOpacity
                  style={styles.registerButton}
                  onPress={handleRegister}
                  disabled={loading || googleLoading}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#58CC02', '#78D919']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.registerButtonGradient}
                  >
                    {loading ? (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator color="#FFFFFF" size="small" />
                        <Text style={styles.registerButtonText}>Creating account...</Text>
                      </View>
                    ) : (
                      <Text style={styles.registerButtonText}>Sign Up</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Google Sign-In Button */}
              <TouchableOpacity
                style={styles.googleButton}
                onPress={() => promptAsync()}
                disabled={loading || googleLoading || !request}
              >
                {googleLoading ? (
                  <ActivityIndicator color="#0F172A" size="small" />
                ) : (
                  <>
                    <Ionicons name="logo-google" size={24} color="#DB4437" />
                    <Text style={styles.googleButtonText}>Continue with Google</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Login Link */}
              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.loginLink}>Sign In</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#58CC02',
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  circle1: {
    position: 'absolute',
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    top: -120,
    right: -100,
  },
  circle2: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    bottom: -80,
    left: -80,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingVertical: Platform.OS === 'ios' ? 50 : 30,
  },
  logoSection: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 20,
  },
  logoContainer: {
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 40,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: -1,
  },
  logoSubtext: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: '600',
  },
  formSection: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 28,
    paddingTop: 36,
    paddingBottom: Platform.OS === 'ios' ? 44 : 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 24,
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitleText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
    fontWeight: '500',
  },
  inputWrapper: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    height: 58,
  },
  inputContainerFocused: {
    borderColor: '#58CC02',
    backgroundColor: '#FFFFFF',
    shadowColor: '#58CC02',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
  },
  eyeButton: {
    padding: 10,
  },
  registerButton: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#58CC02',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  registerButtonGradient: {
    height: 58,
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    height: 58,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  loginText: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
  loginLink: {
    fontSize: 15,
    fontWeight: '800',
    color: '#58CC02',
  },
});