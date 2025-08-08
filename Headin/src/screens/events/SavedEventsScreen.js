import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../constants/theme';
import EventCard from '../../components/EventCard';
import { useAuth } from '../../contexts/AuthContext-firebase';
import { firestoreService } from '../../services/firestoreService';

export default function SavedEventsScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [savedEvents, setSavedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [likedEvents, setLikedEvents] = useState(new Set());
  const [savedEventIds, setSavedEventIds] = useState(new Set());

  useEffect(() => {
    loadSavedEvents();
    loadUserLikedEvents();
  }, [user]);

  const loadSavedEvents = async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    try {
      console.log('Loading saved events for user:', user.uid);
      const result = await firestoreService.getSavedEvents(user.uid);
      
      if (result.success) {
        // Convert Firestore Timestamps to JavaScript Dates
        const processedEvents = result.data.map(event => ({
          ...event,
          startTime: event.startTime?.toDate ? event.startTime.toDate() : new Date(event.startTime),
          endTime: event.endTime?.toDate ? event.endTime.toDate() : new Date(event.endTime),
          createdAt: event.createdAt?.toDate ? event.createdAt.toDate() : new Date(event.createdAt),
          updatedAt: event.updatedAt?.toDate ? event.updatedAt.toDate() : new Date(event.updatedAt),
        }));
        
        setSavedEvents(processedEvents);
        setSavedEventIds(new Set(processedEvents.map(event => event.id)));
        console.log(`Loaded ${processedEvents.length} saved events`);
      } else {
        console.error('Failed to load saved events:', result.error);
        setSavedEvents([]);
      }
    } catch (error) {
      console.error('Error loading saved events:', error);
      setSavedEvents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadUserLikedEvents = useCallback(async () => {
    if (!user?.uid) return;

    try {
      const userResult = await firestoreService.getUser(user.uid);
      if (userResult.success && userResult.data.eventsLiked) {
        setLikedEvents(new Set(userResult.data.eventsLiked));
      }
    } catch (error) {
      console.error('Error loading user liked events:', error);
    }
  }, [user]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadSavedEvents();
    loadUserLikedEvents();
  }, [user]);

  const handleLike = useCallback(async (eventId) => {
    if (!user?.uid) return;

    const newLikedEvents = new Set(likedEvents);
    const wasLiked = newLikedEvents.has(eventId);
    
    if (wasLiked) {
      newLikedEvents.delete(eventId);
    } else {
      newLikedEvents.add(eventId);
    }
    setLikedEvents(newLikedEvents);

    // Update the event stats locally
    setSavedEvents(prevEvents => 
      prevEvents.map(event => {
        if (event.id === eventId) {
          const isNowLiked = newLikedEvents.has(eventId);
          return {
            ...event,
            stats: {
              ...event.stats,
              likesCount: isNowLiked 
                ? event.stats.likesCount + 1 
                : Math.max(0, event.stats.likesCount - 1)
            }
          };
        }
        return event;
      })
    );

    // Sync with backend
    try {
      const isDummyEvent = /^[1-5]$/.test(eventId);
      
      if (isDummyEvent) {
        // Handle dummy events
        const userResult = await firestoreService.getUser(user.uid);
        if (userResult.success) {
          const currentLikedEvents = userResult.data.eventsLiked || [];
          let updatedLikedEvents;
          
          if (wasLiked) {
            updatedLikedEvents = currentLikedEvents.filter(id => id !== eventId);
          } else {
            updatedLikedEvents = [...currentLikedEvents, eventId];
          }
          
          await firestoreService.updateUser(user.uid, {
            eventsLiked: updatedLikedEvents
          });
        }
      } else {
        // Handle real events
        const result = await firestoreService.toggleEventLike(eventId, user.uid);
        if (!result.success) {
          // Revert on failure
          const revertedLikedEvents = new Set(likedEvents);
          if (wasLiked) {
            revertedLikedEvents.add(eventId);
          } else {
            revertedLikedEvents.delete(eventId);
          }
          setLikedEvents(revertedLikedEvents);
          
          setSavedEvents(prevEvents => 
            prevEvents.map(event => {
              if (event.id === eventId) {
                return {
                  ...event,
                  stats: {
                    ...event.stats,
                    likesCount: wasLiked 
                      ? event.stats.likesCount + 1 
                      : Math.max(0, event.stats.likesCount - 1)
                  }
                };
              }
              return event;
            })
          );
        }
      }
    } catch (error) {
      console.error('Error syncing like:', error);
    }
  }, [likedEvents, user]);

  const handleSave = useCallback(async (eventId) => {
    if (!user?.uid) return;

    // Find the event to get its title for the confirmation
    const eventToRemove = savedEvents.find(event => event.id === eventId);
    const eventTitle = eventToRemove?.title || 'this event';

    // Show confirmation modal for removing saved event
    Alert.alert(
      'Remove from Saved?',
      `Are you sure you want to remove "${eventTitle}" from your saved events?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => console.log('User cancelled removing saved event')
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            console.log('User confirmed removing saved event');
            
            // Remove from saved events immediately (optimistic update)
            setSavedEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));
            setSavedEventIds(prevIds => {
              const newIds = new Set(prevIds);
              newIds.delete(eventId);
              return newIds;
            });

            try {
              const result = await firestoreService.toggleEventSave(eventId, user.uid);
              if (!result.success) {
                // Revert on failure - reload saved events
                console.error('Failed to remove saved event:', result.error);
                loadSavedEvents();
                Alert.alert('Error', 'Failed to remove event from saved list. Please try again.');
              }
            } catch (error) {
              console.error('Error unsaving event:', error);
              // Revert on error - reload saved events
              loadSavedEvents();
              Alert.alert('Error', 'Something went wrong. Please check your connection and try again.');
            }
          }
        }
      ],
      { cancelable: true }
    );
  }, [user, savedEvents, loadSavedEvents]);

  const handleEventPress = useCallback((event) => {
    console.log('Event pressed:', event.title);
    // TODO: Navigate to event detail screen
  }, []);

  const handleComment = useCallback((event) => {
    navigation.navigate('Comments', {
      eventId: event.id,
      eventTitle: event.title
    });
  }, [navigation]);

  const keyExtractor = useCallback((item) => item.id, []);

  const renderEvent = useCallback(({ item }) => (
    <EventCard
      event={item}
      onPress={() => handleEventPress(item)}
      onLike={handleLike}
      onSave={handleSave}
      onComment={handleComment}
      isLiked={likedEvents.has(item.id)}
      isSaved={savedEventIds.has(item.id)}
    />
  ), [likedEvents, savedEventIds, handleEventPress, handleLike, handleSave, handleComment]);

  const renderHeader = useCallback(() => (
    <View style={styles.header}>
      <View style={styles.titleSection}>
        <Text style={styles.title}>Saved Events</Text>
        <Text style={styles.subtitle}>
          Events you've bookmarked for later
        </Text>
      </View>
      
      <View style={styles.eventCountBadge}>
        <Text style={styles.eventCountText}>
          {savedEvents.length}
        </Text>
      </View>
    </View>
  ), [savedEvents.length]);

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="bookmark-outline" size={64} color={theme.colors.textMuted} />
      <Text style={styles.emptyTitle}>No saved events</Text>
      <Text style={styles.emptySubtitle}>
        Events you bookmark will appear here for easy access
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading saved events...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={savedEvents}
        keyExtractor={keyExtractor}
        renderItem={renderEvent}
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
        contentContainerStyle={savedEvents.length === 0 ? styles.emptyListContent : styles.listContent}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    marginBottom: theme.spacing.md,
  },
  titleSection: {
    flex: 1,
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
  eventCountBadge: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventCountText: {
    color: theme.colors.background,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.bold,
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