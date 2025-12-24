// src/screens/Auth/LoginScreen.js
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  Dimensions,
  StatusBar,
  ScrollView,
  Keyboard,
  ActivityIndicator,
  TouchableWithoutFeedback,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { saveToken, saveUser } from '../../utils/storage';
import * as WebBrowser from 'expo-web-browser';
import { API_URL } from '../../config/api';

WebBrowser.maybeCompleteAuthSession();
const { width, height } = Dimensions.get('window');

export const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // CRITICAL FIX: Use ref for focus state to prevent re-render
  const emailFocused = useRef(false);
  const passwordFocused = useRef(false);

  // Animations - keep button animation only
  const buttonAnim = useRef(new Animated.Value(1)).current;
  
  // Refs for TextInput - stable references
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const scrollViewRef = useRef(null);
  
  // Keyboard state managed with ref to prevent re-renders
  const keyboardState = useRef({
    visible: false,
    height: 0
  });

  // FIXED: Keyboard listeners only - no animations
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    
    const keyboardDidShowListener = Keyboard.addListener(showEvent, (e) => {
      keyboardState.current = {
        visible: true,
        height: e.endCoordinates.height
      };
    });
    
    const keyboardDidHideListener = Keyboard.addListener(hideEvent, () => {
      keyboardState.current = {
        visible: false,
        height: 0
      };
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  // FIXED: Simplified login handler
  const handleLogin = useCallback(async () => {
    // Dismiss keyboard first to prevent flicker during navigation
    Keyboard.dismiss();
    
    if (!email || !password) {
      Alert.alert('Required Fields', 'Please enter your email and password');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          password: password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const tokenSaved = await saveToken(data.data.token);
        const userSaved = await saveUser(data.data.user);
        
        if (tokenSaved && userSaved) {
          // Navigate to Main (with bottom tabs)
          navigation.replace('Main');
        } else {
          console.error('Failed to save token/user to AsyncStorage');
          Alert.alert('Error', 'Failed to save login data. Please try again.');
        }
      } else {
        // Specific error messages based on backend response
        if (data.requiresVerification) {
          Alert.alert(
            'Email Not Verified',
            'Please verify your email first. Check your inbox for the verification link and click it to verify your account.',
            [
              {
                text: 'Resend Email',
                onPress: async () => {
                  try {
                    await fetch(`${API_URL}/auth/resend-verification`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email: email.toLowerCase().trim() })
                    });
                    Alert.alert('Email Sent', 'Verification email has been resent. Please check your inbox.');
                  } catch (err) {
                    Alert.alert('Error', 'Failed to resend verification email.');
                  }
                }
              },
              {
                text: 'OK',
                style: 'default'
              }
            ]
          );
        } else {
          Alert.alert('Login Failed', data.message || 'Invalid credentials');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Connection Error', 'Cannot connect to server. Check your connection.');
    } finally {
      setLoading(false);
    }
  }, [email, password, navigation]);

  const handleGoogleLogin = useCallback(async () => {
    try {
      setGoogleLoading(true);
      
      Alert.alert(
        'Google Sign-In',
        'Google Sign-In requires standalone app build (not Expo Go). Would you like to continue with email/password login instead?',
        [
          {
            text: 'Use Email/Password',
            style: 'default'
          },
          {
            text: 'Learn More',
            onPress: () => {
              Alert.alert(
                'Google Sign-In Info',
                'To use Google Sign-In, you need to build a standalone APK/IPA. This feature will be available after deployment to Railway and building the standalone app.',
                [{ text: 'OK' }]
              );
            }
          }
        ]
      );
      
      // Note: Google Sign-In implementation will be completed after Railway deployment
      // For now, we show this message to avoid confusion in Expo Go
      
    } catch (error) {
      console.error('Google login error:', error);
      Alert.alert('Error', 'Google login is not available in development mode');
    } finally {
      setGoogleLoading(false);
    }
  }, [navigation]);

  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
  }, []);

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
            bounces={true}
            scrollEnabled={true}
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
            <Text style={styles.logoSubtext}>Master Your Pronunciation</Text>
          </View>

          {/* Form Section - NO ANIMATION */}
          <View style={styles.formSection}>
            <View style={styles.formCard}>
              <Text style={styles.welcomeText}>Welcome Back!</Text>
              <Text style={styles.subtitleText}>Sign in to continue learning</Text>

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
                    placeholder="Enter your password"
                    placeholderTextColor="#94A3B8"
                    value={password}
                    onChangeText={(text) => setPassword(text)}
                    onFocus={() => { passwordFocused.current = true; }}
                    onBlur={() => { passwordFocused.current = false; }}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                    textContentType="password"
                    importantForAutofill="yes"
                    editable={!loading && !googleLoading}
                    blurOnSubmit={true}
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

              {/* Login Button */}
              <Animated.View style={{ transform: [{ scale: buttonAnim }] }}>
                <TouchableOpacity
                  style={styles.loginButton}
                  onPress={handleLogin}
                  disabled={loading || googleLoading}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#58CC02', '#78D919']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.loginButtonGradient}
                  >
                    {loading ? (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator color="#FFFFFF" size="small" />
                        <Text style={styles.loginButtonText}>Signing in...</Text>
                      </View>
                    ) : (
                      <Text style={styles.loginButtonText}>Sign In</Text>
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
                onPress={handleGoogleLogin}
                disabled={loading || googleLoading}
                activeOpacity={0.8}
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

              {/* Forgot Password Link */}
              <TouchableOpacity
                style={styles.forgotPasswordButton}
                onPress={() => navigation.navigate('ForgotPassword')}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

              {/* Register Link */}
              <View style={styles.registerContainer}>
                <Text style={styles.registerText}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                  <Text style={styles.registerLink}>Sign Up</Text>
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
    paddingVertical: Platform.OS === 'ios' ? 60 : 40,
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
    marginBottom: 28,
    fontWeight: '500',
  },
  inputWrapper: {
    marginBottom: 18,
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
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 20,
    paddingVertical: 4,
  },
  forgotText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1EA7FD',
  },
  loginButton: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#58CC02',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  loginButtonGradient: {
    height: 58,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonText: {
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
  forgotPasswordButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 10,
  },
  forgotPasswordText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#58CC02',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  registerText: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
  registerLink: {
    fontSize: 15,
    fontWeight: '800',
    color: '#58CC02',
  },
});