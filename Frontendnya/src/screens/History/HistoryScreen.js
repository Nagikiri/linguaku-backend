// src/screens/History/HistoryScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getToken } from '../../utils/storage';

import { API_URL } from '../../config/api';

// Removed hardcoded API_URL - now using centralized config

export const HistoryScreen = () => {
  const [history, setHistory] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      
      if (!token) {
        console.warn('No token found');
        Alert.alert('Authentication Required', 'Please login to view your history.');
        setHistory([]);
        return;
      }

      
      const response = await fetch(`${API_URL}/history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.data) {
        setHistory(data.data);
      } else {
        setHistory([]);
        if (data.message) {
        }
      }
    } catch (error) {
      console.error('Load history error:', error);
      Alert.alert('Error', 'Failed to load practice history. Please check your connection and try again.');
      setHistory([]);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadHistory();
  };

  const handleClearAll = async () => {
    Alert.alert(
      'Clear All History',
      'Are you sure you want to delete all practice history? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await getToken();
              if (!token) return;

              const response = await fetch(`${API_URL}/history/clear`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              });

              const data = await response.json();

              if (data.success) {
                setHistory([]);
                Alert.alert('Success', data.message);
              }
            } catch (error) {
              console.error('Clear history error:', error);
              Alert.alert('Error', 'Failed to clear history');
            }
          },
        },
      ]
    );
  };

  const handleDelete = async (id) => {
    Alert.alert(
      'Delete Practice',
      'Delete this practice from history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await getToken();
              if (!token) return;

              const response = await fetch(`${API_URL}/history/${id}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              });

              if (response.ok) {
                setHistory(history.filter((item) => item._id !== id));
              }
            } catch (error) {
              console.error('Delete practice error:', error);
              Alert.alert('Error', 'Failed to delete practice');
            }
          },
        },
      ]
    );
  };

  const getScoreColor = (score) => {
    if (score >= 90) return ['#10B981', '#059669'];
    if (score >= 75) return ['#3B82F6', '#2563EB'];
    if (score >= 60) return ['#F59E0B', '#D97706'];
    return ['#EF4444', '#DC2626'];
  };

  const getScoreLabel = (score) => {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Need Practice';
  };

  const getTimeAgo = (dateString) => {
    if (!dateString) return 'Unknown';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      return `${diffDays} days ago`;
    } catch (error) {
      return 'Unknown';
    }
  };

  const HistoryCard = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <TouchableOpacity style={styles.cardLeft} activeOpacity={0.7}>
          <Text style={styles.cardTitle} numberOfLines={2} ellipsizeMode="tail">
            {item.materialId?.title || 'Practice Exercise'}
          </Text>
          <Text style={styles.cardText} numberOfLines={2} ellipsizeMode="tail">
            "{item.itemText || item.materialId?.text || 'No text'}"
          </Text>
          <Text style={styles.cardTime}>{getTimeAgo(item.createdAt)}</Text>
        </TouchableOpacity>

        <View style={styles.cardRight}>
          <LinearGradient
            colors={getScoreColor(item.score)}
            style={styles.scoreBadge}
          >
            <Text style={styles.scoreNumber}>{item.score}</Text>
            <Text style={styles.scorePercent}>%</Text>
          </LinearGradient>
          <Text style={[styles.scoreLabel, { color: getScoreColor(item.score)[0] }]}>
            {getScoreLabel(item.score)}
          </Text>
        </View>
      </View>
      
      {/* Delete Button */}
      <TouchableOpacity 
        style={styles.deleteButton}
        onPress={() => handleDelete(item._id)}
      >
        <Text style={styles.deleteButtonText}>🗑️</Text>
      </TouchableOpacity>
    </View>
  );

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📝</Text>
      <Text style={styles.emptyTitle}>No Practice History</Text>
      <Text style={styles.emptyText}>
        Start practicing to see your progress here!
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Practice History</Text>
          <Text style={styles.headerSubtitle}>
            {history.length} {history.length === 1 ? 'practice' : 'practices'} recorded
          </Text>
        </View>
        {history.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClearAll}
          >
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* List */}
      <FlatList
        data={history}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <HistoryCard item={item} />}
        contentContainerStyle={[
          styles.listContent,
          history.length === 0 && styles.listContentEmpty,
        ]}
        ListEmptyComponent={<EmptyState />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6366F1"
            colors={['#6366F1']}
          />
        }
        showsVerticalScrollIndicator={false}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerLeft: {
    flex: 1,
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
  clearButton: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  listContent: {
    padding: 20,
    paddingBottom: 120, // Space untuk bottom tab yang sudah dinaikkan
  },
  listContentEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 16,
  },
  cardLeft: {
    flex: 1,
    marginRight: 16,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 6,
  },
  cardText: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  cardTime: {
    fontSize: 12,
    color: '#94A3B8',
  },
  cardRight: {
    alignItems: 'center',
  },
  scoreBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  scoreNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scorePercent: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  scoreLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});