import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import SplashScreen from './src/screens/auth/SplashScreen';
import OnboardingScreen from './src/screens/auth/OnboardingScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import SignupScreen from './src/screens/auth/SignupScreen';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider, useAuth } from './src/contexts/AuthContext-firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Navigation component that listens to auth state
function AppContent() {
  const { isAuthenticated } = useAuth();
  const [currentScreen, setCurrentScreen] = useState('splash');
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  // Listen to auth state changes
  useEffect(() => {
    if (!isAuthenticated && (currentScreen === 'main')) {
      // User logged out, go back to login
      setCurrentScreen('login');
    } else if (isAuthenticated && (currentScreen === 'login' || currentScreen === 'signup')) {
      // User logged in, go to main app
      setCurrentScreen('main');
    }
  }, [isAuthenticated, currentScreen]);

  const checkOnboardingStatus = async () => {
    try {
      const completed = await AsyncStorage.getItem('hasCompletedOnboarding');
      setHasCompletedOnboarding(completed === 'true');
    } catch (error) {
      console.error('Error checking onboarding:', error);
    }
  };

  const handleSplashComplete = () => {
    if (hasCompletedOnboarding) {
      setCurrentScreen('login');
    } else {
      setCurrentScreen('onboarding');
    }
  };

  const handleOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
      setHasCompletedOnboarding(true);
      setCurrentScreen('login');
    } catch (error) {
      console.error('Error saving onboarding:', error);
      setCurrentScreen('login');
    }
  };

  const handleAuthSuccess = () => {
    setCurrentScreen('main');
  };

  const handleGoToSignup = () => {
    setCurrentScreen('signup');
  };

  const handleBackToLogin = () => {
    setCurrentScreen('login');
  };

  return (
    <NavigationContainer>
      {currentScreen === 'splash' ? (
        <SplashScreen onComplete={handleSplashComplete} />
      ) : currentScreen === 'onboarding' ? (
        <OnboardingScreen onComplete={handleOnboardingComplete} />
      ) : currentScreen === 'login' ? (
        <LoginScreen 
          navigation={{ navigate: () => handleGoToSignup() }} 
          onAuthSuccess={handleAuthSuccess} 
        />
      ) : currentScreen === 'signup' ? (
        <SignupScreen 
          navigation={{ navigate: () => handleBackToLogin() }} 
          onAuthSuccess={handleAuthSuccess} 
        />
      ) : currentScreen === 'main' ? (
        <AppNavigator />
      ) : null}
      <StatusBar style="light" backgroundColor="#000000" />
    </NavigationContainer>
  );
}

// Main App component
export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </SafeAreaProvider>
  );
}