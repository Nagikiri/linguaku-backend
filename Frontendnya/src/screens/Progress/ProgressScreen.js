// src/screens/Progress/ProgressScreen.js
import React, { useState, useEffect, useCallback } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import { getToken } from '../../utils/storage';
import { API_URL, API_ENDPOINTS, fetchWithTimeout } from '../../config/api';
import { formatTimeAgo } from '../../utils/timeAgo';

const { width } = Dimensions.get('window');

export const ProgressScreen = ({ navigation }) => {
  const [stats, setStats] = useState(null);
  const [weeklyPerformance, setWeeklyPerformance] = useState([]);
  const [weeklyInsight, setWeeklyInsight] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load data when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadAllData();
    }, [])
  );

  const loadAllData = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      
      if (!token) {
        Alert.alert('Authentication Required', 'Please login to view your progress.');
        return;
      }

      // Load all data in parallel
      await Promise.all([
        loadWeeklyPerformance(token),
        loadWeeklyInsight(token),
        loadRecentActivity(token)
      ]);
      
    } catch (error) {
      console.error('Load data error:', error);
      Alert.alert('Error', 'Failed to load progress data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadWeeklyPerformance = async (token) => {
    try {
      const response = await fetchWithTimeout(
        API_URL + API_ENDPOINTS.WEEKLY_PERFORMANCE,
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
        setWeeklyPerformance(data.data || []);
      } else {
        console.error('Failed to load weekly performance:', data.message);
        setWeeklyPerformance([]);
      }
    } catch (error) {
      console.error('Load weekly performance error:', error);
      setWeeklyPerformance([]);
    }
  };

  const loadWeeklyInsight = async (token) => {
    try {
      const response = await fetchWithTimeout(
        API_URL + API_ENDPOINTS.WEEKLY_INSIGHT,
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
        setWeeklyInsight(data.data);
      } else {
        console.error('Failed to load weekly insight:', data.message);
        setWeeklyInsight(null);
      }
    } catch (error) {
      console.error('Load weekly insight error:', error);
      setWeeklyInsight(null);
    }
  };

  const loadRecentActivity = async (token) => {
    try {
      const response = await fetchWithTimeout(
        API_URL + API_ENDPOINTS.RECENT_ACTIVITY + '?limit=3',
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
        setRecentActivity(data.data || []);
      } else {
        console.error('Failed to load recent activity:', data.message);
        setRecentActivity([]);
      }
    } catch (error) {
      console.error('Load recent activity error:', error);
      setRecentActivity([]);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAllData();
  };

  // Calculate summary stats from weekly performance
  const calculateStats = () => {
    if (!weeklyPerformance || weeklyPerformance.length === 0) {
      return {
        totalPractices: 0,
        averageScore: 0,
        highestScore: 0,
        streak: weeklyPerformance.filter(d => d.practiceCount > 0).length
      };
    }

    const totalPractices = weeklyPerformance.reduce((sum, d) => sum + d.practiceCount, 0);
    const scoresWithPractices = weeklyPerformance.filter(d => d.practiceCount > 0);
    const averageScore = scoresWithPractices.length > 0
      ? Math.round(scoresWithPractices.reduce((sum, d) => sum + d.avgScore, 0) / scoresWithPractices.length)
      : 0;
    const highestScore = Math.max(...weeklyPerformance.map(d => d.avgScore), 0);
    const streak = weeklyPerformance.filter(d => d.practiceCount > 0).length;

    return {
      totalPractices,
      averageScore,
      highestScore,
      streak
    };
  };

  const stats_calculated = calculateStats();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#58CC02" />
        <Text style={styles.loadingText}>Loading your progress...</Text>
      </View>
    );
  }

  const StatCard = ({ icon, label, value, gradient }) => (
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
    const maxScore = Math.max(...weeklyPerformance.map(d => d.avgScore), 1);

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Last 7 Days Performance</Text>
        
        {weeklyPerformance.length === 0 ? (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>No practice data yet</Text>
            <Text style={styles.noDataSubtext}>Start practicing to see your progress!</Text>
          </View>
        ) : (
          <>
            <View style={styles.chart}>
              {weeklyPerformance.map((item, index) => {
                const height = item.avgScore > 0 ? (item.avgScore / maxScore) * 140 : 0;
                
                // Determine color based on avgScore
                let color = '#CBD5E1'; // gray for no data
                if (item.practiceCount > 0) {
                  if (item.avgScore >= 90) color = '#10B981'; // green
                  else if (item.avgScore >= 75) color = '#3B82F6'; // blue
                  else if (item.avgScore >= 60) color = '#F59E0B'; // orange
                  else color = '#EF4444'; // red
                }

                return (
                  <View key={index} style={styles.barContainer}>
                    <View style={styles.barWrapper}>
                      {item.practiceCount > 0 ? (
                        <View style={[styles.bar, { height: Math.max(height, 30), backgroundColor: color }]}>
                          <Text style={styles.barScore}>{item.avgScore}</Text>
                        </View>
                      ) : (
                        <View style={[styles.bar, { height: 30, backgroundColor: color, opacity: 0.3 }]}>
                          <Text style={[styles.barScore, { opacity: 0.5 }]}>0</Text>
                        </View>
                      )}
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
                <Text style={styles.legendText}>Excellent (90-100)</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
                <Text style={styles.legendText}>Good (75-89)</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
                <Text style={styles.legendText}>Fair (60-74)</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                <Text style={styles.legendText}>Need Practice</Text>
              </View>
            </View>
          </>
        )}
      </View>
    );
  };

  const ActivityItem = ({ item }) => {
    const scoreColor = 
      item.score >= 90 ? '#10B981' :
      item.score >= 75 ? '#3B82F6' :
      item.score >= 60 ? '#F59E0B' : '#EF4444';

    return (
      <View style={styles.activityItem}>
        <View style={styles.activityLeft}>
          <Text style={styles.activityMaterial} numberOfLines={2} ellipsizeMode="tail">
            {item.lessonName || 'Practice'}
          </Text>
          <Text style={styles.activityTime} numberOfLines={1}>
            {formatTimeAgo(item.completedAt)}
          </Text>
        </View>
        <View style={[styles.activityScoreBadge, { backgroundColor: scoreColor }]}>
          <Text style={styles.activityScore}>{item.score}%</Text>
        </View>
      </View>
    );
  };

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
            value={stats_calculated.totalPractices}
            gradient={['#6366F1', '#8B5CF6']}
          />
          <StatCard
            icon="⭐"
            label="Average Score"
            value={`${stats_calculated.averageScore}%`}
            gradient={['#10B981', '#059669']}
          />
          <StatCard
            icon="🏆"
            label="Highest Score"
            value={`${stats_calculated.highestScore}%`}
            gradient={['#F59E0B', '#D97706']}
          />
          <StatCard
            icon="🔥"
            label="Days Active"
            value={`${stats_calculated.streak} days`}
            gradient={['#EF4444', '#DC2626']}
          />
        </View>

        {/* Bar Chart */}
        <BarChart />

        {/* Recent Activity */}
        <View style={styles.activitySection}>
          <View style={styles.activityHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            {recentActivity.length > 0 && (
              <TouchableOpacity onPress={() => navigation.navigate('History')}>
                <Text style={styles.viewAllText}>View All →</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {recentActivity.length === 0 ? (
            <View style={styles.noActivityContainer}>
              <Text style={styles.noActivityText}>No recent activity</Text>
              <Text style={styles.noActivitySubtext}>Complete some practices to see them here!</Text>
            </View>
          ) : (
            recentActivity.map((item, index) => (
              <ActivityItem key={index} item={item} />
            ))
          )}
        </View>

        {/* Weekly Insight Card */}
        {weeklyInsight && (
          <LinearGradient
            colors={
              weeklyInsight.color === 'green' ? ['#10B981', '#059669'] :
              weeklyInsight.color === 'blue' ? ['#3B82F6', '#2563EB'] :
              weeklyInsight.color === 'orange' ? ['#F59E0B', '#D97706'] :
              weeklyInsight.color === 'red' ? ['#EF4444', '#DC2626'] :
              ['#64748B', '#475569']
            }
            style={styles.insightsCard}
          >
            <Text style={styles.insightsIcon}>{weeklyInsight.emoji || '💡'}</Text>
            <Text style={styles.insightsTitle}>Weekly Insight</Text>
            <Text style={styles.insightsText}>{weeklyInsight.message}</Text>
            {weeklyInsight.improvement !== 0 && (
              <Text style={styles.insightsImprovement}>
                {weeklyInsight.improvement > 0 ? '▲' : '▼'} {Math.abs(weeklyInsight.improvement)}% from last week
              </Text>
            )}
          </LinearGradient>
        )}

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
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noDataText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
  },
  noDataSubtext: {
    fontSize: 14,
    color: '#94A3B8',
  },
  activitySection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#58CC02',
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
    marginRight: 12,
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
  noActivityContainer: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  noActivityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
  },
  noActivitySubtext: {
    fontSize: 14,
    color: '#94A3B8',
  },
  insightsCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
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
  insightsImprovement: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
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
