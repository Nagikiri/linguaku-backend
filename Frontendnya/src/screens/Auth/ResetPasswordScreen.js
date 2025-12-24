// ============================================
// FILE: screens/Auth/ResetPasswordScreen.js
// Tujuan: Screen untuk reset password dengan token
// ============================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
  Keyboard
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../../config/api';
import axios from 'axios';

const ResetPasswordScreen = ({ route, navigation }) => {
  const { token } = route.params || {};
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      Alert.alert(
        'Error',
        'Password reset token not found. Please request a new link.',
        [{ text: 'OK', onPress: () => navigation.navigate('ForgotPassword') }]
      );
    }
  }, [token]);

  // Password strength indicator
  const getPasswordStrength = () => {
    if (!password) return { text: '', color: '#999', width: '0%' };
    if (password.length < 6)
      return { text: 'Weak', color: '#f5576c', width: '33%' };
    if (password.length < 8)
      return { text: 'Medium', color: '#ffc107', width: '66%' };
    return { text: 'Strong', color: '#4caf50', width: '100%' };
  };

  const passwordStrength = getPasswordStrength();

  const handleResetPassword = async () => {
    Keyboard.dismiss();

    // Validation
    if (!password || !confirmPassword) {
      Alert.alert('Required Fields', 'Please enter new password and confirm password');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Password Too Short', 'Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Password and confirmation password must match');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${API_URL}/auth/reset-password/${token}`,
        { password }
      );

      if (response.data.success) {
        Alert.alert(
          '✅ Password Reset Successful!',
          'Your password has been changed. Please login with your new password.',
          [
            {
              text: 'Login Now',
              onPress: () => navigation.navigate('Login')
            }
          ]
        );
      }
    } catch (error) {
      console.error('[RESET PASSWORD ERROR]:', error);
      const errorMessage =
        error.response?.data?.message ||
        'Token is invalid or expired. Please request a new password reset.';

      Alert.alert('Error', errorMessage, [
        {
          text: 'Request New Link',
          onPress: () => navigation.navigate('ForgotPassword')
        },
        { text: 'Cancel', style: 'cancel' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#f093fb', '#f5576c']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.background}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>

          {/* Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Ionicons name="key-outline" size={60} color="#f5576c" />
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>Enter your new password</Text>

          {/* Form Container */}
          <View style={styles.formContainer}>
            {/* New Password Input */}
            <View style={styles.inputContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#999"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="New Password"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#999"
                />
              </TouchableOpacity>
            </View>

            {/* Password Strength Indicator */}
            {password.length > 0 && (
              <View style={styles.strengthContainer}>
                <View style={styles.strengthBar}>
                  <View
                    style={[
                      styles.strengthFill,
                      {
                        width: passwordStrength.width,
                        backgroundColor: passwordStrength.color
                      }
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.strengthText,
                    { color: passwordStrength.color }
                  ]}
                >
                  {passwordStrength.text}
                </Text>
              </View>
            )}

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#999"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor="#999"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#999"
                />
              </TouchableOpacity>
            </View>

            {/* Password Match Indicator */}
            {confirmPassword.length > 0 && (
              <View style={styles.matchContainer}>
                <Ionicons
                  name={
                    password === confirmPassword
                      ? 'checkmark-circle'
                      : 'close-circle'
                  }
                  size={16}
                  color={password === confirmPassword ? '#4caf50' : '#f5576c'}
                />
                <Text
                  style={[
                    styles.matchText,
                    {
                      color:
                        password === confirmPassword ? '#4caf50' : '#f5576c'
                    }
                  ]}
                >
                  {password === confirmPassword
                    ? 'Password matches'
                    : 'Password does not match'}
                </Text>
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                loading && styles.submitButtonDisabled
              ]}
              onPress={handleResetPassword}
              disabled={loading}
            >
              <LinearGradient
                colors={
                  loading ? ['#cccccc', '#999999'] : ['#f093fb', '#f5576c']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitGradient}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
                    <Text style={styles.submitButtonText}>Reset Password</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Security Notice */}
          <View style={styles.securityCard}>
            <Ionicons name="shield-checkmark-outline" size={24} color="#17a2b8" />
            <View style={styles.securityTextContainer}>
              <Text style={styles.securityTitle}>🔒 Security Notice</Text>
              <Text style={styles.securityText}>
                • After resetting password, you must login again{'\n'}
                • Use a strong and unique password{'\n'}
                • Do not share your password
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa'
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 300
  },
  keyboardView: {
    flex: 1
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 60
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 30
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 10
  },
  subtitle: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 40,
    opacity: 0.9
  },
  formContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  inputIcon: {
    marginRight: 10
  },
  input: {
    flex: 1,
    height: 50,
    color: '#333',
    fontSize: 16
  },
  strengthContainer: {
    marginBottom: 15
  },
  strengthBar: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 5
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '600'
  },
  matchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15
  },
  matchText: {
    fontSize: 14,
    marginLeft: 6,
    fontWeight: '600'
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 10
  },
  submitButtonDisabled: {
    opacity: 0.6
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8
  },
  securityCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#17a2b8'
  },
  securityTextContainer: {
    flex: 1,
    marginLeft: 12
  },
  securityTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 6
  },
  securityText: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 20
  }
});

export default ResetPasswordScreen;
