// src/components/ScoreCircle.js
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

export const ScoreCircle = ({ score, size = 120 }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: score,
      useNativeDriver: false,
      tension: 10,
      friction: 7,
    }).start();
  }, [score]);

  // Color based on score
  const getColor = () => {
    if (score >= 90) return '#10B981'; // Green
    if (score >= 75) return '#3B82F6'; // Blue
    if (score >= 60) return '#F59E0B'; // Yellow
    return '#EF4444'; // Red
  };

  const getLabel = () => {
    if (score >= 90) return 'Excellent!';
    if (score >= 75) return 'Good Job!';
    if (score >= 60) return 'Not Bad!';
    return 'Keep Trying!';
  };

  return (
    <View style={styles.container}>
      <View style={[styles.circle, { width: size, height: size, borderColor: getColor() }]}>
        <Text style={[styles.score, { color: getColor() }]}>{Math.round(score)}</Text>
        <Text style={styles.percentage}>%</Text>
      </View>
      <Text style={[styles.label, { color: getColor() }]}>{getLabel()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 20,
  },
  circle: {
    borderRadius: 1000,
    borderWidth: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  score: {
    fontSize: 42,
    fontWeight: 'bold',
  },
  percentage: {
    fontSize: 18,
    color: '#64748B',
    marginTop: -8,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
  },
});