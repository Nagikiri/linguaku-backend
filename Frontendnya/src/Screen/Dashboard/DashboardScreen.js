// src/screens/Dashboard/DashboardScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Card } from '../../components/GlassCard';
import { COLORS } from '../../constants/colors';
import { getData } from '../../utils/storage';

export const DashboardScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [lastScore, setLastScore] = useState(null);
  const [totalPractices, setTotalPractices] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const currentUser = await getData('currentUser');
      setUser(currentUser);
      
      // Load history data (dummy for now)
      const history = await getData('practiceHistory') || [];
      setTotalPractices(history.length);
      
      if (history.length > 0) {
        setLastScore(history[history.length - 1].score);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserData();
    setRefreshing(false);
  };

  const MenuCard = ({ title, subtitle, icon, onPress, color }) => (
    <Card onPress={onPress} style={styles.menuCard}>
      <View style={styles.menuContent}>
        <View style={[styles.iconContainer, { backgroundColor: color }]}>
          <Text style={styles.iconText}>{icon}</Text>
        </View>
        <View style={styles.menuTextContainer}>
          <Text style={styles.menuTitle}>{title}</Text>
          <Text style={styles.menuSubtitle}>{subtitle}</Text>
        </View>
        <Text style={styles.arrow}>→</Text>
      </View>
    </Card>
  );

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, {user?.name || 'User'}! 👋</Text>
        <Text style={styles.subtitle}>Ready to practice today?</Text>
      </View>

      {/* Stats Card */}
      <Card style={styles.statsCard}>
        <Text style={styles.statsTitle}>Your Progress</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalPractices}</Text>
            <Text style={styles.statLabel}>Practices</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {lastScore ? `${lastScore}%` : '-'}
            </Text>
            <Text style={styles.statLabel}>Last Score</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Streak Days</Text>
          </View>
        </View>
      </Card>

      {/* Menu Options */}
      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <MenuCard
          title="Start Practice"
          subtitle="Choose material and practice"
          icon="🎤"
          color={COLORS.primary}
          onPress={() => navigation.navigate('MaterialList')}
        />
        
        <MenuCard
          title="Practice History"
          subtitle="View your past practices"
          icon="📜"
          color={COLORS.secondary}
          onPress={() => navigation.navigate('History')}
        />
        
        <MenuCard
          title="Progress Chart"
          subtitle="Track your improvement"
          icon="📈"
          color={COLORS.warning}
          onPress={() => navigation.navigate('Progress')}
        />
        
        <MenuCard
          title="My Profile"
          subtitle="Edit your account settings"
          icon="👤"
          color={COLORS.dark}
          onPress={() => navigation.navigate('Profile')}
        />
      </View>

      {/* Tips Card */}
      <Card style={styles.tipCard}>
        <View style={styles.tipHeader}>
          <Text style={styles.tipIcon}>💡</Text>
          <Text style={styles.tipTitle}>Daily Tip</Text>
        </View>
        <Text style={styles.tipText}>
          Practice for 10 minutes every day to see significant improvement in your pronunciation!
        </Text>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: COLORS.primary,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.white,
    opacity: 0.9,
  },
  statsCard: {
    marginTop: -30,
    marginHorizontal: 20,
    backgroundColor: COLORS.white,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginVertical: 8,
  },
  menuSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  menuCard: {
    marginHorizontal: 20,
    marginVertical: 6,
  },
  menuContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  iconText: {
    fontSize: 24,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 13,
    color: COLORS.textLight,
  },
  arrow: {
    fontSize: 20,
    color: COLORS.lightGray,
  },
  tipCard: {
    marginHorizontal: 20,
    marginVertical: 16,
    backgroundColor: '#FFF9E6',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
  },
  tipText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
});