import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext-firebase';
import { profileService } from '../../services/profileService';
import { firestoreService } from '../../services/firestoreService';

export default function ProfileScreen() {
  const { user, userDocument, signOut } = useAuth();
  const navigation = useNavigation();
  const [profilePicture, setProfilePicture] = useState(userDocument?.profilePicture || null);
  const [eventsLikedCount, setEventsLikedCount] = useState(0);
  const [eventsPostedCount, setEventsPostedCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loadingStats, setLoadingStats] = useState(true);

  // Load user stats on component mount and when user changes
  useEffect(() => {
    loadUserStats();
  }, [user]);

  // Refresh stats periodically to catch likes from other screens
  useEffect(() => {
    const interval = setInterval(() => {
      if (user?.uid) {
        loadUserStats();
      }
    }, 3000); // Refresh every 3 seconds when on profile screen
    
    return () => clearInterval(interval);
  }, [user]);

  // Update profile picture when userDocument changes
  useEffect(() => {
    if (userDocument?.profilePicture) {
      setProfilePicture(userDocument.profilePicture);
    }
  }, [userDocument]);

  const loadUserStats = async () => {
    if (!user?.uid) {
      setLoadingStats(false);
      return;
    }

    try {
      console.log('Loading user stats for:', user.uid);
      
      // Load liked, posted events counts and user document for follow stats
      const [likedResult, postedResult, userResult] = await Promise.all([
        profileService.getUserLikedEventsCount(user.uid),
        profileService.getUserPostedEventsCount(user.uid),
        firestoreService.getUser(user.uid)
      ]);
      
      if (likedResult.success) {
        console.log('Liked events count:', likedResult.count);
        setEventsLikedCount(likedResult.count);
      } else {
        console.error('Failed to load liked events count:', likedResult.error);
      }
      
      if (postedResult.success) {
        console.log('Posted events count:', postedResult.count);
        setEventsPostedCount(postedResult.count);
      } else {
        console.error('Failed to load posted events count:', postedResult.error);
      }
      
      if (userResult.success) {
        const userData = userResult.data;
        setFollowersCount(userData.stats?.followersCount || 0);
        setFollowingCount(userData.stats?.followingCount || 0);
        console.log('Follow stats - Followers:', userData.stats?.followersCount, 'Following:', userData.stats?.followingCount);
      } else {
        console.error('Failed to load user document:', userResult.error);
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleProfilePicturePress = () => {
    Alert.alert(
      'Update Profile Picture',
      'Choose an option to update your profile picture',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Take Photo', 
          onPress: () => handleTakePhoto()
        },
        { 
          text: 'Choose from Gallery', 
          onPress: () => handleChooseFromGallery()
        }
      ]
    );
  };

  const handleTakePhoto = async () => {
    if (!user?.uid) return;

    setUploadingImage(true);
    try {
      const result = await profileService.takeProfilePhoto();
      if (result.success) {
        console.log('Camera result:', { hasUri: !!result.imageUri, hasBase64: !!result.base64 });
        
        const uploadResult = await profileService.updateProfilePicture(
          user.uid,
          result.imageUri,
          profilePicture,
          result.base64 // Pass base64 data
        );
        
        if (uploadResult.success) {
          setProfilePicture(uploadResult.downloadURL);
          Alert.alert('Success', 'Profile picture updated successfully!');
        } else {
          Alert.alert('Error', uploadResult.error || 'Failed to update profile picture');
        }
      } else if (result.error !== 'Photo capture was canceled') {
        Alert.alert('Error', result.error || 'Failed to take photo');
      }
    } catch (error) {
      console.error('Camera upload error:', error);
      Alert.alert('Error', 'Failed to update profile picture');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleChooseFromGallery = async () => {
    if (!user?.uid) return;

    setUploadingImage(true);
    try {
      const result = await profileService.pickProfileImage();
      if (result.success) {
        console.log('Gallery result:', { hasUri: !!result.imageUri, hasBase64: !!result.base64 });
        
        const uploadResult = await profileService.updateProfilePicture(
          user.uid,
          result.imageUri,
          profilePicture,
          result.base64 // Pass base64 data
        );
        
        if (uploadResult.success) {
          setProfilePicture(uploadResult.downloadURL);
          Alert.alert('Success', 'Profile picture updated successfully!');
        } else {
          Alert.alert('Error', uploadResult.error || 'Failed to update profile picture');
        }
      } else if (result.error !== 'Image selection was canceled') {
        Alert.alert('Error', result.error || 'Failed to pick image');
      }
    } catch (error) {
      console.error('Gallery upload error:', error);
      Alert.alert('Error', 'Failed to update profile picture');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleViewFollowers = () => {
    if (!user?.uid) return;
    navigation.navigate('FollowList', {
      userId: user.uid,
      type: 'followers',
      title: 'Your Followers'
    });
  };

  const handleViewFollowing = () => {
    if (!user?.uid) return;
    navigation.navigate('FollowList', {
      userId: user.uid,
      type: 'following',
      title: 'Following'
    });
  };

  const handleViewSavedEvents = () => {
    if (!user?.uid) return;
    navigation.navigate('SavedEvents');
  };

  const handleViewNotifications = () => {
    if (!user?.uid) return;
    navigation.navigate('Notifications');
  };

  const handleEditProfile = () => {
    if (!user?.uid) return;
    navigation.navigate('EditProfile');
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out? You\'ll need to log back in to access your account.',
      [
        { 
          text: 'Cancel', 
          style: 'cancel',
          onPress: () => console.log('Sign out cancelled')
        },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: () => {
            console.log('User confirmed sign out');
            signOut();
          }
        }
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.profileInfo}>
        <TouchableOpacity 
          style={styles.avatarContainer} 
          onPress={handleProfilePicturePress}
          disabled={uploadingImage}
        >
          {uploadingImage ? (
            <ActivityIndicator size="large" color={theme.colors.primary} />
          ) : profilePicture ? (
            <Image source={{ uri: profilePicture }} style={styles.profileImage} />
          ) : (
            <Ionicons name="person" size={40} color={theme.colors.primary} />
          )}
          
          {/* Camera overlay icon */}
          <View style={styles.cameraOverlay}>
            <Ionicons name="camera" size={16} color={theme.colors.background} />
          </View>
        </TouchableOpacity>
        
        <Text style={styles.displayName}>
          {userDocument?.displayName || user?.displayName || 'User'}
        </Text>
        
        <Text style={styles.email}>
          {user?.email || 'Guest User'}
        </Text>
        
        {userDocument?.isGuest && (
          <View style={styles.guestBadge}>
            <Text style={styles.guestText}>Guest Account</Text>
          </View>
        )}

        {/* User Stats */}
        <View style={styles.statsContainer}>
          <TouchableOpacity style={styles.statItem} onPress={handleViewFollowers}>
            <Ionicons name="people" size={20} color={theme.colors.primary} />
            <Text style={styles.statNumber}>
              {loadingStats ? '...' : followersCount}
            </Text>
            <Text style={styles.statLabel}>Followers</Text>
          </TouchableOpacity>
          <View style={styles.statDivider} />
          <TouchableOpacity style={styles.statItem} onPress={handleViewFollowing}>
            <Ionicons name="person-add" size={20} color={theme.colors.primary} />
            <Text style={styles.statNumber}>
              {loadingStats ? '...' : followingCount}
            </Text>
            <Text style={styles.statLabel}>Following</Text>
          </TouchableOpacity>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="heart" size={20} color={theme.colors.primary} />
            <Text style={styles.statNumber}>
              {loadingStats ? '...' : eventsLikedCount}
            </Text>
            <Text style={styles.statLabel}>Liked</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="calendar" size={20} color={theme.colors.primary} />
            <Text style={styles.statNumber}>
              {loadingStats ? '...' : eventsPostedCount}
            </Text>
            <Text style={styles.statLabel}>Posted</Text>
          </View>
        </View>

        {/* Saved Events Button */}
        <TouchableOpacity style={styles.actionButton} onPress={handleViewSavedEvents}>
          <Ionicons name="bookmark" size={20} color={theme.colors.primary} />
          <Text style={styles.actionButtonText}>View Saved Events</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
        </TouchableOpacity>

        {/* Edit Profile Button */}
        <TouchableOpacity style={styles.actionButton} onPress={handleEditProfile}>
          <Ionicons name="create" size={20} color={theme.colors.primary} />
          <Text style={styles.actionButtonText}>Edit Profile</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
        </TouchableOpacity>

        {/* Notifications Button */}
        <TouchableOpacity style={styles.actionButton} onPress={handleViewNotifications}>
          <Ionicons name="notifications" size={20} color={theme.colors.primary} />
          <Text style={styles.actionButtonText}>Notifications</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Ionicons name="log-out-outline" size={20} color={theme.colors.error} />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
  },
  profileInfo: {
    alignItems: 'center',
    marginTop: theme.spacing['2xl'],
    marginBottom: theme.spacing['2xl'],
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
    position: 'relative',
  },
  profileImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.background,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.lg,
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
    marginHorizontal: theme.spacing.lg,
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
  guestBadge: {
    backgroundColor: theme.colors.warning,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  guestText: {
    color: theme.colors.background,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
  actionButtonText: {
    flex: 1,
    color: theme.colors.text,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.error,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.sm,
    marginTop: 'auto',
  },
  signOutText: {
    color: theme.colors.error,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
  },
});