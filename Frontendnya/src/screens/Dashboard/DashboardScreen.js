// src/screens/Dashboard/DashboardScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getUser, getToken } from '../../utils/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
import { API_URL } from '../../config/api';

// Removed hardcoded API_URL - now using centralized config

export const DashboardScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [scaleAnim] = useState(new Animated.Value(0));
  const [dailyGoal, setDailyGoal] = useState(5);
  const [todayPractices, setTodayPractices] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
    loadDailyGoal();
    fetchTodayPractices();
    animateCards();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadDailyGoal();
      fetchTodayPractices();
    });
    return unsubscribe;
  }, [navigation]);

  const loadUser = async () => {
    const userData = await getUser();
    setUser(userData);
  };

  const loadDailyGoal = async () => {
    try {
      const savedGoal = await AsyncStorage.getItem('dailyGoal');
      if (savedGoal) setDailyGoal(parseInt(savedGoal));
    } catch (error) {
      console.error('Error loading daily goal:', error);
    }
  };

  const fetchTodayPractices = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const response = await fetch(`${API_URL}/practice/history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success && data.data) {
        // Count practices from today
        const todayCount = data.data.filter(practice => {
          const practiceDate = new Date(practice.createdAt);
          practiceDate.setHours(0, 0, 0, 0);
          return practiceDate.getTime() === today.getTime();
        }).length;
        
        setTodayPractices(todayCount);
      }
    } catch (error) {
      console.error('Error fetching today practices:', error);
    } finally {
      setLoading(false);
    }
  };

  const animateCards = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  };

  const ActionCard = ({ iconName, title, subtitle, color, onPress, delay = 0 }) => {
    const cardScale = useState(new Animated.Value(1))[0];

    return (
      <Animated.View
        style={[
          styles.actionCard,
          {
            transform: [{ scale: scaleAnim }],
            opacity: scaleAnim,
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onPress}
          style={styles.actionCardTouchable}
        >
          <LinearGradient
            colors={color}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.actionCardGradient}
          >
            <View style={styles.actionCardIcon}>
              <Ionicons name={iconName} size={32} color="#FFFFFF" />
            </View>
            <View style={styles.actionCardContent}>
              <Text style={styles.actionCardTitle}>{title}</Text>
              <Text style={styles.actionCardSubtitle}>{subtitle}</Text>
            </View>
            <View style={styles.actionCardArrow}>
              <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Custom Header with Logo */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <Ionicons name="menu" size={28} color="#0F172A" />
        </TouchableOpacity>

        <View style={styles.logoContainer}>
          <LinearGradient
            colors={['#58CC02', '#78D919']}
            style={styles.logoCircle}
          >
            <Ionicons name="mic" size={20} color="#FFFFFF" />
          </LinearGradient>
          <Text style={styles.logoText}>LinguaKu</Text>
        </View>

        <TouchableOpacity 
          style={styles.profileButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <LinearGradient
            colors={['#58CC02', '#78D919']}
            style={styles.profileCircle}
          >
            <Text style={styles.profileText}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>
            Welcome back, {user?.name?.split(' ')[0] || 'User'}!
          </Text>
          <Text style={styles.welcomeSubtitle}>
            Ready to improve your pronunciation?
          </Text>
        </View>

        {/* Daily Goal Card */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => navigation.navigate('Settings')}
        >
          <LinearGradient
            colors={todayPractices >= dailyGoal ? ['#10B981', '#059669'] : ['#F59E0B', '#D97706']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.dailyGoalCard}
          >
            <View style={styles.dailyGoalContent}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Ionicons 
                  name={todayPractices >= dailyGoal ? "checkmark-circle" : "flame"} 
                  size={22} 
                  color="#FFFFFF" 
                  style={{ marginRight: 8 }} 
                />
                <Text style={styles.dailyGoalTitle}>
                  {todayPractices >= dailyGoal ? '🎉 Goal Achieved!' : 'Daily Goal'}
                </Text>
              </View>
              <Text style={styles.dailyGoalText}>
                {todayPractices} / {dailyGoal} practices today
              </Text>
              <View style={styles.progressBarContainer}>
                <View style={[
                  styles.progressBar, 
                  { width: `${Math.min((todayPractices / dailyGoal) * 100, 100)}%` }
                ]} />
              </View>
              {todayPractices >= dailyGoal && (
                <Text style={styles.goalAchievedText}>
                  Great job! Keep it up! 🌟
                </Text>
              )}
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Start Learning</Text>

        <ActionCard
          iconName="book"
          title="Practice Now"
          subtitle="Choose material & start"
          color={['#58CC02', '#78D919']}
          onPress={() => navigation.navigate('Learn')}
        />

        <ActionCard
          iconName="stats-chart"
          title="Your Progress"
          subtitle="Track improvement"
          color={['#10B981', '#059669']}
          onPress={() => navigation.navigate('Progress')}
          delay={100}
        />

        <ActionCard
          iconName="time"
          title="History"
          subtitle="View past practices"
          color={['#3B82F6', '#2563EB']}
          onPress={() => navigation.navigate('History')}
          delay={200}
        />

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
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  logoIcon: {
    fontSize: 20,
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  profileButton: {
    width: 40,
    height: 40,
  },
  profileCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  welcomeSection: {
    padding: 20,
    paddingTop: 24,
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#64748B',
  },
  dailyGoalCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  dailyGoalContent: {
    // spacing
  },
  dailyGoalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  dailyGoalText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 12,
    opacity: 0.9,
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  goalAchievedText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginTop: 8,
    fontWeight: '600',
    opacity: 0.95,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0F172A',
    marginHorizontal: 20,
    marginBottom: 16,
  },
  actionCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  actionCardTouchable: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  actionCardIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },

  actionCardContent: {
    flex: 1,
  },
  actionCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  actionCardSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  actionCardArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

});