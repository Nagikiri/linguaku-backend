// ============================================
// FILE: screens/Auth/ForgotPasswordScreen.js
// Purpose: Forgot password screen - Google-style clean design
// ============================================

import React, { useState } from 'react';
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
  Keyboard,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../../config/api';
import axios from 'axios';

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleForgotPassword = async () => {
    Keyboard.dismiss();

    // Validation
    if (!email) {
      Alert.alert('Required Field', 'Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/auth/forgot-password`, {
        email: email.toLowerCase().trim()
      });

      if (response.data.success) {
        Alert.alert(
          '✅ Email Sent!',
          'If the email is registered, a password reset link has been sent. Please check your inbox.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack()
            }
          ]
        );
      }
    } catch (error) {
      console.error('[FORGOT PASSWORD ERROR]:', error);
      const errorMessage =
        error.response?.data?.message ||
        'Failed to send password reset email. Please try again.';
      Alert.alert('Error Occurred', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
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
            <Ionicons name="arrow-back" size={24} color="#5f6368" />
          </TouchableOpacity>

          {/* Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name="lock-closed-outline" size={48} color="#1a73e8" />
          </View>

          {/* Title */}
          <Text style={styles.title}>Forgot Password?</Text>
          <Text style={styles.subtitle}>
            Enter your email and we'll send you a link to reset your password
          </Text>

          {/* Input Container */}
          <View style={styles.formContainer}>
            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#80868b"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleForgotPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.submitButtonText}>Send Reset Link</Text>
              )}
            </TouchableOpacity>

            {/* Back to Login */}
            <TouchableOpacity
              style={styles.backToLoginButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backToLoginText}>Back to Login</Text>
            </TouchableOpacity>
          </View>

          {/* Info Note */}
          <View style={styles.infoNote}>
            <Text style={styles.infoText}>
              The reset link will be valid for 10 minutes
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff'
  },
  keyboardView: {
    flex: 1
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f3f4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24
  },
  title: {
    fontSize: 24,
    fontWeight: '400',
    color: '#202124',
    textAlign: 'center',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 14,
    color: '#5f6368',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
    paddingHorizontal: 24
  },
  formContainer: {
    marginBottom: 24
  },
  inputContainer: {
    marginBottom: 24
  },
  inputLabel: {
    fontSize: 14,
    color: '#5f6368',
    marginBottom: 8,
    fontWeight: '500'
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderColor: '#dadce0',
    borderRadius: 4,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#202124',
    backgroundColor: '#ffffff'
  },
  submitButton: {
    height: 40,
    backgroundColor: '#1a73e8',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16
  },
  submitButtonDisabled: {
    backgroundColor: '#a8c7fa',
    opacity: 0.6
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.25
  },
  backToLoginButton: {
    paddingVertical: 12,
    alignItems: 'center'
  },
  backToLoginText: {
    color: '#1a73e8',
    fontSize: 14,
    fontWeight: '600'
  },
  infoNote: {
    paddingHorizontal: 24
  },
  infoText: {
    fontSize: 12,
    color: '#5f6368',
    textAlign: 'center',
    lineHeight: 16
  }
});

export default ForgotPasswordScreen;
