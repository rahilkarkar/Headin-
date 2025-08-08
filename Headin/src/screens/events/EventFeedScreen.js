/**
 * EventFeedScreen Component
 * 
 * This is the main screen that displays a feed of events to users.
 * It's the heart of the Headin' app experience where users discover events.
 * 
 * Key Features:
 * - Displays events in an infinite scrollable list using FlatList
 * - Pull-to-refresh functionality for getting latest events
 * - Optimistic UI updates for likes (immediate feedback)
 * - Empty state handling when no events are available
 * - Filter button for future event filtering functionality
 * - Responsive design that works across different screen sizes
 * 
 * Data Flow:
 * 1. Component mounts and loads initial events from dummy data
 * 2. Events are displayed in cards using EventCard component
 * 3. User interactions (likes, taps) trigger state updates
 * 4. Pull-to-refresh reloads event data
 * 
 * Future Enhancements:
 * - Replace dummy data with real Firestore integration
 * - Add infinite scrolling/pagination
 * - Implement event filtering and search
 * - Add real-time event updates
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useFocusEffect, useNavigation } from '@react-navigation/native';
import { theme } from '../../constants/theme';
import EventCard from '../../components/EventCard';
import { dummyEvents } from '../../data/dummyEvents';
import { useAuth } from '../../contexts/AuthContext-firebase';
import { firestoreService } from '../../services/firestoreService';

// Get device dimensions for responsive design
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Define responsive breakpoints
const RESPONSIVE_BREAKPOINTS = {
  small: 360,   // Small phones
  medium: 400,  // Regular phones  
  large: 500,   // Large phones/small tablets
  tablet: 768,  // Tablets
};

// Determine device category
const getDeviceSize = () => {
  if (screenWidth < RESPONSIVE_BREAKPOINTS.small) return 'xsmall';
  if (screenWidth < RESPONSIVE_BREAKPOINTS.medium) return 'small';
  if (screenWidth < RESPONSIVE_BREAKPOINTS.large) return 'medium';
  if (screenWidth < RESPONSIVE_BREAKPOINTS.tablet) return 'large';
  return 'tablet';
};

const DEVICE_SIZE = getDeviceSize();

// Define event categories for filtering
const EVENT_CATEGORIES = [
  { id: 'all', label: 'All', icon: 'grid', color: theme.colors.primary },
  { id: 'music', label: 'Music', icon: 'musical-notes', color: '#9333EA' },
  { id: 'sports', label: 'Sports', icon: 'basketball', color: '#059669' },
  { id: 'food', label: 'Food', icon: 'restaurant', color: '#DC2626' },
  { id: 'wellness', label: 'Wellness', icon: 'leaf', color: '#16A34A' },
  { id: 'art', label: 'Art', icon: 'color-palette', color: '#7C2D12' },
  { id: 'party', label: 'Party', icon: 'wine', color: '#BE185D' },
  { id: 'networking', label: 'Networking', icon: 'people', color: '#1D4ED8' }
];

// Define time-sensitive filters
const TIME_FILTERS = [
  { id: 'all_time', label: 'Any Time', icon: 'calendar', color: theme.colors.primary },
  { id: 'today', label: 'Today', icon: 'today', color: '#DC2626' },
  { id: 'tonight', label: 'Tonight', icon: 'moon', color: '#7C3AED' },
  { id: 'tomorrow', label: 'Tomorrow', icon: 'sunny', color: '#F59E0B' },
  { id: 'this_weekend', label: 'This Weekend', icon: 'calendar-outline', color: '#059669' },
  { id: 'next_week', label: 'Next Week', icon: 'time', color: '#3B82F6' },
  { id: 'this_month', label: 'This Month', icon: 'calendar-sharp', color: '#8B5CF6' }
];

export default function EventFeedScreen() {
  // Get current authenticated user for personalization
  const { user } = useAuth();
  const route = useRoute();
  const navigation = useNavigation();
  const flatListRef = useRef(null);
  
  // STATE MANAGEMENT
  // events: Array of event objects to display in the feed
  const [events, setEvents] = useState([]);
  
  // filteredEvents: Array of events after applying category filter
  const [filteredEvents, setFilteredEvents] = useState([]);
  
  // selectedCategory: Currently selected category filter ('all' for no filter)
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // selectedTimeFilter: Currently selected time filter ('all_time' for no filter)
  const [selectedTimeFilter, setSelectedTimeFilter] = useState('all_time');
  
  // highlightedEventId: Event ID to highlight when navigated from map
  const [highlightedEventId, setHighlightedEventId] = useState(null);
  
  // refreshing: Boolean to show/hide pull-to-refresh spinner
  const [refreshing, setRefreshing] = useState(false);
  
  // loading: Boolean to show/hide main loading indicator
  const [loading, setLoading] = useState(true);
  
  // error: Error state for handling API failures
  const [error, setError] = useState(null);
  
  // likedEvents: Set of event IDs that the current user has liked
  // Using Set for O(1) lookup performance when checking if event is liked
  const [likedEvents, setLikedEvents] = useState(new Set());
  
  // savedEvents: Set of event IDs that the current user has saved
  // Using Set for O(1) lookup performance when checking if event is saved
  const [savedEvents, setSavedEvents] = useState(new Set());

  // PERFORMANCE OPTIMIZATION: Stable keyExtractor function
  // This prevents FlatList from re-creating the function on every render
  const keyExtractor = useCallback((item) => item.id, []);

  // RESPONSIVE DESIGN: Calculate dynamic values based on screen size
  const responsiveValues = useMemo(() => {
    const isSmallDevice = DEVICE_SIZE === 'xsmall' || DEVICE_SIZE === 'small';
    const isTablet = DEVICE_SIZE === 'tablet';
    
    return {
      // Header sizing
      titleFontSize: isSmallDevice 
        ? theme.typography.fontSize.xl 
        : isTablet 
        ? theme.typography.fontSize['3xl']
        : theme.typography.fontSize['2xl'],
        
      subtitleFontSize: isSmallDevice 
        ? theme.typography.fontSize.sm
        : theme.typography.fontSize.base,
        
      // Layout padding
      headerPadding: isSmallDevice 
        ? theme.spacing.md 
        : theme.spacing.lg,
        
      // FlatList optimizations based on device
      initialNumToRender: isSmallDevice ? 3 : isTablet ? 8 : 5,
      maxToRenderPerBatch: isSmallDevice ? 2 : 3,
      windowSize: isSmallDevice ? 8 : 10,
      
      // Empty state sizing
      emptyIconSize: isSmallDevice ? 48 : isTablet ? 80 : 64,
    };
  }, []); // No dependencies - calculated once based on screen size

  // COMPONENT LIFECYCLE
  // Load events when component first mounts and load user's liked events
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      setError(null);
      try {
        await Promise.all([
          loadEvents(),
          loadUserLikedEvents(),
          loadUserSavedEvents()
        ]);
      } catch (err) {
        console.error('Error initializing EventFeedScreen:', err);
        setError('Failed to load events. Please check your connection and try again.');
      } finally {
        setLoading(false);
      }
    };
    
    initializeData();
  }, [user]);

  // Filter events when category, time selection, or events change
  useEffect(() => {
    filterEvents();
  }, [events, selectedCategory, selectedTimeFilter]);

  // Refresh events when screen comes back into focus (e.g., from Comments screen)
  useFocusEffect(
    useCallback(() => {
      // Only refresh if we're not in the initial loading state and have loaded events before
      if (!loading && events.length > 0) {
        console.log('EventFeedScreen focused - refreshing events to update comment counts');
        loadEvents().catch(console.error);
      }
    }, [loading, events.length, loadEvents])
  );

  // Handle navigation from Map screen
  useFocusEffect(
    useCallback(() => {
      if (route.params?.highlightEventId) {
        setHighlightedEventId(route.params.highlightEventId);
        
        // Clear highlight after 3 seconds
        setTimeout(() => {
          setHighlightedEventId(null);
        }, 3000);
      }
    }, [route.params?.highlightEventId])
  );

  // Separate effect for scrolling to highlighted event after data is loaded
  useFocusEffect(
    useCallback(() => {
      if (route.params?.highlightEventId && filteredEvents.length > 0) {
        // Scroll to the event after ensuring data is ready
        setTimeout(() => {
          const eventIndex = filteredEvents.findIndex(event => event.id === route.params.highlightEventId);
          
          if (eventIndex !== -1 && flatListRef.current) {
            console.log(`Found highlighted event at index ${eventIndex} of ${filteredEvents.length} events`);
            
            try {
              flatListRef.current.scrollToIndex({
                index: eventIndex,
                animated: true,
                viewOffset: 100, // Offset from top to account for header
              });
            } catch (error) {
              console.warn('Error scrolling to highlighted event:', error);
              // Fallback to scrolling to top if scrollToIndex fails
              flatListRef.current.scrollToOffset({ offset: 0, animated: true });
            }
          } else if (eventIndex === -1) {
            console.warn('Highlighted event not found in current filtered events:', {
              eventId: route.params.highlightEventId,
              filteredEventsLength: filteredEvents.length,
              totalEventsLength: events.length
            });
          }
        }, 500); // Shorter delay since we're waiting for data to be ready
      }
    }, [route.params?.highlightEventId, filteredEvents])
  );

  // Keep the original focus effect for the other functionality
  useFocusEffect(
    useCallback(() => {
    }, [route.params?.highlightEventId, events])
  );

  // Load user's liked events from Firestore
  const loadUserLikedEvents = useCallback(async () => {
    if (!user?.uid) {
      console.log('No user UID available for loading liked events');
      return;
    }

    try {
      console.log('Loading user liked events for UID:', user.uid);
      const userResult = await firestoreService.getUser(user.uid);
      
      if (userResult.success) {
        console.log('User document found:', userResult.data);
        if (userResult.data.eventsLiked) {
          console.log('Setting liked events:', userResult.data.eventsLiked);
          setLikedEvents(new Set(userResult.data.eventsLiked));
        } else {
          console.log('No eventsLiked array found in user document');
        }
      } else {
        console.log('User document not found, creating one...');
        // Create user document if it doesn't exist
        const createResult = await firestoreService.createUser(user.uid, {
          email: user.email,
          displayName: user.displayName || 'User',
          isGuest: false
        });
        if (createResult.success) {
          console.log('User document created successfully');
          setLikedEvents(new Set()); // Empty set for new user
        }
      }
    } catch (error) {
      console.error('Error loading user liked events:', error);
    }
  }, [user]);

  // Load user's saved events from Firestore
  const loadUserSavedEvents = useCallback(async () => {
    if (!user?.uid) {
      console.log('No user UID available for loading saved events');
      return;
    }

    try {
      console.log('Loading user saved events for UID:', user.uid);
      const userResult = await firestoreService.getUser(user.uid);
      
      if (userResult.success) {
        if (userResult.data.eventsSaved) {
          console.log('Setting saved events:', userResult.data.eventsSaved);
          setSavedEvents(new Set(userResult.data.eventsSaved));
        } else {
          console.log('No eventsSaved array found in user document');
        }
      } else {
        console.log('User document not found for saved events');
      }
    } catch (error) {
      console.error('Error loading user saved events:', error);
    }
  }, [user]);

  /**
   * Filters events by selected category and time filter
   * Updates the filteredEvents state with filtered results
   */
  const filterEvents = useCallback(() => {
    // Safety check: ensure events is an array
    if (!Array.isArray(events)) {
      console.warn('Events is not an array:', events);
      setFilteredEvents([]);
      return;
    }
    
    let filtered = [...events];
    
    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(event => event?.category === selectedCategory);
    }
    
    // Apply time filter
    if (selectedTimeFilter !== 'all_time') {
      const now = new Date();
      filtered = filtered.filter(event => {
        // Safety check: ensure event and startTime exist
        if (!event || !event.startTime) {
          console.warn('Event missing startTime:', event);
          return false;
        }
        
        const eventDate = event.startTime instanceof Date ? event.startTime : new Date(event.startTime);
        
        switch (selectedTimeFilter) {
          case 'today': {
            const today = new Date(now);
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);
            return eventDate >= today && eventDate < tomorrow;
          }
          case 'tonight': {
            const today = new Date(now);
            today.setHours(18, 0, 0, 0); // 6 PM today
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);
            tomorrow.setHours(6, 0, 0, 0); // 6 AM tomorrow
            return eventDate >= today && eventDate < tomorrow;
          }
          case 'tomorrow': {
            const tomorrow = new Date(now);
            tomorrow.setDate(now.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);
            const dayAfter = new Date(tomorrow);
            dayAfter.setDate(tomorrow.getDate() + 1);
            return eventDate >= tomorrow && eventDate < dayAfter;
          }
          case 'this_weekend': {
            const today = new Date(now);
            const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
            const daysUntilSaturday = dayOfWeek === 0 ? 6 : 6 - dayOfWeek;
            const saturday = new Date(today);
            saturday.setDate(today.getDate() + daysUntilSaturday);
            saturday.setHours(0, 0, 0, 0);
            const monday = new Date(saturday);
            monday.setDate(saturday.getDate() + 2);
            return eventDate >= saturday && eventDate < monday;
          }
          case 'next_week': {
            const today = new Date(now);
            const dayOfWeek = today.getDay();
            const daysUntilNextMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
            const nextMonday = new Date(today);
            nextMonday.setDate(today.getDate() + daysUntilNextMonday);
            nextMonday.setHours(0, 0, 0, 0);
            const followingMonday = new Date(nextMonday);
            followingMonday.setDate(nextMonday.getDate() + 7);
            return eventDate >= nextMonday && eventDate < followingMonday;
          }
          case 'this_month': {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            return eventDate >= startOfMonth && eventDate < startOfNextMonth;
          }
          default:
            return true;
        }
      });
    }
    
    setFilteredEvents(filtered);
  }, [events, selectedCategory, selectedTimeFilter]);

  /**
   * Handles category filter selection
   * Updates the selected category and triggers filtering
   */
  const handleCategorySelect = useCallback((categoryId) => {
    setSelectedCategory(categoryId);
  }, []);

  /**
   * Handles time filter selection
   * Updates the selected time filter and triggers filtering
   */
  const handleTimeFilterSelect = useCallback((timeFilterId) => {
    setSelectedTimeFilter(timeFilterId);
  }, []);

  /**
   * Loads events from data source
   * Now loads from both Firestore and dummy data for development
   */
  const loadEvents = useCallback(async () => {
    try {
      console.log('Loading events from Firestore...');
      
      // Load real events from Firestore
      const result = await firestoreService.getEvents({
        limit: 20
      });
      
      let realEvents = [];
      if (result.success && Array.isArray(result.data)) {
        console.log('Loaded real events:', result.data.length);
        // Convert Firestore Timestamps to JavaScript Dates for EventCard compatibility
        realEvents = result.data.map(event => {
          if (!event) {
            console.warn('Null event found in data');
            return null;
          }
          return {
            ...event,
            startTime: event.startTime?.toDate ? event.startTime.toDate() : new Date(event.startTime || new Date()),
            endTime: event.endTime?.toDate ? event.endTime.toDate() : new Date(event.endTime || new Date()),
            createdAt: event.createdAt?.toDate ? event.createdAt.toDate() : new Date(event.createdAt || new Date()),
            updatedAt: event.updatedAt?.toDate ? event.updatedAt.toDate() : new Date(event.updatedAt || new Date()),
            // Ensure stats object exists
            stats: event.stats || { likesCount: 0, commentsCount: 0, attendeesCount: 0 },
            // Ensure tags array exists
            tags: Array.isArray(event.tags) ? event.tags : [],
          };
        }).filter(Boolean); // Remove any null events
        console.log('Processed events with converted dates');
        setError(null); // Clear any previous errors
      } else {
        console.error('Failed to load real events:', result.error);
        throw new Error(result.error || 'Failed to load events');
      }
      
      // Combine real events with dummy events for development
      // Real events first, then dummy events
      const allEvents = [...realEvents, ...dummyEvents];
      console.log('Total events to display:', allEvents.length);
      
      setEvents(allEvents);
    } catch (error) {
      console.error('Error loading events:', error);
      // Set user-friendly error message
      setError('Unable to load events. Please check your internet connection and try again.');
      // Fallback to dummy events if Firestore fails
      setEvents(dummyEvents);
      throw error; // Re-throw to be caught by calling function
    }
  }, []);  // No dependencies needed

  /**
   * Handles pull-to-refresh gesture
   * Reloads events and provides visual feedback to user
   * 
   * PERFORMANCE OPTIMIZATION:
   * - Wrapped in useCallback for stable reference
   * 
   * @returns {Promise<void>}
   */
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);  // Show loading spinner
    setError(null);       // Clear any previous errors
    try {
      await Promise.all([
        loadEvents(),       // Fetch fresh event data
        loadUserLikedEvents(), // Refresh user's liked events
        loadUserSavedEvents()  // Refresh user's saved events
      ]);
    } catch (err) {
      console.error('Error during refresh:', err);
      // Error will be set by loadEvents, no need to set it here again
    } finally {
      setRefreshing(false); // Hide loading spinner
    }
  }, [loadEvents, loadUserLikedEvents, loadUserSavedEvents]); // Depends on all load functions

  /**
   * Handles like/unlike actions on events
   * Uses optimistic updates for immediate UI feedback
   * 
   * PERFORMANCE OPTIMIZATION:
   * - Wrapped in useCallback to prevent unnecessary re-renders
   * - Stable reference means EventCard components won't re-render unnecessarily
   * 
   * Optimistic Updates:
   * - Updates local state immediately (user sees change right away)
   * - Then sends request to backend
   * - If backend fails, we can revert the change (not implemented yet)
   * 
   * @param {string} eventId - The ID of the event to like/unlike
   */
  const handleLike = useCallback(async (eventId) => {
    if (!user?.uid) {
      console.warn('User not authenticated, cannot like event');
      return;
    }

    // STEP 1: Toggle the like state in local Set
    const newLikedEvents = new Set(likedEvents);
    const wasLiked = newLikedEvents.has(eventId);
    
    if (wasLiked) {
      newLikedEvents.delete(eventId);  // Unlike
    } else {
      newLikedEvents.add(eventId);     // Like
    }
    setLikedEvents(newLikedEvents);

    // STEP 2: Update the event stats locally for immediate UI feedback
    // This is called "optimistic update" - we assume the backend call will succeed
    setEvents(prevEvents => 
      prevEvents.map(event => {
        if (event.id === eventId) {
          const isNowLiked = newLikedEvents.has(eventId);
          return {
            ...event,  // Keep all existing event properties
            stats: {
              ...(event.stats || {}),  // Keep existing stats, default to empty object
              // Update likes count: +1 if liked, -1 if unliked (minimum 0)
              likesCount: isNowLiked 
                ? (event.stats?.likesCount || 0) + 1 
                : Math.max(0, (event.stats?.likesCount || 0) - 1)
            }
          };
        }
        return event;  // Return unchanged events
      })
    );

    // STEP 3: Sync with backend
    try {
      // Check if this is a dummy event (simple numeric IDs) or a real Firestore event
      const isDummyEvent = /^[1-5]$/.test(eventId); // Simple numeric IDs 1-5 are dummy events
      
      if (isDummyEvent) {
        // For dummy events, just update the user document directly
        const userResult = await firestoreService.getUser(user.uid);
        if (userResult.success) {
          const currentLikedEvents = userResult.data.eventsLiked || [];
          let updatedLikedEvents;
          
          if (wasLiked) {
            // Remove from liked events
            updatedLikedEvents = currentLikedEvents.filter(id => id !== eventId);
          } else {
            // Add to liked events
            updatedLikedEvents = [...currentLikedEvents, eventId];
          }
          
          const updateResult = await firestoreService.updateUser(user.uid, {
            eventsLiked: updatedLikedEvents
          });
          
          if (!updateResult.success) {
            console.error('Failed to update user liked events:', updateResult.error);
          } else {
            console.log('Successfully updated user liked events');
          }
        }
      } else {
        // For real events, use the full toggleEventLike function
        const result = await firestoreService.toggleEventLike(eventId, user.uid);
        if (!result.success) {
          console.error('Failed to sync like with backend:', result.error);
          // Revert optimistic update on failure
          const revertedLikedEvents = new Set(likedEvents);
          if (wasLiked) {
            revertedLikedEvents.add(eventId);  // Re-add if we removed it
          } else {
            revertedLikedEvents.delete(eventId);  // Remove if we added it
          }
          setLikedEvents(revertedLikedEvents);
          
          // Revert event stats
          setEvents(prevEvents => 
            prevEvents.map(event => {
              if (event.id === eventId) {
                return {
                  ...event,
                  stats: {
                    ...(event.stats || {}),
                    likesCount: wasLiked 
                      ? (event.stats?.likesCount || 0) + 1 
                      : Math.max(0, (event.stats?.likesCount || 0) - 1)
                  }
                };
              }
              return event;
            })
          );
        }
      }
    } catch (error) {
      console.error('Error syncing like with backend:', error);
    }
  }, [likedEvents, user]); // Depend on likedEvents and user

  /**
   * Handles save/unsave actions on events
   * Uses optimistic updates for immediate UI feedback
   * 
   * @param {string} eventId - The ID of the event to save/unsave
   */
  const handleSave = useCallback(async (eventId) => {
    if (!user?.uid) {
      console.warn('User not authenticated, cannot save event');
      return;
    }

    // STEP 1: Toggle the save state in local Set
    const newSavedEvents = new Set(savedEvents);
    const wasSaved = newSavedEvents.has(eventId);
    
    if (wasSaved) {
      newSavedEvents.delete(eventId);  // Unsave
    } else {
      newSavedEvents.add(eventId);     // Save
    }
    setSavedEvents(newSavedEvents);

    // STEP 2: Sync with backend
    try {
      const result = await firestoreService.toggleEventSave(eventId, user.uid);
      if (!result.success) {
        console.error('Failed to sync save with backend:', result.error);
        // Revert optimistic update on failure
        const revertedSavedEvents = new Set(savedEvents);
        if (wasSaved) {
          revertedSavedEvents.add(eventId);  // Re-add if we removed it
        } else {
          revertedSavedEvents.delete(eventId);  // Remove if we added it
        }
        setSavedEvents(revertedSavedEvents);
      } else {
        console.log(`Successfully ${result.isSaved ? 'saved' : 'unsaved'} event`);
      }
    } catch (error) {
      console.error('Error syncing save with backend:', error);
      // Revert optimistic update on error
      const revertedSavedEvents = new Set(savedEvents);
      if (wasSaved) {
        revertedSavedEvents.add(eventId);
      } else {
        revertedSavedEvents.delete(eventId);
      }
      setSavedEvents(revertedSavedEvents);
    }
  }, [savedEvents, user]); // Depend on savedEvents and user

  /**
   * Handles when user taps on an event card
   * Currently logs to console, will navigate to detail screen
   * 
   * PERFORMANCE OPTIMIZATION:
   * - Wrapped in useCallback for stable reference
   * 
   * @param {Object} event - The complete event object
   */
  const handleEventPress = useCallback((event) => {
    // TODO: Navigate to event detail screen
    // navigation.navigate('EventDetail', { eventId: event.id })
    console.log('Event pressed:', event.title);
  }, []); // No dependencies needed

  /**
   * Handles when user taps on the comments section
   * Navigates to the comments screen for the event
   * 
   * @param {Object} event - The complete event object
   */
  const handleComment = useCallback((event) => {
    navigation.navigate('Comments', {
      eventId: event.id,
      eventTitle: event.title
    });
  }, [navigation]);

  /**
   * Renders individual event items in the FlatList
   * This function is called for each event in the data array
   * 
   * PERFORMANCE OPTIMIZATIONS:
   * - Wrapped in useCallback to prevent recreation on every render
   * - Stable reference prevents FlatList from re-rendering all items
   * - We pass stable callback functions to avoid unnecessary re-renders
   * - The isLiked check uses Set.has() which is O(1) performance
   * 
   * @param {Object} props - FlatList render props
   * @param {Object} props.item - Individual event object
   * @returns {JSX.Element} EventCard component
   */
  const renderEvent = useCallback(({ item }) => (
    <EventCard
      event={item}                              // Event data
      onPress={() => handleEventPress(item)}    // Navigation callback
      onLike={handleLike}                       // Like toggle callback (stable reference)
      onSave={handleSave}                       // Save toggle callback (stable reference)
      onComment={handleComment}                 // Comment navigation callback (stable reference)
      isLiked={likedEvents.has(item.id)}        // Current like state (O(1) lookup)
      isSaved={savedEvents.has(item.id)}        // Current save state (O(1) lookup)
      isHighlighted={highlightedEventId === item.id} // Highlight state for navigation from map
    />
  ), [likedEvents, savedEvents, handleEventPress, handleLike, handleSave, handleComment, highlightedEventId]); // Re-create when states change

  /**
   * Renders category filter chip
   */
  const renderCategoryChip = useCallback(({ item: category }) => (
    <TouchableOpacity
      style={[
        styles.categoryChip,
        selectedCategory === category.id && [
          styles.selectedCategoryChip,
          { backgroundColor: category.color }
        ]
      ]}
      onPress={() => handleCategorySelect(category.id)}
    >
      <Ionicons
        name={category.icon}
        size={16}
        color={selectedCategory === category.id ? '#FFFFFF' : category.color}
      />
      <Text style={[
        styles.categoryChipText,
        selectedCategory === category.id && styles.selectedCategoryChipText
      ]}>
        {category.label}
      </Text>
    </TouchableOpacity>
  ), [selectedCategory, handleCategorySelect]);

  /**
   * Renders time filter chip
   */
  const renderTimeFilterChip = useCallback(({ item: timeFilter }) => (
    <TouchableOpacity
      style={[
        styles.categoryChip,
        selectedTimeFilter === timeFilter.id && [
          styles.selectedCategoryChip,
          { backgroundColor: timeFilter.color }
        ]
      ]}
      onPress={() => handleTimeFilterSelect(timeFilter.id)}
    >
      <Ionicons
        name={timeFilter.icon}
        size={16}
        color={selectedTimeFilter === timeFilter.id ? '#FFFFFF' : timeFilter.color}
      />
      <Text style={[
        styles.categoryChipText,
        selectedTimeFilter === timeFilter.id && styles.selectedCategoryChipText
      ]}>
        {timeFilter.label}
      </Text>
    </TouchableOpacity>
  ), [selectedTimeFilter, handleTimeFilterSelect]);

  /**
   * Renders the header section of the feed
   * Contains welcome message and category filter chips
   * This is rendered at the top of the FlatList
   * 
   * PERFORMANCE OPTIMIZATION:
   * - Wrapped in useCallback since content doesn't change
   * - Prevents header re-render when other state changes
   * 
   * @returns {JSX.Element} Header component
   */
  const renderHeader = useCallback(() => (
    <View>
      {/* Title Section */}
      <View style={[
        styles.header, 
        { 
          paddingHorizontal: responsiveValues.headerPadding,
          paddingVertical: responsiveValues.headerPadding 
        }
      ]}>
        <View style={styles.titleSection}>
          <Text style={[
            styles.title, 
            { fontSize: responsiveValues.titleFontSize }
          ]}>
            What's happening near you?
          </Text>
          <Text style={[
            styles.subtitle,
            { fontSize: responsiveValues.subtitleFontSize }
          ]}>
            Discover events in your area
          </Text>
        </View>
        
        {/* Event count indicator */}
        <View style={styles.eventCountBadge}>
          <Text style={styles.eventCountText}>
            {filteredEvents.length}
          </Text>
        </View>
      </View>

      {/* Category Filter Chips */}
      <View style={styles.categoryFilterContainer}>
        <Text style={styles.filterSectionTitle}>Category</Text>
        <FlatList
          data={EVENT_CATEGORIES}
          keyExtractor={(item) => item.id}
          renderItem={renderCategoryChip}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryFilterContent}
        />
      </View>

      {/* Time Filter Chips */}
      <View style={styles.categoryFilterContainer}>
        <Text style={styles.filterSectionTitle}>When</Text>
        <FlatList
          data={TIME_FILTERS}
          keyExtractor={(item) => item.id}
          renderItem={renderTimeFilterChip}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryFilterContent}
        />
      </View>
    </View>
  ), [responsiveValues, selectedCategory, selectedTimeFilter, filteredEvents.length, renderCategoryChip, renderTimeFilterChip]); // Re-render when filters change

  /**
   * Renders error state when there's a problem loading events
   * Shows error message and retry button
   * 
   * @returns {JSX.Element} Error state component
   */
  const renderError = useCallback(() => (
    <View style={styles.errorState}>
      <Ionicons 
        name="warning-outline" 
        size={responsiveValues.emptyIconSize} 
        color={theme.colors.error} 
      />
      
      <Text style={[
        styles.errorTitle,
        { fontSize: DEVICE_SIZE === 'xsmall' 
          ? theme.typography.fontSize.lg
          : theme.typography.fontSize.xl 
        }
      ]}>
        Something went wrong
      </Text>
      
      <Text style={[
        styles.errorSubtitle,
        { fontSize: DEVICE_SIZE === 'xsmall'
          ? theme.typography.fontSize.sm
          : theme.typography.fontSize.base
        }
      ]}>
        {error}
      </Text>
      
      <TouchableOpacity 
        style={styles.retryButton}
        onPress={handleRefresh}
        disabled={refreshing}
      >
        {refreshing ? (
          <ActivityIndicator size="small" color={theme.colors.background} />
        ) : (
          <>
            <Ionicons name="refresh" size={20} color={theme.colors.background} />
            <Text style={styles.retryButtonText}>Try Again</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  ), [responsiveValues, error, handleRefresh, refreshing]);

  /**
   * Renders empty state when no events are available
   * Shows encouraging message to users about posting events
   * This component is shown when events array is empty
   * 
   * PERFORMANCE OPTIMIZATION:
   * - Wrapped in useCallback since content is static
   * - Only rendered when events array is empty
   * 
   * @returns {JSX.Element} Empty state component
   */
  const renderEmpty = useCallback(() => {
    // Show error state if there's an error
    if (error) {
      return renderError();
    }
    
    return (
      <View style={styles.emptyState}>
        {/* Calendar icon with responsive sizing */}
        <Ionicons 
          name="calendar-outline" 
          size={responsiveValues.emptyIconSize} 
          color={theme.colors.textMuted} 
        />
        
        {/* Primary empty state message with responsive sizing */}
        <Text style={[
          styles.emptyTitle,
          { fontSize: DEVICE_SIZE === 'xsmall' 
            ? theme.typography.fontSize.lg
            : theme.typography.fontSize.xl 
          }
        ]}>
          No events found
        </Text>
        
        {/* Encouraging subtitle with responsive sizing */}
        <Text style={[
          styles.emptySubtitle,
          { fontSize: DEVICE_SIZE === 'xsmall'
            ? theme.typography.fontSize.sm
            : theme.typography.fontSize.base
          }
        ]}>
          Be the first to post an event in your area!
        </Text>
      </View>
    );
  }, [responsiveValues, error, renderError]); // Re-render if responsive values or error change

  // MEMOIZATION: Only re-create RefreshControl when refreshing state changes
  const refreshControl = useMemo(() => (
    <RefreshControl
      refreshing={refreshing}             // Show/hide loading spinner
      onRefresh={handleRefresh}           // Function called when user pulls down
      tintColor={theme.colors.primary}    // iOS loading spinner color (gold)
      colors={[theme.colors.primary]}     // Android loading spinner color (gold)
    />
  ), [refreshing, handleRefresh]);

  // MAIN RENDER
  // Show loading indicator on initial load
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading events...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 
        FLATLIST CONFIGURATION
        FlatList is React Native's high-performance list component
        It only renders visible items + a small buffer for smooth scrolling
      */}
      <FlatList
        ref={flatListRef}                       // Reference for scrolling to specific events
        // Data and rendering
        data={filteredEvents}                   // Array of filtered events to display
        keyExtractor={keyExtractor}             // Stable key extractor function (performance)
        renderItem={renderEvent}                // Function to render each event
        
        // Special components
        ListHeaderComponent={renderHeader}      // Rendered at top of list
        ListEmptyComponent={renderEmpty}        // Rendered when data is empty
        
        // UI configuration
        showsVerticalScrollIndicator={false}    // Hide scroll bar for cleaner look
        
        // Pull-to-refresh functionality
        refreshControl={refreshControl}         // Memoized RefreshControl component
        
        // PERFORMANCE OPTIMIZATIONS (Responsive)
        // Remove clipped subviews that are off-screen (Android optimization)
        removeClippedSubviews={true}
        
        // Responsive rendering optimization based on device size
        initialNumToRender={responsiveValues.initialNumToRender}
        maxToRenderPerBatch={responsiveValues.maxToRenderPerBatch}
        windowSize={responsiveValues.windowSize}
        
        // Get item layout for better scroll performance (if all items have same height)
        // getItemLayout={(data, index) => (
        //   {length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index}
        // )}
        
        // Error handling for scrollToIndex
        onScrollToIndexFailed={(info) => {
          console.warn('scrollToIndex failed:', info);
          // Fallback to scrolling to a safe position
          setTimeout(() => {
            if (flatListRef.current) {
              const maxIndex = Math.min(info.index, filteredEvents.length - 1);
              if (maxIndex >= 0) {
                flatListRef.current.scrollToIndex({
                  index: maxIndex,
                  animated: true,
                  viewOffset: 100,
                });
              }
            }
          }, 100);
        }}
        
        // Styling
        contentContainerStyle={styles.listContent}  // Styles applied to scroll content
      />
    </View>
  );
}

/**
 * STYLESHEET DOCUMENTATION
 * 
 * This stylesheet defines the visual layout of the EventFeedScreen.
 * All styles use the centralized theme system for consistency.
 * 
 * Layout Structure:
 * - container: Full screen with black background
 * - listContent: Provides bottom padding for last item visibility
 * - header: Title section with filter button
 * - emptyState: Centered message when no events exist
 */
const styles = StyleSheet.create({
  // Main container - fills entire screen with black background
  container: {
    flex: 1,                                  // Take full available height
    backgroundColor: theme.colors.background, // Pure black background
  },
  
  // Content container for FlatList - provides spacing at bottom
  listContent: {
    paddingBottom: theme.spacing.xl,          // Extra space at bottom for last item
  },
  // Header section containing title and filter button
  header: {
    flexDirection: 'row',                     // Horizontal layout
    justifyContent: 'space-between',          // Title left, filter right
    alignItems: 'center',                     // Vertical centering
    // Padding set dynamically via inline styles for responsiveness
    borderBottomWidth: 1,                     // Separator line
    borderBottomColor: theme.colors.border,  // Dark border color
    marginBottom: theme.spacing.sm,           // Space below header
  },
  
  // Container for title and subtitle text
  titleSection: {
    flex: 1,                                  // Take remaining space (left of filter)
  },
  
  // Main title with gold glow effect (responsive fontSize via inline styles)
  title: {
    // fontSize set dynamically for responsiveness
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,                 // White text
    marginBottom: theme.spacing.xs,           // Small gap to subtitle
    // Gold glow effect for visual impact
    textShadowColor: theme.colors.primary,    // Gold shadow
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,                      // Glow spread
  },
  
  // Subtitle text with secondary styling (responsive fontSize via inline styles)
  subtitle: {
    // fontSize set dynamically for responsiveness
    color: theme.colors.textSecondary,        // Muted color for hierarchy
  },
  
  // Event count badge
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

  // Category filter container
  categoryFilterContainer: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingBottom: theme.spacing.md,
    paddingTop: theme.spacing.sm,
  },

  filterSectionTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },

  categoryFilterContent: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
  },

  // Category filter chips
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.xs,
    marginRight: theme.spacing.sm,
  },

  selectedCategoryChip: {
    borderColor: 'transparent',
    // backgroundColor set dynamically
  },

  categoryChipText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text,
  },

  selectedCategoryChipText: {
    color: '#FFFFFF',
  },
  // Empty state shown when no events are available
  emptyState: {
    alignItems: 'center',                     // Center content horizontally
    justifyContent: 'center',                 // Center content vertically
    paddingVertical: theme.spacing['3xl'],    // Large vertical padding
    paddingHorizontal: theme.spacing.xl,     // Horizontal padding for text
  },
  
  // Primary empty state text (responsive fontSize via inline styles)
  emptyTitle: {
    // fontSize set dynamically for responsiveness
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,                 // White text
    marginTop: theme.spacing.lg,              // Space below icon
    marginBottom: theme.spacing.sm,           // Space above subtitle
  },
  
  // Secondary empty state text with encouragement (responsive fontSize via inline styles)
  emptySubtitle: {
    // fontSize set dynamically for responsiveness
    color: theme.colors.textSecondary,        // Muted for hierarchy
    textAlign: 'center',                      // Center-aligned text
    // Line height calculated dynamically based on responsive font size
    lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.base,
  },

  // Loading container - centered loading indicator
  loadingContainer: {
    flex: 1,                                  // Take full available height
    justifyContent: 'center',                 // Center content vertically
    alignItems: 'center',                     // Center content horizontally
    backgroundColor: theme.colors.background, // Same background as main screen
    paddingHorizontal: theme.spacing.xl,     // Horizontal padding
  },

  // Loading text below the spinner
  loadingText: {
    color: theme.colors.text,                 // White text
    fontSize: theme.typography.fontSize.base, // Standard font size
    marginTop: theme.spacing.md,              // Space above text
    textAlign: 'center',                      // Center-aligned text
  },

  // Error state styling
  errorState: {
    alignItems: 'center',                     // Center content horizontally
    justifyContent: 'center',                 // Center content vertically
    paddingVertical: theme.spacing['3xl'],    // Large vertical padding
    paddingHorizontal: theme.spacing.xl,     // Horizontal padding for text
  },
  
  errorTitle: {
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.error,                // Red text for error
    marginTop: theme.spacing.lg,              // Space below icon
    marginBottom: theme.spacing.sm,           // Space above subtitle
  },
  
  errorSubtitle: {
    color: theme.colors.textSecondary,        // Muted for hierarchy
    textAlign: 'center',                      // Center-aligned text
    lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.base,
    marginBottom: theme.spacing.xl,           // Space above retry button
  },
  
  retryButton: {
    flexDirection: 'row',                     // Horizontal layout for icon and text
    alignItems: 'center',                     // Center content vertically
    backgroundColor: theme.colors.primary,    // Gold button
    paddingHorizontal: theme.spacing.lg,     // Horizontal padding
    paddingVertical: theme.spacing.md,       // Vertical padding
    borderRadius: theme.borderRadius.full,   // Rounded button
    gap: theme.spacing.sm,                   // Space between icon and text
  },
  
  retryButtonText: {
    color: theme.colors.background,           // Black text on gold button
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
  },
});