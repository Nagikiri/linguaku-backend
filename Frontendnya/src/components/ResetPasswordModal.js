// src/components/ResetPasswordModal.js
// Modal untuk Reset Password (sama dengan Forgot Password di login)
// Kirim email reset password, user klik link, masukkan password baru

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { API_URL, API_ENDPOINTS, fetchWithTimeout } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ResetPasswordModal = ({ visible, onClose, userEmail }) => {
  const [email, setEmail] = useState(userEmail || '');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Reset state saat modal dibuka
  React.useEffect(() => {
    if (visible) {
      setEmail(userEmail || '');
      setEmailSent(false);
    }
  }, [visible, userEmail]);

  const handleSendResetEmail = async () => {
    // Validation
    if (!email.trim()) {
      Alert.alert('Error', 'Email cannot be empty');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetchWithTimeout(
        API_URL + API_ENDPOINTS.FORGOT_PASSWORD,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: email.trim() }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setEmailSent(true);
        Alert.alert(
          'Email Sent! 📧',
          'Reset password link has been sent to your email. Please check your inbox (and spam folder).',
          [
            {
              text: 'OK',
              onPress: () => {
                // Don't close modal yet, show success message
              }
            }
          ]
        );
      } else {
        throw new Error(data.message || 'Failed to send reset email');
      }
    } catch (error) {
      console.error('Send reset email error:', error);
      Alert.alert('Error', error.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setEmail(userEmail || '');
      setEmailSent(false);
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.overlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Reset Password</Text>
              <TouchableOpacity 
                onPress={handleClose} 
                disabled={loading}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView 
              style={styles.form}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {!emailSent ? (
                <>
                  <View style={styles.iconContainer}>
                    <View style={styles.iconCircle}>
                      <Ionicons name="lock-closed" size={40} color={COLORS.primary} />
                    </View>
                  </View>

                  <Text style={styles.description}>
                    Enter your email address and we'll send you a link to reset your password.
                  </Text>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Email Address</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="mail" size={20} color={COLORS.textSecondary} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        placeholder="your.email@example.com"
                        placeholderTextColor={COLORS.textSecondary}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        editable={!loading}
                      />
                    </View>
                  </View>

                  <View style={styles.infoBox}>
                    <Ionicons name="information-circle" size={20} color={COLORS.primary} />
                    <Text style={styles.infoText}>
                      The reset link will expire in 1 hour for security reasons.
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.successIconContainer}>
                    <View style={styles.successIconCircle}>
                      <Ionicons name="checkmark-circle" size={60} color={COLORS.success} />
                    </View>
                  </View>

                  <Text style={styles.successTitle}>Email Sent Successfully!</Text>
                  <Text style={styles.successDescription}>
                    We've sent a password reset link to:
                  </Text>
                  <Text style={styles.emailText}>{email}</Text>
                  
                  <View style={styles.instructionsBox}>
                    <Text style={styles.instructionsTitle}>Next Steps:</Text>
                    <Text style={styles.instructionsText}>
                      1. Check your email inbox{'\n'}
                      2. Click the reset link{'\n'}
                      3. Enter your new password{'\n'}
                      4. Login with your new password
                    </Text>
                  </View>

                  <View style={styles.warningBox}>
                    <Ionicons name="warning" size={20} color="#F59E0B" />
                    <Text style={styles.warningText}>
                      Didn't receive the email? Check your spam folder or try again.
                    </Text>
                  </View>
                </>
              )}
            </ScrollView>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              {!emailSent ? (
                <>
                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={handleClose}
                    disabled={loading}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.button, styles.sendButton, loading && styles.disabledButton]}
                    onPress={handleSendResetEmail}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <>
                        <Ionicons name="mail" size={18} color="#fff" style={{ marginRight: 8 }} />
                        <Text style={styles.sendButtonText}>Send Reset Link</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={[styles.button, styles.doneButton]}
                  onPress={handleClose}
                >
                  <Text style={styles.doneButtonText}>Done</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  closeButton: {
    padding: 4,
  },
  form: {
    paddingHorizontal: 20,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  description: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: COLORS.text,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: `${COLORS.primary}08`,
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSecondary,
    marginLeft: 8,
    lineHeight: 18,
  },
  successIconContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  successIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: `${COLORS.success}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  successDescription: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  emailText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 24,
  },
  instructionsBox: {
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  instructionsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    marginLeft: 8,
    lineHeight: 18,
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
  },
  button: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  cancelButton: {
    backgroundColor: '#F1F5F9',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  sendButton: {
    backgroundColor: COLORS.primary,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  doneButton: {
    backgroundColor: COLORS.success,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default ResetPasswordModal;
