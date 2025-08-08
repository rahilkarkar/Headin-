import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity,
  Dimensions 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../constants/theme';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const navigation = useNavigation();

  const handleNearbyEvents = () => {
    navigation.navigate('Map'); // Navigate to Map tab to see nearby events
  };

  const handleFriendsActivity = () => {
    navigation.navigate('Social'); // Navigate to Social tab to see friends
  };

  const handleViewSplash = () => {
    navigation.navigate('TestSplash'); // Navigate to a test splash screen
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>Welcome to Headin'! 🎉</Text>
            <Text style={styles.heroSubtitle}>Where the vibe takes you</Text>
            <View style={styles.goldAccent} />
          </View>
        </View>

        {/* About Section */}
        <View style={styles.aboutSection}>
          <View style={styles.aboutCard}>
            <View style={styles.aboutHeader}>
              <Ionicons name="sparkles" size={24} color={theme.colors.primary} />
              <Text style={styles.aboutTitle}>What is Headin'?</Text>
            </View>
            <Text style={styles.aboutText}>
              Headin' is your ultimate companion for discovering the <Text style={styles.highlightText}>coolest events</Text> happening around you! Whether you're looking for live music, food festivals, art galleries, or just a fun night out, we've got you covered.
            </Text>
            <Text style={styles.aboutText}>
              🎵 <Text style={styles.featureText}>Discover</Text> events by category, time, or location{"\n"}
              👥 <Text style={styles.featureText}>Connect</Text> with friends and see what they're up to{"\n"}
              💾 <Text style={styles.featureText}>Save</Text> events you don't want to miss{"\n"}
              💬 <Text style={styles.featureText}>Comment</Text> and share your excitement{"\n"}
              🗺️ <Text style={styles.featureText}>Explore</Text> your city like never before
            </Text>
            <View style={styles.motivationalQuote}>
              <Text style={styles.quoteText}>
                "Life's too short for boring weekends. Let's find your next adventure!"
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.contentSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <View style={styles.buttonsContainer}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleNearbyEvents}
              activeOpacity={0.8}
            >
              <View style={styles.iconWrapper}>
                <Ionicons name="map" size={24} color={theme.colors.background} />
              </View>
              <View style={styles.buttonContent}>
                <Text style={styles.buttonText}>Explore Nearby Events</Text>
                <Text style={styles.buttonSubtext}>Find what's happening around you</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.background} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButtonSecondary}
              onPress={handleFriendsActivity}
              activeOpacity={0.8}
            >
              <View style={styles.iconWrapperSecondary}>
                <Ionicons name="people" size={24} color={theme.colors.primary} />
              </View>
              <View style={styles.buttonContent}>
                <Text style={styles.buttonTextSecondary}>Connect with Friends</Text>
                <Text style={styles.buttonSubtextSecondary}>See what your crew is up to</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
            
            {/* Debug button to test splash animation */}
            {__DEV__ && (
              <TouchableOpacity 
                style={styles.debugButton}
                onPress={handleViewSplash}
                activeOpacity={0.8}
              >
                <View style={styles.iconWrapperDebug}>
                  <Ionicons name="play" size={20} color={theme.colors.text} />
                </View>
                <View style={styles.buttonContent}>
                  <Text style={styles.debugButtonText}>Test Splash Animation</Text>
                  <Text style={styles.debugButtonSubtext}>See the startup animation</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.text} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  heroSection: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  heroContent: {
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: theme.typography.fontSize['3xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
    textShadowColor: theme.colors.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  heroSubtitle: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  goldAccent: {
    width: 80,
    height: 3,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  contentSection: {
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  buttonsContainer: {
    gap: theme.spacing.md,
  },
  actionButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.md,
    ...theme.shadows.md,
  },
  actionButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.md,
  },
  iconWrapper: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm,
  },
  iconWrapperSecondary: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm,
  },
  buttonText: {
    color: theme.colors.background,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    flex: 1,
  },
  buttonTextSecondary: {
    color: theme.colors.primary,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  
  // About section styles
  aboutSection: {
    padding: theme.spacing.lg,
  },
  
  aboutCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  
  aboutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  
  aboutTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
  },
  
  aboutText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
    lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.base,
    marginBottom: theme.spacing.md,
  },
  
  highlightText: {
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  
  featureText: {
    color: theme.colors.text,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  
  motivationalQuote: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.sm,
    marginTop: theme.spacing.md,
  },
  
  quoteText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.base,
  },
  
  // Enhanced button styles
  buttonContent: {
    flex: 1,
  },
  
  buttonSubtext: {
    color: 'rgba(0, 0, 0, 0.7)',
    fontSize: theme.typography.fontSize.sm,
    marginTop: 2,
  },
  
  buttonSubtextSecondary: {
    color: 'rgba(255, 215, 0, 0.8)',
    fontSize: theme.typography.fontSize.sm,
    marginTop: 2,
  },
  
  // Debug button styles
  debugButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  
  iconWrapperDebug: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: theme.borderRadius.sm,
    padding: theme.spacing.sm,
  },
  
  debugButtonText: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  
  debugButtonSubtext: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.fontSize.xs,
    marginTop: 2,
  },
});