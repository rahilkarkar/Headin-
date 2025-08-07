import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = 'hasCompletedOnboarding';

export const OnboardingStorage = {
  async hasCompletedOnboarding() {
    try {
      const value = await AsyncStorage.getItem(ONBOARDING_KEY);
      return value === 'true';
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      return false;
    }
  },

  async setOnboardingCompleted(completed = true) {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, completed.toString());
      return true;
    } catch (error) {
      console.error('Error saving onboarding status:', error);
      return false;
    }
  },

  async clearOnboardingStatus() {
    try {
      await AsyncStorage.removeItem(ONBOARDING_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing onboarding status:', error);
      return false;
    }
  },
};