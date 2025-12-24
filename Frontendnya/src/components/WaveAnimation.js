// src/components/WaveAnimation.js
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

export const WaveAnimation = ({ isRecording }) => {
  const wave1 = useRef(new Animated.Value(1)).current;
  const wave2 = useRef(new Animated.Value(1)).current;
  const wave3 = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(wave1, {
              toValue: 1.3,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(wave1, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(wave2, {
              toValue: 1.5,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(wave2, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(wave3, {
              toValue: 1.7,
              duration: 1200,
              useNativeDriver: true,
            }),
            Animated.timing(wave3, {
              toValue: 1,
              duration: 1200,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    } else {
      wave1.setValue(1);
      wave2.setValue(1);
      wave3.setValue(1);
    }
  }, [isRecording]);

  if (!isRecording) return null;

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.wave,
          {
            transform: [{ scale: wave3 }],
            opacity: 0.2,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.wave,
          {
            transform: [{ scale: wave2 }],
            opacity: 0.4,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.wave,
          {
            transform: [{ scale: wave1 }],
            opacity: 0.6,
          },
        ]}
      />
      <View style={styles.center} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wave: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#6366F1',
  },
  center: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6366F1',
    zIndex: 10,
  },
});