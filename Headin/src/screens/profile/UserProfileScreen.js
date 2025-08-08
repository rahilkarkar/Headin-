import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { theme } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext-firebase';
import { firestoreService } from '../../services/firestoreService';

export default function UserProfileScreen() {
  const { user: currentUser } = useAuth();
  const route = useRoute();
  const navigation = useNavigation();
  const { userId } = route.params;

  const [userProfile, setUserProfile] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [userEvents, setUserEvents] = useState([]);

  useEffect(() => {
    loadUserProfile();
    loadUserEvents();
  }, [userId]);

  useEffect(() => {
    checkFollowStatus();
  }, [userProfile, currentUser]);

  const loadUserProfile = async () => {
    try {
      const result = await firestoreService.getUser(userId);
      if (result.success) {
        setUserProfile(result.data);
        
        // Set navigation title to user's name
        navigation.setOptions({
          title: result.data.displayName || 'User Profile'
        });
      } else {
        Alert.alert('Error', 'Could not load user profile');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      Alert.alert('Error', 'Could not load user profile');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const loadUserEvents = async () => {
    try {
      const result = await firestoreService.getEvents({
        authorId: userId,
        limit: 10
      });
      
      if (result.success) {
        setUserEvents(result.data);
      }
    } catch (error) {
      console.error('Error loading user events:', error);
    }
  };

  const checkFollowStatus = async () => {
    if (!currentUser?.uid || !userProfile) return;
    
    try {
      const result = await firestoreService.getUser(currentUser.uid);
      if (result.success) {
        const following = result.data.following || [];
        setIsFollowing(following.includes(userId));
      }
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const handleFollowToggle = async () => {
    if (!currentUser?.uid) {
      Alert.alert('Error', 'Please log in to follow users');
      return;
    }

    if (currentUser.uid === userId) {
      Alert.alert('Error', 'You cannot follow yourself');
      return;
    }

    setFollowLoading(true);
    try {
      const result = await firestoreService.followUser(currentUser.uid, userId);
      if (result.success) {
        setIsFollowing(result.isFollowing);
        
        // Update local user profile stats
        setUserProfile(prev => ({
          ...prev,
          stats: {
            ...prev.stats,
            followersCount: result.isFollowing
              ? (prev.stats?.followersCount || 0) + 1
              : Math.max(0, (prev.stats?.followersCount || 0) - 1)
          }
        }));

        Alert.alert(
          'Success',
          result.isFollowing 
            ? `You are now following ${userProfile.displayName}`
            : `You unfollowed ${userProfile.displayName}`
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to update follow status');
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      Alert.alert('Error', 'Failed to update follow status');
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!userProfile) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="person-outline" size={64} color={theme.colors.textMuted} />
        <Text style={styles.errorText}>User not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          {userProfile.profilePicture ? (
            <Image source={{ uri: userProfile.profilePicture }} style={styles.profileImage} />
          ) : (
            <Ionicons name="person" size={40} color={theme.colors.primary} />
          )}
        </View>
        
        <Text style={styles.displayName}>
          {userProfile.displayName || 'User'}
        </Text>
        
        <Text style={styles.email}>
          {userProfile.email}
        </Text>

        {userProfile.bio && (
          <Text style={styles.bio}>
            {userProfile.bio}
          </Text>
        )}

        {/* User Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Ionicons name="people" size={20} color={theme.colors.primary} />
            <Text style={styles.statNumber}>
              {userProfile.stats?.followersCount || 0}
            </Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="person-add" size={20} color={theme.colors.primary} />
            <Text style={styles.statNumber}>
              {userProfile.stats?.followingCount || 0}
            </Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="calendar" size={20} color={theme.colors.primary} />
            <Text style={styles.statNumber}>
              {userProfile.stats?.eventsCount || 0}
            </Text>
            <Text style={styles.statLabel}>Events</Text>
          </View>
        </View>

        {/* Follow/Unfollow Button */}
        {currentUser?.uid !== userId && (
          <TouchableOpacity
            style={[
              styles.followButton,
              isFollowing && styles.followingButton
            ]}
            onPress={handleFollowToggle}
            disabled={followLoading}
          >
            {followLoading ? (
              <ActivityIndicator size="small" color={isFollowing ? theme.colors.background : theme.colors.primary} />
            ) : (
              <>
                <Ionicons
                  name={isFollowing ? "person-remove" : "person-add"}
                  size={20}
                  color={isFollowing ? theme.colors.background : theme.colors.primary}
                />
                <Text style={[
                  styles.followButtonText,
                  isFollowing && styles.followingButtonText
                ]}>
                  {isFollowing ? 'Unfollow' : 'Follow'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* User Events Section */}
      <View style={styles.eventsSection}>
        <Text style={styles.sectionTitle}>Recent Events</Text>
        {userEvents.length > 0 ? (
          userEvents.map((event) => (
            <View key={event.id} style={styles.eventItem}>
              <View style={styles.eventHeader}>
                <Text style={styles.eventTitle} numberOfLines={1}>
                  {event.title}
                </Text>
                <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(event.category) }]}>
                  <Text style={styles.categoryText}>
                    {event.category.charAt(0).toUpperCase() + event.category.slice(1)}
                  </Text>
                </View>
              </View>
              <Text style={styles.eventDescription} numberOfLines={2}>
                {event.description}
              </Text>
              <View style={styles.eventMeta}>
                <View style={styles.eventMetaItem}>
                  <Ionicons name="location-outline" size={16} color={theme.colors.primary} />
                  <Text style={styles.eventMetaText}>
                    {event.location?.name || 'Location TBD'}
                  </Text>
                </View>
                <View style={styles.eventStats}>
                  <Ionicons name="heart" size={14} color={theme.colors.primary} />
                  <Text style={styles.eventStatText}>{event.stats?.likesCount || 0}</Text>
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyEvents}>
            <Ionicons name="calendar-outline" size={32} color={theme.colors.textMuted} />
            <Text style={styles.emptyEventsText}>No events posted yet</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const getCategoryColor = (category) => {
  const colors = {
    music: '#9333EA',
    sports: '#059669', 
    food: '#DC2626',
    wellness: '#16A34A',
    art: '#7C2D12',
    party: '#BE185D',
    networking: '#1D4ED8',
    default: theme.colors.primary
  };
  return colors[category] || colors.default;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.xl,
  },
  errorText: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSize.lg,
    marginTop: theme.spacing.lg,
    textAlign: 'center',
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
    ...theme.shadows.md,
  },
  profileImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  displayName: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  email: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  bio: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    fontStyle: 'italic',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 60,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.md,
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
    minWidth: 120,
  },
  followingButton: {
    backgroundColor: theme.colors.primary,
  },
  followButtonText: {
    color: theme.colors.primary,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  followingButtonText: {
    color: theme.colors.background,
  },
  eventsSection: {
    marginTop: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
    textShadowColor: theme.colors.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  eventItem: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  eventTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  categoryBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  categoryText: {
    fontSize: theme.typography.fontSize.xs,
    fontWeight: theme.typography.fontWeight.medium,
    color: '#FFFFFF',
  },
  eventDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
    lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.sm,
  },
  eventMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    flex: 1,
  },
  eventMetaText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  eventStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  eventStatText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  emptyEvents: {
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyEventsText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.md,
  },
});