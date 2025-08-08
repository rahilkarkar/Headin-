import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext-firebase';
import { firestoreService } from '../../services/firestoreService';

export default function MapScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [userLocation, setUserLocation] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groupedEvents, setGroupedEvents] = useState([]);

  useEffect(() => {
    loadLocationAndEvents();
  }, []);

  const loadLocationAndEvents = async () => {
    try {
      // Get user's current location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setUserLocation(location.coords);
        console.log('User location:', location.coords);
      }
    } catch (error) {
      console.log('Could not get location:', error);
    }

    // Load events
    await loadEvents();
  };

  const loadEvents = async () => {
    try {
      console.log('Loading events for location view...');
      const result = await firestoreService.getEvents({ limit: 50 });
      
      if (result.success) {
        // Process and group events by city
        const processedEvents = result.data.map(event => ({
          ...event,
          startTime: event.startTime?.toDate ? event.startTime.toDate() : new Date(event.startTime),
          endTime: event.endTime?.toDate ? event.endTime.toDate() : new Date(event.endTime),
          createdAt: event.createdAt?.toDate ? event.createdAt.toDate() : new Date(event.createdAt),
          hasLocation: event.location?.coordinates?.latitude && 
                      event.location?.coordinates?.longitude &&
                      event.location.coordinates.latitude !== 0 &&
                      event.location.coordinates.longitude !== 0,
          distance: userLocation && event.location?.coordinates?.latitude && event.location?.coordinates?.longitude ?
            calculateDistance(
              userLocation.latitude, userLocation.longitude,
              event.location.coordinates.latitude, event.location.coordinates.longitude
            ) : null
        }));
        
        setEvents(processedEvents);
        groupEventsByLocation(processedEvents);
        console.log(`Processed ${processedEvents.length} events`);
      }
    } catch (error) {
      console.error('Error loading events:', error);
      Alert.alert('Error', 'Could not load events');
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 3959; // Radius of Earth in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return Math.round(distance * 10) / 10; // Round to 1 decimal
  };

  const groupEventsByLocation = (events) => {
    const groups = {};
    
    events.forEach(event => {
      const city = event.location?.city || 'Unknown Location';
      if (!groups[city]) {
        groups[city] = [];
      }
      groups[city].push(event);
    });
    
    // Convert to array and sort by number of events
    const groupedArray = Object.entries(groups)
      .map(([city, cityEvents]) => ({
        city,
        events: cityEvents.sort((a, b) => (a.distance || 999) - (b.distance || 999)),
        count: cityEvents.length
      }))
      .sort((a, b) => b.count - a.count);
    
    setGroupedEvents(groupedArray);
  };

  const handleEventPress = (event) => {
    // Show event details in alert with option to view in Events feed
    Alert.alert(
      event.title,
      `${event.description}\n\nBy: ${event.authorName}\nWhen: ${formatDateTime(event.startTime)}\nWhere: ${event.location?.name || 'Location TBD'}`,
      [
        { text: 'Close', style: 'cancel' },
        {
          text: 'View in Feed',
          onPress: () => {
            // Navigate to Events tab and pass event ID as param
            navigation.navigate('Events', { 
              highlightEventId: event.id,
              scrollToEvent: true 
            });
          }
        },
        event.hasLocation ? {
          text: 'Open in Maps',
          onPress: () => openInMaps(event)
        } : null
      ].filter(Boolean)
    );
  };

  const openInMaps = (event) => {
    const { latitude, longitude } = event.location.coordinates;
    const label = encodeURIComponent(event.location.name || event.title);
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}&query_place_id=${label}`;
    
    Linking.openURL(url).catch(err => {
      Alert.alert('Error', 'Could not open maps');
      console.error('Error opening maps:', err);
    });
  };

  const formatDateTime = (date) => {
    const eventDate = date.toDate ? date.toDate() : new Date(date);
    return eventDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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

  const getCategoryIcon = (category) => {
    const icons = {
      music: 'musical-notes',
      sports: 'basketball',
      food: 'restaurant', 
      wellness: 'leaf',
      art: 'color-palette',
      party: 'wine',
      networking: 'people',
      default: 'calendar'
    };
    return icons[category] || icons.default;
  };


  const renderLocationGroup = ({ item: locationGroup }) => {
    return (
      <View style={styles.locationGroup}>
        <View style={styles.locationHeader}>
          <View style={styles.locationTitleContainer}>
            <Ionicons name="location" size={20} color={theme.colors.primary} />
            <Text style={styles.locationTitle}>{locationGroup.city}</Text>
          </View>
          <Text style={styles.eventCount}>{locationGroup.count} events</Text>
        </View>
        
        {locationGroup.events.map((event, index) => (
          <TouchableOpacity
            key={event.id}
            style={styles.eventItem}
            onPress={() => handleEventPress(event)}
          >
            <View style={[styles.categoryDot, { backgroundColor: getCategoryColor(event.category) }]} />
            <View style={styles.eventContent}>
              <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
              <Text style={styles.eventDetails} numberOfLines={1}>
                {event.location?.name} • {formatDateTime(event.startTime)}
              </Text>
              <View style={styles.eventMeta}>
                <Text style={styles.eventAuthor}>by {event.authorName}</Text>
                {event.distance && (
                  <Text style={styles.eventDistance}>{event.distance} miles away</Text>
                )}
              </View>
            </View>
            <View style={styles.eventStats}>
              <Ionicons name="heart" size={14} color={theme.colors.primary} />
              <Text style={styles.statText}>{event.stats?.likesCount || 0}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading events by location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Events by Location</Text>
          <Text style={styles.subtitle}>
            {events.length} events • {groupedEvents.length} locations
          </Text>
        </View>
        {userLocation && (
          <TouchableOpacity style={styles.locationIndicator}>
            <Ionicons name="location" size={16} color={theme.colors.success} />
            <Text style={styles.locationText}>Your location</Text>
          </TouchableOpacity>
        )}
      </View>

      {groupedEvents.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="map-outline" size={64} color={theme.colors.textMuted} />
          <Text style={styles.emptyTitle}>No events with locations found</Text>
          <Text style={styles.emptySubtitle}>
            Events will appear here when users add location data
          </Text>
        </View>
      ) : (
        <FlatList
          data={groupedEvents}
          renderItem={renderLocationGroup}
          keyExtractor={(item) => item.city}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerContent: {
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
  locationIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    gap: theme.spacing.xs,
  },
  locationText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.success,
    fontWeight: theme.typography.fontWeight.medium,
  },
  listContent: {
    padding: theme.spacing.lg,
  },
  locationGroup: {
    marginBottom: theme.spacing.xl,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  locationTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  locationTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
  },
  eventCount: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: theme.spacing.md,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  eventDetails: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  eventMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  eventAuthor: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
  },
  eventDistance: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  eventStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  statText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  },
});