import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

const { width, height } = Dimensions.get('window');

const onboardingSteps = [
  {
    id: 1,
    icon: 'location-outline',
    title: 'Discover Local Events',
    description: 'Find exciting events, gatherings, and hangouts happening right in your neighborhood.',
    color: theme.colors.primary,
  },
  {
    id: 2,
    icon: 'people-outline',
    title: 'Connect with Your Vibe',
    description: 'Meet like-minded people and join communities that share your interests and energy.',
    color: theme.colors.primaryDark,
  },
  {
    id: 3,
    icon: 'time-outline',
    title: 'Real-Time Updates',
    description: 'Stay in the loop with live updates on what\'s happening and where the crowd is heading.',
    color: theme.colors.warning,
  },
  {
    id: 4,
    icon: 'heart-outline',
    title: 'Never Miss Out',
    description: 'Say goodbye to FOMO. Know exactly where to go and what\'s worth your time.',
    color: theme.colors.accent,
  },
];

export default function OnboardingScreen({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentOnboarding = onboardingSteps[currentStep];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.stepContainer}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: currentOnboarding.color },
            ]}
          >
            <Ionicons
              name={currentOnboarding.icon}
              size={80}
              color="#FFFFFF"
            />
          </View>

          <Text style={styles.title}>{currentOnboarding.title}</Text>
          <Text style={styles.description}>
            {currentOnboarding.description}
          </Text>
        </View>

        <View style={styles.pagination}>
          {onboardingSteps.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    index === currentStep ? currentOnboarding.color : '#E5E7EB',
                  width: index === currentStep ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          onPress={handlePrevious}
          style={[
            styles.navButton,
            styles.previousButton,
            { opacity: currentStep === 0 ? 0.3 : 1 },
          ]}
          disabled={currentStep === 0}
        >
          <Ionicons name="chevron-back" size={24} color="#6B7280" />
          <Text style={styles.previousText}>Previous</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleNext}
          style={[
            styles.navButton,
            styles.nextButton,
            { backgroundColor: currentOnboarding.color },
          ]}
        >
          <Text style={styles.nextText}>
            {currentStep === onboardingSteps.length - 1 ? "Get Started" : "Next"}
          </Text>
          <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  skipButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surface,
  },
  skipText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  stepContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xl,
    borderWidth: 3,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    ...theme.shadows.lg,
  },
  title: {
    fontSize: theme.typography.fontSize['3xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
    textShadowColor: theme.colors.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  description: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.base,
    maxWidth: width * 0.85,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: 40,
  },
  dot: {
    height: 10,
    borderRadius: theme.borderRadius.full,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
  },
  previousButton: {
    backgroundColor: theme.colors.surface,
    flex: 1,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  previousText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  nextButton: {
    flex: 1,
    justifyContent: 'center',
    ...theme.shadows.md,
  },
  nextText: {
    color: theme.colors.background,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
  },
});