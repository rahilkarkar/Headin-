import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext-firebase';
import { firestoreService } from '../../services/firestoreService';

export default function SocialScreen() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [followingList, setFollowingList] = useState(new Set());
  const [followingUsers, setFollowingUsers] = useState(new Map()); // Track follow states per user

  useEffect(() => {
    loadUsers();
    loadCurrentUserFollowing();
  }, [currentUser]);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery]);

  const loadUsers = async () => {
    try {
      // Get all users from Firestore
      const usersResult = await firestoreService.getUsers();
      if (usersResult.success) {
        // Filter out the current user
        const otherUsers = usersResult.data.filter(user => user.uid !== currentUser?.uid);
        setUsers(otherUsers);
        console.log(`Loaded ${otherUsers.length} users`);
      } else {
        console.error('Failed to load users:', usersResult.error);
        Alert.alert('Error', 'Failed to load users');
      }
    } catch (error) {
      console.error('Error loading users:', error);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadCurrentUserFollowing = async () => {
    if (!currentUser?.uid) return;
    
    try {
      const userResult = await firestoreService.getUser(currentUser.uid);
      if (userResult.success) {
        const following = userResult.data.following || [];
        setFollowingList(new Set(following));
        console.log('Current user following:', following.length, 'users');
      }
    } catch (error) {
      console.error('Error loading following list:', error);
    }
  };

  const filterUsers = () => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user => 
        user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadUsers();
    loadCurrentUserFollowing();
  }, [currentUser]);

  const handleFollowToggle = async (targetUser) => {
    if (!currentUser?.uid) {
      Alert.alert('Error', 'Please log in to follow users');
      return;
    }

    // Set loading state for this specific user
    setFollowingUsers(prev => new Map(prev.set(targetUser.uid, true)));
    
    const wasFollowing = followingList.has(targetUser.uid);

    try {
      const result = await firestoreService.followUser(currentUser.uid, targetUser.uid);
      
      if (result.success) {
        // Update local following list
        const newFollowingList = new Set(followingList);
        if (result.isFollowing) {
          newFollowingList.add(targetUser.uid);
        } else {
          newFollowingList.delete(targetUser.uid);
        }
        setFollowingList(newFollowingList);

        // Update the user's follower count in the local list
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.uid === targetUser.uid 
              ? {
                  ...user,
                  stats: {
                    ...user.stats,
                    followersCount: result.isFollowing
                      ? (user.stats?.followersCount || 0) + 1
                      : Math.max(0, (user.stats?.followersCount || 0) - 1)
                  }
                }
              : user
          )
        );

        // Show success feedback
        const action = result.isFollowing ? 'following' : 'unfollowed';
        console.log(`Successfully ${action} ${targetUser.displayName}`);
      } else {
        Alert.alert('Error', result.error || 'Failed to update follow status');
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      Alert.alert('Error', 'Failed to update follow status');
    } finally {
      // Remove loading state for this user
      setFollowingUsers(prev => {
        const newMap = new Map(prev);
        newMap.delete(targetUser.uid);
        return newMap;
      });
    }
  };

  const renderUser = ({ item: user }) => {
    const isFollowing = followingList.has(user.uid);
    const isLoading = followingUsers.has(user.uid);
    
    return (
      <View style={styles.userItem}>
        <TouchableOpacity style={styles.userInfo} activeOpacity={0.7}>
          <View style={styles.avatarContainer}>
            {user.profilePicture ? (
              <Image source={{ uri: user.profilePicture }} style={styles.avatar} />
            ) : (
              <Ionicons name="person" size={24} color={theme.colors.primary} />
            )}
          </View>
          
          <View style={styles.userDetails}>
            <Text style={styles.displayName}>{user.displayName || 'User'}</Text>
            <Text style={styles.email}>{user.email}</Text>
            <View style={styles.userStats}>
              <Text style={styles.statText}>
                {user.stats?.followersCount || 0} followers • {user.stats?.eventsCount || 0} events
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.followButton,
            isFollowing && styles.followingButton
          ]}
          onPress={() => handleFollowToggle(user)}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator 
              size="small" 
              color={isFollowing ? theme.colors.background : theme.colors.primary} 
            />
          ) : (
            <>
              <Ionicons
                name={isFollowing ? "person-remove" : "person-add"}
                size={16}
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
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people-outline" size={64} color={theme.colors.textMuted} />
      <Text style={styles.emptyTitle}>
        {searchQuery ? 'No users found' : 'No users available'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery 
          ? 'Try searching with a different name or email'
          : 'Users will appear here when they join the app'
        }
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.titleSection}>
        <Text style={styles.title}>Discover People</Text>
        <Text style={styles.subtitle}>Find and follow other users</Text>
      </View>
      
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={theme.colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or email..."
          placeholderTextColor={theme.colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color={theme.colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.statsSection}>
        <Text style={styles.statsText}>
          {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} • Following {followingList.size}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading users...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.uid}
        renderItem={renderUser}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
        contentContainerStyle={filteredUsers.length === 0 ? styles.emptyListContent : styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
  listContent: {
    paddingBottom: theme.spacing.xl,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  header: {
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    marginBottom: theme.spacing.md,
  },
  titleSection: {
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
    textShadowColor: theme.colors.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  searchIcon: {
    marginRight: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text,
  },
  clearButton: {
    padding: theme.spacing.xs,
  },
  statsSection: {
    alignItems: 'center',
  },
  statsText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  userDetails: {
    flex: 1,
  },
  displayName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  email: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  userStats: {
    marginTop: theme.spacing.xs,
  },
  statText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.primary,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.xs,
    minWidth: 90,
  },
  followingButton: {
    backgroundColor: theme.colors.primary,
  },
  followButtonText: {
    color: theme.colors.primary,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  followingButtonText: {
    color: theme.colors.background,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  emptySubtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.base,
  },
});