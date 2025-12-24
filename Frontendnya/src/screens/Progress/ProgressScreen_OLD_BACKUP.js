// src/screens/ProgressScreen/ProgressScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getToken } from '../../utils/storage';

const { width } = Dimensions.get('window');
import { API_URL } from '../../config/api';

// Removed hardcoded API_URL - now using centralized config

export const ProgressScreen = ({ navigation }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchStats();
    });
    return unsubscribe;
  }, [navigation]);

  // Fetch stats when period changes
  useEffect(() => {
    if (!loading) {
      fetchStats();
    }
  }, [selectedPeriod]);

  const fetchStats = async () => {
    try {
      const token = await getToken();
      if (!token) {
        Alert.alert('Authentication Required', 'Please login to view your progress.');
        return;
      }

      // Convert period to days for backend
      const days = selectedPeriod === 'week' ? 7 : selectedPeriod === 'month' ? 30 : 90;
      
      console.log(`📊 Fetching statistics for ${days} days...`);
      
      // GUNAKAN ENDPOINT BARU /statistics (SEMPURNA UNTUK GRAFIK)
      const response = await fetch(`${API_URL}/progress/statistics?days=${days}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('Statistics response:', data.success ? 'Success' : 'Failed');
      
      if (data.success && data.data) {
        const statistics = data.data;
        
        // Transform data untuk grafik yang SEMPURNA
        const weeklyData = [];
        
        if (statistics.graphData && statistics.graphData.length > 0) {
          // Group by date untuk aggregate multiple practices per day
          const groupedByDate = {};
          statistics.graphData.forEach(item => {
            if (!groupedByDate[item.date]) {
              groupedByDate[item.date] = {
                scores: [],
                date: item.date
              };
            }
            groupedByDate[item.date].scores.push(item.score);
          });
          
          // Calculate average per day dan format untuk chart
          Object.keys(groupedByDate).sort().forEach(dateKey => {
            const dateData = groupedByDate[dateKey];
            const avgScore = Math.round(
              dateData.scores.reduce((a, b) => a + b, 0) / dateData.scores.length
            );
            
            // Format day label
            const date = new Date(dateData.date);
            const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
            
            weeklyData.push({
              day: selectedPeriod === 'week' ? dayName : dateData.date.split('-')[2], // Day name or date
              score: avgScore,
              practices: dateData.scores.length
            });
          });
        }
        
        // Fill missing days with 0 untuk week view
        if (selectedPeriod === 'week' && weeklyData.length < 7) {
          const today = new Date();
          const fullWeekData = [];
          
          for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
            const dateStr = date.toISOString().split('T')[0];
            
            const existingData = weeklyData.find(d => {
              const itemDate = new Date(d.day);
              return itemDate.toDateString() === date.toDateString();
            });
            
            fullWeekData.push({
              day: dayName,
              score: existingData ? existingData.score : 0,
              practices: existingData ? existingData.practices : 0
            });
          }
          
          weeklyData.length = 0;
          weeklyData.push(...fullWeekData);
        }
        
        setStats({
          totalPractices: statistics.summary.totalPractices || 0,
          averageScore: statistics.summary.averageScore || 0,
          highestScore: statistics.summary.highestScore || 0,
          lowestScore: statistics.summary.lowestScore || 0,
          streak: statistics.summary.currentStreak || 0,
          improvementPercentage: statistics.summary.improvementPercentage || 0,
          accuracyRate: statistics.summary.accuracyRate || 0,
          weeklyData: weeklyData,
          recentActivity: statistics.graphData ? statistics.graphData.slice(-5).reverse().map(item => ({
            material: `Practice on ${item.date}`,
            score: item.score,
            time: formatTimeAgo(new Date(item.date))
          })) : [],
          motivationalMessage: statistics.message || 'Keep practicing!'
        });
        
        console.log('✅ Statistics loaded successfully');
        console.log('Total practices:', statistics.summary.totalPractices);
        console.log('Average score:', statistics.summary.averageScore);
      } else {
        // No data yet
        setStats({
          totalPractices: 0,
          averageScore: 0,
          highestScore: 0,
          lowestScore: 0,
          streak: 0,
          improvementPercentage: 0,
          accuracyRate: 0,
          weeklyData: [],
          recentActivity: [],
          motivationalMessage: 'Start practicing to see your progress!'
        });
      }
    } catch (error) {
      console.error('❌ Fetch stats error:', error);
      Alert.alert('Error', 'Failed to load progress data. Please try again.');
      
      // Set empty stats on error
      setStats({
        totalPractices: 0,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        streak: 0,
        improvementPercentage: 0,
        accuracyRate: 0,
        weeklyData: [],
        recentActivity: [],
        motivationalMessage: 'Unable to load statistics'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 172800) return 'Yesterday';
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  if (loading || !stats) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#58CC02" />
        <Text style={styles.loadingText}>Loading your progress...</Text>
      </View>
    );
  }

  const StatCard = ({ icon, label, value, color, gradient }) => (
    <View style={styles.statCard}>
      <LinearGradient
        colors={gradient}
        style={styles.statCardGradient}
      >
        <Text style={styles.statIcon}>{icon}</Text>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </LinearGradient>
    </View>
  );

  const BarChart = () => {
    const maxScore = Math.max(...stats.weeklyData.map(d => d.score), 1);
    
    const chartTitle = 
      selectedPeriod === 'week' ? 'Last 7 Days Performance' :
      selectedPeriod === 'month' ? 'Last 30 Days Performance' :
      'Last 90 Days Performance';

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>{chartTitle}</Text>
        
        <View style={styles.chart}>
          {stats.weeklyData.map((item, index) => {
            const height = (item.score / maxScore) * 140;
            const color = 
              item.score >= 90 ? '#10B981' :
              item.score >= 75 ? '#3B82F6' :
              item.score >= 60 ? '#F59E0B' : '#EF4444';

            return (
              <View key={index} style={styles.barContainer}>
                <View style={styles.barWrapper}>
                  <View style={[styles.bar, { height, backgroundColor: color }]}>
                    <Text style={styles.barScore}>{item.score}</Text>
                  </View>
                </View>
                <Text style={styles.barLabel}>{item.day}</Text>
              </View>
            );
          })}
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
            <Text style={styles.legendText}>90-100</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
            <Text style={styles.legendText}>75-89</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.legendText}>60-74</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.legendText}>Below 60</Text>
          </View>
        </View>
      </View>
    );
  };

  const ActivityItem = ({ item }) => (
    <View style={styles.activityItem}>
      <View style={styles.activityLeft}>
        <Text style={styles.activityMaterial}>{item.material}</Text>
        <Text style={styles.activityTime}>{item.time}</Text>
      </View>
      <View style={[
        styles.activityScoreBadge,
        { backgroundColor: 
          item.score >= 90 ? '#10B981' :
          item.score >= 75 ? '#3B82F6' :
          item.score >= 60 ? '#F59E0B' : '#EF4444'
        }
      ]}>
        <Text style={styles.activityScore}>{item.score}%</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📊 Your Progress</Text>
        <Text style={styles.headerSubtitle}>Track your improvement</Text>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#58CC02"
            colors={['#58CC02']}
          />
        }
      >
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            icon="📝"
            label="Total Practices"
            value={stats.totalPractices}
            gradient={['#6366F1', '#8B5CF6']}
          />
          <StatCard
            icon="⭐"
            label="Average Score"
            value={`${stats.averageScore}%`}
            gradient={['#10B981', '#059669']}
          />
          <StatCard
            icon="🏆"
            label="Highest Score"
            value={`${stats.highestScore}%`}
            gradient={['#F59E0B', '#D97706']}
          />
          <StatCard
            icon="🔥"
            label="Day Streak"
            value={`${stats.streak} days`}
            gradient={['#EF4444', '#DC2626']}
          />
        </View>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          <TouchableOpacity
            style={[
              styles.periodButton,
              selectedPeriod === 'week' && styles.periodButtonActive
            ]}
            onPress={() => setSelectedPeriod('week')}
          >
            <Text style={[
              styles.periodButtonText,
              selectedPeriod === 'week' && styles.periodButtonTextActive
            ]}>Week</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.periodButton,
              selectedPeriod === 'month' && styles.periodButtonActive
            ]}
            onPress={() => setSelectedPeriod('month')}
          >
            <Text style={[
              styles.periodButtonText,
              selectedPeriod === 'month' && styles.periodButtonTextActive
            ]}>Month</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.periodButton,
              selectedPeriod === 'all' && styles.periodButtonActive
            ]}
            onPress={() => setSelectedPeriod('all')}
          >
            <Text style={[
              styles.periodButtonText,
              selectedPeriod === 'all' && styles.periodButtonTextActive
            ]}>All Time</Text>
          </TouchableOpacity>
        </View>

        {/* Bar Chart */}
        <BarChart />

        {/* Recent Activity */}
        <View style={styles.activitySection}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {stats.recentActivity.map((item, index) => (
            <ActivityItem key={index} item={item} />
          ))}
        </View>

        {/* Insights Card */}
        <LinearGradient
          colors={['#6366F1', '#8B5CF6']}
          style={styles.insightsCard}
        >
          <Text style={styles.insightsIcon}>💡</Text>
          <Text style={styles.insightsTitle}>Keep it up!</Text>
          <Text style={styles.insightsText}>
            Your average score improved by 12% this week. Great progress! 🎉
          </Text>
        </LinearGradient>

        <View style={{ height: 100 }} />
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
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    width: (width - 44) / 2,
    height: 120,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  statCardGradient: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
  },
  periodSelector: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginVertical: 16,
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  periodButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  periodButtonTextActive: {
    color: '#0F172A',
  },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 20,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 160,
    marginBottom: 16,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
  },
  barWrapper: {
    width: '100%',
    height: 140,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: 28,
    borderRadius: 8,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 6,
    minHeight: 30,
  },
  barScore: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  barLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 8,
    fontWeight: '600',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  activitySection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 16,
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  activityLeft: {
    flex: 1,
  },
  activityMaterial: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 13,
    color: '#94A3B8',
  },
  activityScoreBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  activityScore: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  insightsCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  insightsIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  insightsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  insightsText: {
    fontSize: 15,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.95,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
    fontWeight: '600',
  },
});

/**
 * FITUR:
 * - Stats cards (Total, Average, Highest, Streak)
 * - Bar chart 7 hari terakhir
 * - Color coding berdasarkan score
 * - Recent activity list
 * - Insights & tips
 * - Loading state
 * 
 * UNTUK DEMO:
 * - Pakai dummy data dulu
 * - Nanti bisa connect ke backend endpoint /api/progress
 * 
 * CARA CONNECT BACKEND (NANTI):
 * const response = await fetch(`${API_URL}/progress/stats`, {
 *   headers: { 'Authorization': `Bearer ${token}` }
 * });
 */