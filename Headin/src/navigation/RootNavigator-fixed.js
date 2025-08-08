import React, { useState, useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import SplashScreen from '../screens/auth/SplashScreen';
import OnboardingScreen from '../screens/auth/OnboardingScreen';
import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';
import { useAuth } from '../contexts/AuthContext-minimal';

const Stack = createStackNavigator();

export default function RootNavigator() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [appState, setAppState] = useState('loading');
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  // Update app state when auth state changes
  useEffect(() => {
    if (!authLoading) {
      if (appState === 'ready') {
        // App is ready, show appropriate screen based on auth
        return;
      }
    }
  }, [isAuthenticated, authLoading]);

  const initializeApp = async () => {
    try {
      // Check if user has completed onboarding
      const hasCompletedOnboarding = await AsyncStorage.getItem('hasCompletedOnboarding');
      setShowOnboarding(hasCompletedOnboarding !== 'true');
      
      // Start with splash screen
      setAppState('splash');
    } catch (error) {
      console.error('Error initializing app:', error);
      setShowOnboarding(true);
      setAppState('splash');
    }
  };

  const handleSplashComplete = () => {
    if (showOnboarding) {
      setAppState('onboarding');
    } else {
      setAppState('ready');
    }
  };

  const handleOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
      setAppState('ready');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
      setAppState('ready');
    }
  };

  const handleAuthSuccess = () => {
    // This will be handled by the auth state change
  };

  // Show loading if we haven't initialized yet
  if (appState === 'loading') {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash">
          {() => <SplashScreen onComplete={() => {}} />}
        </Stack.Screen>
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {appState === 'splash' ? (
        <Stack.Screen name="Splash">
          {() => <SplashScreen onComplete={handleSplashComplete} />}
        </Stack.Screen>
      ) : appState === 'onboarding' ? (
        <Stack.Screen name="Onboarding">
          {() => <OnboardingScreen onComplete={handleOnboardingComplete} />}
        </Stack.Screen>
      ) : appState === 'ready' ? (
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