// ============================================
// FILE: src/screens/Auth/EmailVerificationScreen.js
// Clean & Professional Email Verification UI
// ============================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../../config/api';
import axios from 'axios';

const { width, height } = Dimensions.get('window');

const EmailVerificationScreen = ({ route, navigation }) => {
  const { email = '', token = null } = route.params || {};
  
  const [verifying, setVerifying] = useState(!!token);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  // Animation
  const scaleAnim = React.useRef(new Animated.Value(0)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start animations
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto verify if token present
    if (token) {
      handleVerifyEmail(token);
    }
  }, [token]);

  const handleVerifyEmail = async (verificationToken) => {
    // Note: Verification happens when user clicks link in email
    // Link opens browser with GET /api/auth/verify-email?token=xxx
    // This function is kept for future use if needed
    // For now, just show message to check email
    console.log('[EMAIL VERIFICATION] User should click link in email');
    setVerifying(false);
  };

  const handleResendEmail = async () => {
    if (!email) {
      setError('Email tidak ditemukan. Silakan daftar ulang.');
      return;
    }

    try {
      setResending(true);
      setError('');
      setResendSuccess(false);

      console.log('[RESEND EMAIL] Sending request to:', `${API_URL}/auth/resend-verification`);
      console.log('[RESEND EMAIL] Email:', email);

      const response = await axios.post(
        `${API_URL}/auth/resend-verification`,
        { email },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        }
      );

      console.log('[RESEND EMAIL] Response:', response.data);

      if (response.data.success) {
        setResendSuccess(true);
        setError('');
      }
    } catch (err) {
      console.error('[RESEND EMAIL ERROR]:', err.response?.data || err.message);
      
      const errorMessage = 
        err.response?.data?.message || 
        'Gagal mengirim email verifikasi. Silakan coba lagi.';
      
      setError(errorMessage);
      setResendSuccess(false);
    } finally {
      setResending(false);
    }
  };

  const renderContent = () => {
    // Verifying state
    if (verifying) {
      return (
        <Animated.View 
          style={[
            styles.contentContainer,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
          ]}
        >
          <View style={styles.iconContainer}>
            <View style={[styles.iconCircle, styles.iconCircleVerifying]}>
              <ActivityIndicator size="large" color="#667eea" />
            </View>
          </View>
          
          <Text style={styles.title}>Memverifikasi Email...</Text>
          <Text style={styles.subtitle}>
            Mohon tunggu sebentar, kami sedang memverifikasi alamat email Anda.
          </Text>
        </Animated.View>
      );
    }

    // Success state
    if (verified) {
      return (
        <Animated.View 
          style={[
            styles.contentContainer,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
          ]}
        >
          <View style={styles.iconContainer}>
            <View style={[styles.iconCircle, styles.iconCircleSuccess]}>
              <Ionicons name="checkmark-circle" size={80} color="#10b981" />
            </View>
          </View>
          
          <Text style={styles.title}>Email Terverifikasi! ✅</Text>
          <Text style={styles.subtitle}>
            Selamat! Akun Anda sudah aktif.{'\n'}
            Anda akan dialihkan ke halaman login...
          </Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.replace('Login')}
          >
            <LinearGradient
              colors={['#10b981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>Login Sekarang</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      );
    }

    // Default/Error state - need verification
    return (
      <Animated.View 
        style={[
          styles.contentContainer,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
        ]}
      >
        <View style={styles.iconContainer}>
          <View style={[styles.iconCircle, error ? styles.iconCircleError : styles.iconCirclePending]}>
            <Ionicons 
              name={error ? "close-circle" : "mail"} 
              size={80} 
              color={error ? "#ef4444" : "#667eea"} 
            />
          </View>
        </View>
        
        <Text style={styles.title}>
          {error ? 'Verifikasi Gagal' : 'Cek Email Anda 📧'}
        </Text>
        
        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={20} color="#ef4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <Text style={styles.subtitle}>
            Kami telah mengirim link verifikasi ke:{'\n'}
            <Text style={styles.emailHighlight}>{email}</Text>
          </Text>
        )}

        {resendSuccess && (
          <View style={styles.successBox}>
            <Ionicons name="checkmark-circle" size={20} color="#10b981" />
            <Text style={styles.successText}>
              Email verifikasi berhasil dikirim! Cek inbox atau folder spam Anda.
            </Text>
          </View>
        )}

        <View style={styles.instructionsBox}>
          <Text style={styles.instructionsTitle}>Instruksi:</Text>
          <Text style={styles.instructionsText}>
            1. Buka email dari LinguaKu{'\n'}
            2. Klik tombol "Verifikasi Email"{'\n'}
            3. Email Anda akan terverifikasi otomatis{'\n'}
            4. Silakan login untuk mulai belajar
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, resending && styles.buttonDisabled]}
          onPress={handleResendEmail}
          disabled={resending}
        >
          <LinearGradient
            colors={resending ? ['#94a3b8', '#64748b'] : ['#667eea', '#764ba2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buttonGradient}
          >
            {resending ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons name="mail-outline" size={20} color="#FFFFFF" />
                <Text style={styles.buttonText}>Kirim Ulang Email</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.replace('Login')}
        >
          <Text style={styles.secondaryButtonText}>Kembali ke Login</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />
      
      <View style={styles.overlay}>
        {renderContent()}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  contentContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  iconContainer: {
    marginBottom: 32,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  iconCircleVerifying: {
    backgroundColor: '#f0f4ff',
  },
  iconCircleSuccess: {
    backgroundColor: '#f0fdf4',
  },
  iconCircleError: {
    backgroundColor: '#fef2f2',
  },
  iconCirclePending: {
    backgroundColor: '#f0f4ff',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  emailHighlight: {
    fontWeight: '600',
    color: '#667eea',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    width: '100%',
  },
  errorText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#991b1b',
    lineHeight: 20,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    width: '100%',
  },
  successText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#065f46',
    lineHeight: 20,
  },
  instructionsBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
    width: '100%',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  instructionsText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
  },
  primaryButton: {
    width: '100%',
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonGradient: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#667eea',
    backgroundColor: 'transparent',
    width: '100%',
  },
  secondaryButtonText: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default EmailVerificationScreen;
