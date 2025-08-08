import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';
import Constants from 'expo-constants';

// Keep the native splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Check if we're in development mode
const isDevelopment = __DEV__ || Constants.appOwnership === 'expo';

console.log('🚀 RootNavigator loaded:', {
  isDevelopment,
  appOwnership: Constants.appOwnership,
  __DEV__,
  message: isDevelopment ? 'Splash disabled in development - use Test button' : 'Splash enabled for production'
});

import SplashScreen from '../screens/auth/SplashScreen';
import OnboardingScreen from '../screens/auth/OnboardingScreen';
import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';
import { useAuth } from '../contexts/AuthContext-firebase';

const Stack = createStackNavigator();

export default function RootNavigator() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('splash');
  const [showSplash, setShowSplash] = useState(!isDevelopment); // Skip splash in development
  const [splashReady, setSplashReady] = useState(false);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  // Hide native splash screen when our custom splash is ready
  useEffect(() => {
    if (showSplash && !isLoading) {
      // Small delay to ensure our custom splash is ready to show
      setTimeout(() => {
        SplashScreen.hideAsync();
      }, 100);
    }
  }, [showSplash, isLoading]);

  const checkOnboardingStatus = async () => {
    try {
      const hasCompletedOnboarding = await AsyncStorage.getItem('hasCompletedOnboarding');
      setShowOnboarding(hasCompletedOnboarding !== 'true');
      setIsLoading(false);
      
      // Mark splash as ready after a small delay
      setTimeout(() => {
        setSplashReady(true);
      }, 500);
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setShowOnboarding(true);
      setIsLoading(false);
      setSplashReady(true);
    }
  };

  const handleSplashComplete = async () => {
    console.log('Splash animation completed');
    setShowSplash(false);
    
    // Hide the native splash screen
    await SplashScreen.hideAsync();
    
    if (showOnboarding) {
      setCurrentScreen('onboarding');
    } else {
      setCurrentScreen('ready');
    }
  };

  const handleOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
      setCurrentScreen('ready');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
  };

  const handleAuthSuccess = () => {
    setCurrentScreen('ready');
  };

  // Always show splash screen first, regardless of loading state
  if (showSplash) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash">
          {() => splashReady ? <SplashScreen onComplete={handleSplashComplete} /> : 
            <View style={{ flex: 1, backgroundColor: '#000' }} />
          }
        </Stack.Screen>
      </Stack.Navigator>
    );
  }

  // Show loading state after splash if still loading
  if (isLoading || authLoading) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Loading">
          {() => (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
              <ActivityIndicator size="large" color="#FFD700" />
              <Text style={{ color: '#FFF', marginTop: 16 }}>Loading...</Text>
            </View>
          )}
        </Stack.Screen>
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {currentScreen === 'onboarding' ? (
        <Stack.Screen name="Onboarding">
          {() => <OnboardingScreen onComplete={handleOnboardingComplete} />}
        </Stack.Screen>
      ) : currentScreen === 'ready' ? (
        isAuthenticated ? (
          <Stack.Screen name="Main" component={AppNavigator} />
        ) : (
          <Stack.Screen name="Auth">
            {() => <AuthNavigator onAuthSuccess={handleAuthSuccess} />}
          </Stack.Screen>
        )
      ) : null}
    </Stack.Navigator>
  );
}
}