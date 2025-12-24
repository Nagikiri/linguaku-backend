// src/screens/Profile/ProfileScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logout, getUser, getToken } from '../../utils/storage';
import { API_URL, API_ENDPOINTS, fetchWithTimeout } from '../../config/api';
import EditProfileModal from '../../components/EditProfileModal';
import ResetPasswordModal from '../../components/ResetPasswordModal';

export const ProfileScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [statistics, setStatistics] = useState({
    totalPractices: 0,
    averageScore: 0,
    dayStreak: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [resetPasswordModalVisible, setResetPasswordModalVisible] = useState(false);

  // Load user data and statistics on screen focus
  useFocusEffect(
    useCallback(() => {
      loadProfileData();
    }, [])
  );

  const loadProfileData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadUser(),
        loadStatistics()
      ]);
    } catch (error) {
      console.error('Load profile data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUser = async () => {
    try {
      const userData = await getUser();
      if (userData) {
        setUser(userData);
      } else {
        // Fallback: fetch from API
        const token = await getToken();
        if (token) {
          const response = await fetchWithTimeout(
            API_URL + API_ENDPOINTS.USER_PROFILE,
            {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }
          );

          const data = await response.json();
          
          if (response.ok && data.success) {
            setUser(data.user);
            // Update local storage
            await AsyncStorage.setItem('user', JSON.stringify(data.user));
          }
        }
      }
    } catch (error) {
      console.error('Load user error:', error);
    }
  };

  const loadStatistics = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const response = await fetchWithTimeout(
        API_URL + API_ENDPOINTS.USER_STATISTICS,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();
      
      if (response.ok && data.success) {
        setStatistics(data.data);
      } else {
        console.error('Failed to load statistics:', data.message);
      }
    } catch (error) {
      console.error('Load statistics error:', error);
      // Keep default values on error
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfileData();
    setRefreshing(false);
  };

  const handleUpdateProfile = async (name) => {
    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetchWithTimeout(
        API_URL + API_ENDPOINTS.UPDATE_PROFILE,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name }),
        }
      );

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      if (data.success) {
        // Update local state
        setUser(data.user);
        // Update local storage
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        Alert.alert('Success', 'Profile updated successfully');
      }
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            navigation.replace('Login');
          }
        }
      ]
    );
  };

  const SettingItem = ({ iconName, title, subtitle, onPress, color = '#58CC02', showArrow = true }) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.settingIcon, { backgroundColor: `${color}15` }]}>
        <Ionicons name={iconName} size={22} color={color} />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {showArrow && (
        <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#58CC02" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with Back Button + Profile */}
      <LinearGradient
        colors={['#58CC02', '#78D919']}
        style={styles.header}
      >
        {/* Back Button */}
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <View style={styles.backButtonCircle}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>
          </View>
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'No email'}</Text>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#58CC02']}
            tintColor="#58CC02"
          />
        }
      >
        {/* Stats Section - REAL DATA */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{statistics.totalPractices}</Text>
            <Text style={styles.statLabel}>Practices</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{statistics.averageScore}%</Text>
            <Text style={styles.statLabel}>Avg Score</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{statistics.dayStreak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <SettingItem
            iconName="person"
            title="Edit Profile"
            subtitle="Update your name"
            onPress={() => setEditModalVisible(true)}
            color="#58CC02"
          />
          <SettingItem
            iconName="lock-closed"
            title="Reset Password"
            subtitle="Send reset link to email"
            onPress={() => setResetPasswordModalVisible(true)}
            color="#58CC02"
          />
          <SettingItem
            iconName="language"
            title="Language"
            subtitle="English"
            onPress={() => Alert.alert('Coming Soon', 'Language selection coming soon!')}
            color="#58CC02"
          />
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <SettingItem
            iconName="information-circle"
            title="About LinguaKu"
            subtitle="Version 1.0.0"
            onPress={() => Alert.alert('LinguaKu', 'Pronunciation Learning App\nVersion 1.0.0\n© 2025 All rights reserved')}
            color="#64748B"
          />
          <SettingItem
            iconName="document-text"
            title="Terms & Privacy"
            subtitle="Read our policies"
            onPress={() => Alert.alert('Coming Soon', 'Legal documents coming soon!')}
            color="#64748B"
          />
          <SettingItem
            iconName="help-circle"
            title="Help & Support"
            subtitle="Get help"
            onPress={() => Alert.alert('Coming Soon', 'Support center coming soon!')}
            color="#64748B"
          />
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#EF4444', '#DC2626']}
            style={styles.logoutGradient}
          >
            <Ionicons name="log-out" size={22} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.logoutText}>Logout</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Modals */}
      <EditProfileModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        currentName={user?.name || ''}
        currentEmail={user?.email || ''}
        onUpdate={handleUpdateProfile}
      />

      <ResetPasswordModal
        visible={resetPasswordModalVisible}
        onClose={() => setResetPasswordModalVisible(false)}
        userEmail={user?.email || ''}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#64748B',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 32,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
  },
  backButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileSection: {
    alignItems: 'center',
    paddingTop: 20,
  },
  avatarContainer: {
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '800',
    color: '#58CC02',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  userEmail: {
    fontSize: 15,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: -20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
  },
  section: {
    marginTop: 32,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  settingIcon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 3,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  logoutButton: {
    marginHorizontal: 20,
    marginTop: 32,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  logoutGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  logoutText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
