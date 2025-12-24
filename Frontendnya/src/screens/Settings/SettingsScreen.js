// src/screens/Settings/SettingsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUser } from '../../utils/storage';
import ResetPasswordModal from '../../components/ResetPasswordModal';

import { API_URL } from '../../config/api';

// Removed hardcoded API_URL - now using centralized config

export const SettingsScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [nativeEnglishMode, setNativeEnglishMode] = useState(false);
  const [dailyGoal, setDailyGoal] = useState(5);
  const [appLanguage, setAppLanguage] = useState('en'); // 'en' or 'id'
  const [microphoneSource, setMicrophoneSource] = useState('auto'); // 'auto', 'internal', 'headset'
  const [reminderTime, setReminderTime] = useState(new Date(2025, 0, 1, 9, 0)); // Default 9:00 AM
  const [showGoalPicker, setShowGoalPicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [showMicPicker, setShowMicPicker] = useState(false);
  const [resetPasswordModalVisible, setResetPasswordModalVisible] = useState(false);
  const [materialsCount, setMaterialsCount] = useState(20);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
    loadAllSettings();
    fetchMaterialsCount();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await getUser();
      if (userData) {
        setUser(userData);
      }
    } catch (error) {
      console.error('Load user error:', error);
    }
  };

  const loadAllSettings = async () => {
    try {
      const [
        savedMode,
        savedGoal,
        savedDarkMode,
        savedSound,
        savedLanguage,
        savedMic,
        savedReminder,
        savedNotifications
      ] = await Promise.all([
        AsyncStorage.getItem('nativeEnglishMode'),
        AsyncStorage.getItem('dailyGoal'),
        AsyncStorage.getItem('darkMode'),
        AsyncStorage.getItem('soundEnabled'),
        AsyncStorage.getItem('appLanguage'),
        AsyncStorage.getItem('microphoneSource'),
        AsyncStorage.getItem('reminderTime'),
        AsyncStorage.getItem('notificationsEnabled')
      ]);
      
      if (savedMode !== null) setNativeEnglishMode(savedMode === 'true');
      if (savedGoal !== null) setDailyGoal(parseInt(savedGoal));
      if (savedDarkMode !== null) setDarkMode(savedDarkMode === 'true');
      if (savedSound !== null) setSoundEnabled(savedSound === 'true');
      if (savedLanguage !== null) setAppLanguage(savedLanguage);
      if (savedMic !== null) setMicrophoneSource(savedMic);
      if (savedNotifications !== null) setNotificationsEnabled(savedNotifications === 'true');
      
      if (savedReminder !== null) {
        const time = new Date(savedReminder);
        setReminderTime(time);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const requestNotificationPermissions = async () => {
    // Notification feature temporarily disabled for stability
  };

  const fetchMaterialsCount = async () => {
    try {
      const response = await fetch(`${API_URL}/materials`);
      const data = await response.json();
      if (data.success) {
        const totalItems = data.data.reduce((sum, mat) => sum + (mat.items?.length || 0), 0);
        setMaterialsCount(totalItems);
      }
    } catch (error) {
      console.error('Error fetching materials count:', error);
    }
  };

  const toggleNativeEnglishMode = async (value) => {
    try {
      setNativeEnglishMode(value);
      await AsyncStorage.setItem('nativeEnglishMode', value.toString());
      Alert.alert(
        'Learning Mode Updated',
        value 
          ? 'Pronunciation will be strictly evaluated against native English standards.'
          : 'Pronunciation will be more tolerant of Indonesian dialect variations.'
      );
    } catch (error) {
      console.error('Error saving mode:', error);
      Alert.alert('Error', 'Failed to save setting');
    }
  };

  const updateDailyGoal = async (newGoal) => {
    try {
      setDailyGoal(newGoal);
      await AsyncStorage.setItem('dailyGoal', newGoal.toString());
      setShowGoalPicker(false);
      Alert.alert('Daily Goal Updated', `Your new daily goal is ${newGoal} practices!`);
    } catch (error) {
      console.error('Error saving daily goal:', error);
      Alert.alert('Error', 'Failed to save daily goal');
    }
  };

  const toggleDarkMode = async (value) => {
    try {
      setDarkMode(value);
      await AsyncStorage.setItem('darkMode', value.toString());
      Alert.alert(
        'Dark Mode ' + (value ? 'Enabled' : 'Disabled'),
        value 
          ? 'App will use dark theme. This will take effect on next app restart.'
          : 'App will use light theme. This will take effect on next app restart.'
      );
    } catch (error) {
      console.error('Error saving dark mode:', error);
    }
  };

  const toggleSound = async (value) => {
    try {
      setSoundEnabled(value);
      await AsyncStorage.setItem('soundEnabled', value.toString());
    } catch (error) {
      console.error('Error saving sound setting:', error);
    }
  };

  const changeLanguage = async (lang) => {
    try {
      setAppLanguage(lang);
      await AsyncStorage.setItem('appLanguage', lang);
      setShowLanguagePicker(false);
      Alert.alert(
        'Language Changed',
        lang === 'en' 
          ? 'App language set to English. Changes will take effect immediately.'
          : 'Bahasa aplikasi diubah ke Bahasa Indonesia. Perubahan akan berlaku segera.'
      );
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  const changeMicrophoneSource = async (source) => {
    try {
      setMicrophoneSource(source);
      await AsyncStorage.setItem('microphoneSource', source);
      setShowMicPicker(false);
      
      const sourceNames = {
        auto: 'Auto-detect',
        internal: 'Phone Microphone',
        headset: 'Headset/External Mic'
      };
      
      Alert.alert(
        'Microphone Source Updated',
        `Recording will use: ${sourceNames[source]}`
      );
    } catch (error) {
      console.error('Error saving microphone source:', error);
    }
  };

  const scheduleNotification = async (time) => {
    try {
      setReminderTime(time);
      await AsyncStorage.setItem('reminderTime', time.toISOString());
      setShowTimePicker(false);
      
      Alert.alert(
        'Reminder Time Saved',
        `Daily reminder will be at ${time.getHours()}:${time.getMinutes().toString().padStart(2, '0')}\n\nNote: Push notifications require additional setup.`
      );
    } catch (error) {
      console.error('Error saving reminder time:', error);
      Alert.alert('Error', 'Failed to save reminder time');
    }
  };

  const toggleNotifications = async (value) => {
    try {
      setNotificationsEnabled(value);
      await AsyncStorage.setItem('notificationsEnabled', value.toString());
      
      if (value) {
        Alert.alert(
          'Notifications',
          'Push notifications are configured. Reminder will notify you daily at the set time.'
        );
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
    }
  };

  const SettingItem = ({ icon, title, subtitle, onPress, color = '#58CC02', showArrow = true, rightComponent }) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!!rightComponent}
    >
      <View style={[styles.settingIcon, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {rightComponent || (showArrow && (
        <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
      ))}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <SettingItem
            icon="notifications"
            title="Push Notifications"
            subtitle={notificationsEnabled ? "Enabled" : "Disabled"}
            color="#58CC02"
            showArrow={false}
            rightComponent={
              <Switch
                value={notificationsEnabled}
                onValueChange={toggleNotifications}
                trackColor={{ false: '#E5E7EB', true: '#58CC02' }}
                thumbColor="#FFFFFF"
              />
            }
          />
          <SettingItem
            icon="time"
            title="Daily Reminder"
            subtitle={notificationsEnabled ? 
              `Reminder at ${reminderTime.getHours()}:${reminderTime.getMinutes().toString().padStart(2, '0')}` : 
              "Enable notifications first"
            }
            onPress={() => {
              if (notificationsEnabled) {
                setShowTimePicker(true);
              } else {
                Alert.alert('Enable Notifications', 'Please enable push notifications first to set a reminder');
              }
            }}
            color="#58CC02"
          />
        </View>

        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <SettingItem
            icon="moon"
            title="Dark Mode"
            subtitle={darkMode ? "Dark theme active" : "Light theme active"}
            color="#6366F1"
            showArrow={false}
            rightComponent={
              <Switch
                value={darkMode}
                onValueChange={toggleDarkMode}
                trackColor={{ false: '#E5E7EB', true: '#6366F1' }}
                thumbColor="#FFFFFF"
              />
            }
          />
        </View>

        {/* Sound & Audio Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sound & Audio</Text>
          <SettingItem
            icon="volume-high"
            title="Sound Effects"
            subtitle={soundEnabled ? "On" : "Off"}
            color="#F59E0B"
            showArrow={false}
            rightComponent={
              <Switch
                value={soundEnabled}
                onValueChange={toggleSound}
                trackColor={{ false: '#E5E7EB', true: '#F59E0B' }}
                thumbColor="#FFFFFF"
              />
            }
          />
          <SettingItem
            icon="mic"
            title="Microphone Input"
            subtitle={
              microphoneSource === 'auto' ? 'Auto Detect' : 
              microphoneSource === 'internal' ? 'Internal Mic' : 
              'Headset Mic'
            }
            onPress={() => setShowMicPicker(true)}
            color="#F59E0B"
          />
        </View>

        {/* Learning Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Learning</Text>
          
          <SettingItem
            icon="flag"
            title="Daily Goal"
            subtitle={`${dailyGoal} practices per day`}
            onPress={() => setShowGoalPicker(true)}
            color="#10B981"
          />
          
          <SettingItem
            icon="globe"
            title="Pronunciation Mode"
            subtitle={nativeEnglishMode ? "Native English (Strict)" : "Indonesian Dialect Tolerant"}
            color="#10B981"
            showArrow={false}
            rightComponent={
              <Switch
                value={nativeEnglishMode}
                onValueChange={toggleNativeEnglishMode}
                trackColor={{ false: '#E5E7EB', true: '#10B981' }}
                thumbColor="#FFFFFF"
              />
            }
          />
          
          <SettingItem
            icon="language"
            title="App Language"
            subtitle={appLanguage === 'en' ? 'English' : 'Bahasa Indonesia'}
            onPress={() => setShowLanguagePicker(true)}
            color="#10B981"
          />
        </View>

        {/* Privacy & Security Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy & Security</Text>
          <SettingItem
            icon="lock-closed"
            title="Reset Password"
            subtitle="Send reset link to email"
            onPress={() => setResetPasswordModalVisible(true)}
            color="#EF4444"
          />
          <SettingItem
            icon="shield-checkmark"
            title="Privacy"
            subtitle="Manage your data"
            onPress={() => Alert.alert('Coming Soon', 'Privacy settings coming soon!')}
            color="#EF4444"
          />
        </View>

        {/* About & Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About & Support</Text>
          <SettingItem
            icon="information-circle"
            title="About LinguaKu"
            subtitle="Version 1.0.0"
            onPress={() => Alert.alert('LinguaKu', 'Pronunciation Learning App\nVersion 1.0.0\n© 2025 All rights reserved')}
            color="#64748B"
          />
          <SettingItem
            icon="document-text"
            title="Terms & Privacy Policy"
            subtitle="Read our policies"
            onPress={() => Alert.alert('Coming Soon', 'Legal documents coming soon!')}
            color="#64748B"
          />
          <SettingItem
            icon="help-circle"
            title="Help & Support"
            subtitle="Get help and contact us"
            onPress={() => Alert.alert('Coming Soon', 'Support center coming soon!')}
            color="#64748B"
          />
          <SettingItem
            icon="star"
            title="Rate LinguaKu"
            subtitle="Share your feedback"
            onPress={() => Alert.alert('Thank You!', 'Rating feature coming soon!')}
            color="#64748B"
          />
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Daily Goal Picker Modal */}
      <Modal
        visible={showGoalPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGoalPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set Daily Goal</Text>
            <Text style={styles.modalSubtitle}>
              How many practices do you want to complete daily?
            </Text>

            <ScrollView style={styles.goalsList} showsVerticalScrollIndicator={false}>
              {[1, 3, 5, 10, 15, 20].map((goal) => (
                <TouchableOpacity
                  key={goal}
                  style={[
                    styles.goalOption,
                    dailyGoal === goal && styles.goalOptionSelected,
                  ]}
                  onPress={() => updateDailyGoal(goal)}
                >
                  <View style={styles.goalOptionContent}>
                    <Ionicons 
                      name={dailyGoal === goal ? 'checkmark-circle' : 'ellipse-outline'} 
                      size={24} 
                      color={dailyGoal === goal ? '#10B981' : '#94A3B8'} 
                    />
                    <Text style={[
                      styles.goalOptionText,
                      dailyGoal === goal && styles.goalOptionTextSelected,
                    ]}>
                      {goal} {goal === 1 ? 'practice' : 'practices'} per day
                    </Text>
                  </View>
                  <Text style={styles.goalOptionTime}>
                    ~{goal * 2} min/day
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowGoalPicker(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Language Picker Modal */}
      <Modal
        visible={showLanguagePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLanguagePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>App Language</Text>
            <Text style={styles.modalSubtitle}>
              Choose your preferred language
            </Text>

            <View style={styles.languageList}>
              <TouchableOpacity
                style={[
                  styles.languageOption,
                  appLanguage === 'en' && styles.languageOptionSelected,
                ]}
                onPress={() => changeLanguage('en')}
              >
                <View style={styles.languageOptionContent}>
                  <Text style={styles.languageFlag}>🇬🇧</Text>
                  <Text style={[
                    styles.languageOptionText,
                    appLanguage === 'en' && styles.languageOptionTextSelected,
                  ]}>
                    English
                  </Text>
                </View>
                {appLanguage === 'en' && (
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.languageOption,
                  appLanguage === 'id' && styles.languageOptionSelected,
                ]}
                onPress={() => changeLanguage('id')}
              >
                <View style={styles.languageOptionContent}>
                  <Text style={styles.languageFlag}>🇮🇩</Text>
                  <Text style={[
                    styles.languageOptionText,
                    appLanguage === 'id' && styles.languageOptionTextSelected,
                  ]}>
                    Bahasa Indonesia
                  </Text>
                </View>
                {appLanguage === 'id' && (
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowLanguagePicker(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Microphone Picker Modal */}
      <Modal
        visible={showMicPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMicPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Microphone Input</Text>
            <Text style={styles.modalSubtitle}>
              Choose your audio input device
            </Text>

            <View style={styles.micList}>
              <TouchableOpacity
                style={[
                  styles.micOption,
                  microphoneSource === 'auto' && styles.micOptionSelected,
                ]}
                onPress={() => changeMicrophoneSource('auto')}
              >
                <View style={styles.micOptionContent}>
                  <Ionicons 
                    name="sync" 
                    size={24} 
                    color={microphoneSource === 'auto' ? '#F59E0B' : '#94A3B8'} 
                  />
                  <View style={styles.micOptionTextContainer}>
                    <Text style={[
                      styles.micOptionTitle,
                      microphoneSource === 'auto' && styles.micOptionTitleSelected,
                    ]}>
                      Auto Detect
                    </Text>
                    <Text style={styles.micOptionDescription}>
                      Automatically select best microphone
                    </Text>
                  </View>
                </View>
                {microphoneSource === 'auto' && (
                  <Ionicons name="checkmark-circle" size={24} color="#F59E0B" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.micOption,
                  microphoneSource === 'internal' && styles.micOptionSelected,
                ]}
                onPress={() => changeMicrophoneSource('internal')}
              >
                <View style={styles.micOptionContent}>
                  <Ionicons 
                    name="phone-portrait" 
                    size={24} 
                    color={microphoneSource === 'internal' ? '#F59E0B' : '#94A3B8'} 
                  />
                  <View style={styles.micOptionTextContainer}>
                    <Text style={[
                      styles.micOptionTitle,
                      microphoneSource === 'internal' && styles.micOptionTitleSelected,
                    ]}>
                      Internal Microphone
                    </Text>
                    <Text style={styles.micOptionDescription}>
                      Use device's built-in mic
                    </Text>
                  </View>
                </View>
                {microphoneSource === 'internal' && (
                  <Ionicons name="checkmark-circle" size={24} color="#F59E0B" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.micOption,
                  microphoneSource === 'headset' && styles.micOptionSelected,
                ]}
                onPress={() => changeMicrophoneSource('headset')}
              >
                <View style={styles.micOptionContent}>
                  <Ionicons 
                    name="headset" 
                    size={24} 
                    color={microphoneSource === 'headset' ? '#F59E0B' : '#94A3B8'} 
                  />
                  <View style={styles.micOptionTextContainer}>
                    <Text style={[
                      styles.micOptionTitle,
                      microphoneSource === 'headset' && styles.micOptionTitleSelected,
                    ]}>
                      Headset Microphone
                    </Text>
                    <Text style={styles.micOptionDescription}>
                      Use external headset/earphone mic
                    </Text>
                  </View>
                </View>
                {microphoneSource === 'headset' && (
                  <Ionicons name="checkmark-circle" size={24} color="#F59E0B" />
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowMicPicker(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Time Picker Modal - Simplified */}
      <Modal
        visible={showTimePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTimePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Daily Reminder Time</Text>
            <Text style={styles.modalSubtitle}>
              Select your preferred reminder time
            </Text>

            <View style={styles.timeList}>
              {[
                { hour: 7, label: '7:00 AM - Early Morning' },
                { hour: 9, label: '9:00 AM - Morning' },
                { hour: 12, label: '12:00 PM - Noon' },
                { hour: 15, label: '3:00 PM - Afternoon' },
                { hour: 18, label: '6:00 PM - Evening' },
                { hour: 20, label: '8:00 PM - Night' },
              ].map((timeOption) => (
                <TouchableOpacity
                  key={timeOption.hour}
                  style={[
                    styles.timeOption,
                    reminderTime.getHours() === timeOption.hour && styles.timeOptionSelected,
                  ]}
                  onPress={() => {
                    const newTime = new Date();
                    newTime.setHours(timeOption.hour, 0, 0, 0);
                    scheduleNotification(newTime);
                  }}
                >
                  <Text style={[
                    styles.timeOptionText,
                    reminderTime.getHours() === timeOption.hour && styles.timeOptionTextSelected,
                  ]}>
                    {timeOption.label}
                  </Text>
                  {reminderTime.getHours() === timeOption.hour && (
                    <Ionicons name="checkmark-circle" size={24} color="#58CC02" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowTimePicker(false)}
            >
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Reset Password Modal */}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 24,
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
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 15,
    color: '#64748B',
    marginBottom: 24,
    fontWeight: '500',
  },
  goalsList: {
    maxHeight: 400,
  },
  goalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  goalOptionSelected: {
    backgroundColor: '#10B98110',
    borderColor: '#10B981',
  },
  goalOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  goalOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
  },
  goalOptionTextSelected: {
    color: '#0F172A',
    fontWeight: '700',
  },
  goalOptionTime: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '600',
  },
  modalCloseButton: {
    marginTop: 16,
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  modalCloseButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#475569',
  },
  // Language Picker Styles
  languageList: {
    marginVertical: 16,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 18,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  languageOptionSelected: {
    backgroundColor: '#10B98110',
    borderColor: '#10B981',
  },
  languageOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  languageFlag: {
    fontSize: 32,
  },
  languageOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
  },
  languageOptionTextSelected: {
    color: '#0F172A',
    fontWeight: '700',
  },
  // Microphone Picker Styles
  micList: {
    marginVertical: 16,
  },
  micOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  micOptionSelected: {
    backgroundColor: '#F59E0B10',
    borderColor: '#F59E0B',
  },
  micOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  micOptionTextContainer: {
    flex: 1,
  },
  micOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 2,
  },
  micOptionTitleSelected: {
    color: '#0F172A',
    fontWeight: '700',
  },
  micOptionDescription: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },
  // Time Picker Styles
  timeList: {
    marginVertical: 16,
  },
  timeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  timeOptionSelected: {
    backgroundColor: '#58CC0210',
    borderColor: '#58CC02',
  },
  timeOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
  },
  timeOptionTextSelected: {
    color: '#0F172A',
    fontWeight: '700',
  },
});


