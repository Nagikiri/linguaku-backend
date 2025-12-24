// src/navigation/AppNavigator.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { COLORS } from '../constants/colors';

// Screens
import { DashboardScreen } from '../screens/Dashboard/DashboardScreen';
import { ProfileScreen } from '../screens/Profile/ProfileScreen';
import { MaterialListScreen } from '../screens/Material/MaterialListScreen';
import { PracticeScreen } from '../screens/Material/PracticeScreen';
import { HistoryScreen } from '../screens/History/HistoryScreen';
import { ProgressScreen } from '../screens/Progress/ProgressScreen';

const Tab = createBottomTabNavigator();
const HomeStack = createStackNavigator();

// Home Stack (Dashboard + Practice)
const HomeStackScreen = () => {
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <HomeStack.Screen name="Dashboard" component={DashboardScreen} />
      <HomeStack.Screen name="MaterialList" component={MaterialListScreen} />
      <HomeStack.Screen name="Practice" component={PracticeScreen} />
    </HomeStack.Navigator>
  );
};

// Main Tab Navigator
export const AppNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray,
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeStackScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>🏠</Text>
          ),
        }}
      />
      <Tab.Screen 
        name="History" 
        component={HistoryScreen}
        options={{
          tabBarLabel: 'History',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>📜</Text>
          ),
        }}
      />
      <Tab.Screen 
        name="Progress" 
        component={ProgressScreen}
        options={{
          tabBarLabel: 'Progress',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>📈</Text>
          ),
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>👤</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// Note: Import Text from react-native at the top
import { Text } from 'react-native';