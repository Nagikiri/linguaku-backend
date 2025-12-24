// src/navigation/BottomTabNavigator.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Import Screens
import { DashboardScreen } from '../screens/Dashboard/DashboardScreen';
import { MaterialListScreen } from '../screens/Material/MaterialListScreen';
import { HistoryScreen } from '../screens/History/HistoryScreen';
import { ProgressScreen } from '../screens/Progress/ProgressScreen';

const Tab = createBottomTabNavigator();

const TabIcon = ({ iconName, label, focused }) => (
  <View style={styles.tabIconContainer}>
    {focused && (
      <View style={styles.tabIconBackground} />
    )}
    <Ionicons 
      name={iconName} 
      size={24} 
      color={focused ? '#58CC02' : '#94A3B8'} 
      style={styles.tabIcon}
    />
    <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>
      {label}
    </Text>
  </View>
);

export const BottomTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#58CC02',
        tabBarInactiveTintColor: '#94A3B8',
      }}
    >
      <Tab.Screen
        name="Home"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon iconName="home" label="Home" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Learn"
        component={MaterialListScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon iconName="book" label="Learn" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon iconName="time" label="History" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon iconName="stats-chart" label="Progress" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 90 : 80, // Avoid collision with phone buttons
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 25 : 20, // Extra padding for Android virtual buttons
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: 60, // Reduced untuk memastikan fit
    height: 48,
    paddingVertical: 4, // Inner padding
  },
  tabIconBackground: {
    position: 'absolute',
    width: 56,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#58CC02',
    opacity: 0.12,
  },
  tabIcon: {
    marginBottom: 3,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: 2,
  },
  tabLabelFocused: {
    color: '#58CC02',
    fontWeight: '800',
  },
});