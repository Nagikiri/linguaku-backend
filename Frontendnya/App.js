// App.js
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { getToken } from './src/utils/storage';
import * as Linking from 'expo-linking';

// Import Screens
import { LoginScreen } from './src/screens/Auth/LoginScreen';
import { RegisterScreen } from './src/screens/Auth/RegisterScreen';
import EmailVerificationScreen from './src/screens/Auth/EmailVerificationScreen';
import ForgotPasswordScreen from './src/screens/Auth/ForgotPasswordScreen';
import ResetPasswordScreen from './src/screens/Auth/ResetPasswordScreen';
import { PracticeScreen } from './src/screens/Material/PracticeScreen';
import { ProfileScreen } from './src/screens/Profile/ProfileScreen';
import { SettingsScreen } from './src/screens/Settings/SettingsScreen';

// Import Bottom Tab Navigator
import { BottomTabNavigator } from './src/navigation/BottomTabNavigator';

const Stack = createStackNavigator();

// Deep Linking Configuration
const linking = {
  prefixes: ['linguaku://', 'https://linguaku.com', 'https://www.linguaku.com'],
  config: {
    screens: {
      Login: 'login',
      Register: 'register',
      EmailVerification: {
        path: 'verify-email/:token?',
        parse: {
          token: (token) => token || null
        }
      },
      ForgotPassword: 'forgot-password',
      ResetPassword: {
        path: 'reset-password/:token',
        parse: {
          token: (token) => token
        }
      },
      Main: {
        screens: {
          Dashboard: 'dashboard',
          Material: 'material',
          History: 'history',
          Progress: 'progress'
        }
      },
      Practice: 'practice',
      Profile: 'profile',
      Settings: 'settings'
    }
  }
};

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // FIXED: Run auth check ONLY ONCE on mount
  useEffect(() => {
    checkLoginStatus();
  }, []); // Empty dependency array - runs only once

  const checkLoginStatus = async () => {
    try {
      console.log('🔍 Checking login status...');
      const token = await getToken();
      
      if (token) {
        console.log('✅ Token found:', token.substring(0, 20) + '...');
        setIsLoggedIn(true);
      } else {
        console.log('⚠️ No token found');
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.error('❌ Error checking login:', error);
      setIsLoggedIn(false);
    } finally {
      // FIXED: Set loading to false after 300ms to prevent flash
      setTimeout(() => setIsLoading(false), 300);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animationEnabled: true,
        }}
        initialRouteName={isLoggedIn ? 'Main' : 'Login'}
      >
        {/* Auth Screens */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="EmailVerification" component={EmailVerificationScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />

        {/* Main App with Bottom Tab Navigator */}
        <Stack.Screen name="Main" component={BottomTabNavigator} />

        {/* Modal/Full Screens (fullscreen, no bottom tab) */}
        <Stack.Screen 
          name="Practice" 
          component={PracticeScreen}
          options={{
            presentation: 'modal',
          }}
        />
        <Stack.Screen 
          name="Profile" 
          component={ProfileScreen}
        />
        <Stack.Screen 
          name="Settings" 
          component={SettingsScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
});