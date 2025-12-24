// src/screens/Material/MaterialListScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Dimensions,
  Alert,
  SectionList,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { API_URL } from '../../config/api';

// Removed hardcoded API_URL - now using centralized config
const { width } = Dimensions.get('window');
const CACHE_KEY = 'materials_cache';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export const MaterialListScreen = ({ navigation }) => {
  const [materials, setMaterials] = useState([]);
  const [groupedMaterials, setGroupedMaterials] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState('All');

  useEffect(() => {
    loadMaterialsWithCache();
  }, []);

  const loadMaterialsWithCache = async () => {
    try {
      // 1. LOAD FROM CACHE FIRST (INSTANT)
      const cachedData = await AsyncStorage.getItem(CACHE_KEY);
      
      if (cachedData) {
        const { materials: cachedMaterials, timestamp } = JSON.parse(cachedData);
        const age = Date.now() - timestamp;
        
        // Show cached data immediately
        const materialsWithColors = cachedMaterials.map((mat) => ({
          ...mat,
          color: getColorForLevel(mat.level),
        }));
        setMaterials(materialsWithColors);
        setGroupedMaterials(groupByLevel(materialsWithColors));
        setLoading(false); // Stop loading immediately
        
        // 2. If cache is fresh (< 24h), don't fetch
        if (age < CACHE_TTL) {
          return;
        }
      }
      
      // 3. FETCH FROM API IN BACKGROUND (if no cache or cache expired)
      fetchMaterialsFromAPI(false); // false = don't show loading spinner
      
    } catch (error) {
      console.error('Cache load error:', error);
      // Fallback to API fetch
      fetchMaterialsFromAPI(true);
    }
  };

  const fetchMaterialsFromAPI = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      
      const response = await fetch(`${API_URL}/materials`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();

      if (data.success && data.data.length > 0) {
        // Save to cache with timestamp
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({
          materials: data.data,
          timestamp: Date.now()
        }));
        
        // Update UI
        const materialsWithColors = data.data.map((mat) => ({
          ...mat,
          color: getColorForLevel(mat.level),
        }));
        setMaterials(materialsWithColors);
        setGroupedMaterials(groupByLevel(materialsWithColors));
      } else {
        console.warn('No materials found');
      }
    } catch (error) {
      console.error('Fetch materials error:', error);
      // Only show alert if we have no cached data
      if (materials.length === 0) {
        Alert.alert(
          'Connection Error',
          'Failed to load materials. Please check your connection.',
          [{ text: 'Retry', onPress: () => fetchMaterialsFromAPI(true) }]
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchMaterials = () => {
    // Force refresh from API
    fetchMaterialsFromAPI(true);
  };

  const getColorForLevel = (level) => {
    switch (level?.toLowerCase()) {
      case 'beginner':
        return ['#10B981', '#059669']; // Green
      case 'intermediate':
        return ['#3B82F6', '#2563EB']; // Blue
      case 'advanced':
        return ['#EF4444', '#DC2626']; // Red
      default:
        return ['#6366F1', '#8B5CF6']; // Purple
    }
  };

  const groupByLevel = (materialsArray) => {
    const grouped = {};
    materialsArray.forEach((mat) => {
      const level = mat.level || 'Other';
      if (!grouped[level]) {
        grouped[level] = [];
      }
      grouped[level].push(mat);
    });
    return grouped;
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchMaterials();
  };

  const getLevelIcon = (level) => {
    switch (level?.toLowerCase()) {
      case 'beginner':
        return '🌱';
      case 'intermediate':
        return '⚡';
      case 'advanced':
        return '🔥';
      default:
        return '📚';
    }
  };

  const MaterialCard = ({ item, index }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const [pressed, setPressed] = useState(false);

    const handlePressIn = () => {
      setPressed(true);
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      setPressed(false);
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 40,
        friction: 3,
        useNativeDriver: true,
      }).start();
    };

    const handlePress = () => {
      navigation.navigate('Practice', { material: item });
    };

    return (
      <Animated.View
        style={[
          styles.cardWrapper,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handlePress}
        >
          <LinearGradient
            colors={item.color || ['#6366F1', '#8B5CF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.card}
          >
            {/* Level Badge */}
            <View style={styles.levelBadge}>
              <Text style={styles.levelIcon}>{getLevelIcon(item.level)}</Text>
              <Text style={styles.levelText}>{item.level}</Text>
            </View>

            {/* Content */}
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardCategory}>{item.category}</Text>
              
              {/* Preview Text */}
              {item.items && item.items.length > 0 && (
                <View style={styles.previewContainer}>
                  <Text style={styles.previewLabel}>Preview:</Text>
                  <Text style={styles.previewText} numberOfLines={2}>
                    "{item.items[0].text}"
                  </Text>
                </View>
              )}

              {/* Exercises Count */}
              <View style={styles.exercisesContainer}>
                <Text style={styles.exercisesIcon}>📝</Text>
                <Text style={styles.exercisesText}>
                  {item.items?.length || 0} exercises
                </Text>
              </View>
            </View>

            {/* Arrow */}
            <View style={styles.arrowContainer}>
              <Text style={styles.arrow}>›</Text>
            </View>

            {/* Decorative Circle */}
            <View style={styles.decorCircle1} />
            <View style={styles.decorCircle2} />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading materials...</Text>
      </View>
    );
  }

  // Prepare data for SectionList
  const sections = Object.keys(groupedMaterials)
    .sort((a, b) => {
      const order = { 'Beginner': 1, 'Intermediate': 2, 'Advanced': 3 };
      return (order[a] || 999) - (order[b] || 999);
    })
    .filter((level) => selectedLevel === 'All' || level === selectedLevel)
    .map((level) => ({
      title: level,
      data: groupedMaterials[level],
    }));

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Choose Material</Text>
          <Text style={styles.headerSubtitle}>
            {materials.length} lessons available
          </Text>
        </View>
      </View>

      {/* Level Filter Tabs */}
      <View style={styles.filterContainer}>
        {['All', 'Beginner', 'Intermediate', 'Advanced'].map((level) => (
          <TouchableOpacity
            key={level}
            style={[
              styles.filterTab,
              selectedLevel === level && styles.filterTabActive,
            ]}
            onPress={() => setSelectedLevel(level)}
          >
            <Text
              style={[
                styles.filterTabText,
                selectedLevel === level && styles.filterTabTextActive,
              ]}
            >
              {level}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Materials List */}
      <SectionList
        sections={sections}
        keyExtractor={(item) => item._id}
        renderItem={({ item, index }) => (
          <MaterialCard item={item} index={index} />
        )}
        renderSectionHeader={({ section: { title } }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>
              {getLevelIcon(title)} {title}
            </Text>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#6366F1"
            colors={['#6366F1']}
          />
        }
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
  headerTextContainer: {
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
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 8,
  },
  filterTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  filterTabActive: {
    backgroundColor: '#6366F1',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  sectionHeader: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 8,
  },
  sectionHeaderText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  listContent: {
    padding: 20,
    paddingBottom: 120,
  },
  cardWrapper: {
    marginBottom: 20,
  },
  card: {
    borderRadius: 24,
    padding: 24,
    minHeight: 180,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  levelIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  levelText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  cardCategory: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 16,
    fontWeight: '500',
  },
  previewContainer: {
    marginBottom: 16,
  },
  previewLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: 6,
    fontWeight: '600',
  },
  previewText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontStyle: 'italic',
    opacity: 0.95,
  },
  exercisesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exercisesIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  exercisesText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
    opacity: 0.9,
  },
  arrowContainer: {
    position: 'absolute',
    right: 24,
    top: '50%',
    marginTop: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrow: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  decorCircle1: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: -30,
    right: -30,
  },
  decorCircle2: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    bottom: -20,
    left: -20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 16,
  },
});