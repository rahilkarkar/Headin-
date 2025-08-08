import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { theme } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext-firebase';
import { firestoreService } from '../../services/firestoreService';

export default function FollowListScreen() {
  const { user: currentUser } = useAuth();
  const route = useRoute();
  const navigation = useNavigation();
  const { userId, type, title } = route.params; // type: 'followers' or 'following'

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: title || (type === 'followers' ? 'Followers' : 'Following') });
    loadUsers();
  }, [userId, type]);

  const loadUsers = async () => {
    try {
      let result;
      if (type === 'followers') {
        result = await firestoreService.getFollowers(userId);
      } else {
        result = await firestoreService.getFollowing(userId);
      }

      if (result.success) {
        setUsers(result.data);
      } else {
        console.error('Failed to load users:', result.error);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadUsers();
  };

  const handleUserPress = (user) => {
    if (user.uid === currentUser?.uid) {
      // Navigate to own profile (would need to add to navigation)
      navigation.navigate('Profile');
    } else {
      // Navigate to other user's profile
      navigation.navigate('UserProfile', { userId: user.uid });
    }
  };

  const renderUser = ({ item: user }) => (
    <TouchableOpacity style={styles.userItem} onPress={() => handleUserPress(user)}>
      <View style={styles.avatarContainer}>
        {user.profilePicture ? (
          <Image source={{ uri: user.profilePicture }} style={styles.avatar} />
        ) : (
          <Ionicons name="person" size={24} color={theme.colors.primary} />
        )}
      </View>
      
      <View style={styles.userInfo}>
        <Text style={styles.displayName}>{user.displayName || 'User'}</Text>
        <Text style={styles.email}>{user.email}</Text>
        {user.stats && (
          <View style={styles.userStats}>
            <Text style={styles.statText}>
              {user.stats.followersCount || 0} followers • {user.stats.eventsCount || 0} events
            </Text>
          </View>
        )}
      </View>

      <View style={styles.chevron}>
        <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons 
        name={type === 'followers' ? "people-outline" : "person-add-outline"} 
        size={64} 
        color={theme.colors.textMuted} 
      />
      <Text style={styles.emptyTitle}>
        {type === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {type === 'followers' 
          ? 'When people follow this user, they\'ll appear here'
          : 'When this user follows others, they\'ll appear here'
        }
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading {type}...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={users}
        keyExtractor={(item) => item.uid}
        renderItem={renderUser}
        ListEmptyComponent={renderEmpty}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        contentContainerStyle={users.length === 0 ? styles.emptyListContent : styles.listContent}
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
    padding: theme.spacing.md,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
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
  userInfo: {
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
  chevron: {
    marginLeft: theme.spacing.sm,
  },
  emptyContainer: {
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