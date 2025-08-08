import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { theme } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext-firebase';
import { firestoreService } from '../../services/firestoreService';

export default function PostEventScreen() {
  const { user, userDocument } = useAuth();
  const navigation = useNavigation();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'music',
    location: {
      name: '',
      address: '',
      city: ''
    },
    startDate: new Date(),
    endDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours later
    tags: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState({ type: null, visible: false });
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);

  const categories = [
    { id: 'music', label: 'Music', icon: 'musical-notes', color: '#9333EA' },
    { id: 'sports', label: 'Sports', icon: 'basketball', color: '#059669' },
    { id: 'food', label: 'Food', icon: 'restaurant', color: '#DC2626' },
    { id: 'wellness', label: 'Wellness', icon: 'leaf', color: '#16A34A' },
    { id: 'art', label: 'Art', icon: 'color-palette', color: '#7C2D12' },
    { id: 'party', label: 'Party', icon: 'wine', color: '#BE185D' },
    { id: 'networking', label: 'Networking', icon: 'people', color: '#1D4ED8' }
  ];

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleDateChange = (type, date) => {
    setFormData(prev => ({ ...prev, [type]: date }));
    setShowDatePicker({ type: null, visible: false });
  };

  const getCurrentLocation = async () => {
    setLocationLoading(true);
    try {
      console.log('Requesting location permissions...');
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'We need location access to help users find events near them. You can still create events without location.',
          [{ text: 'OK' }]
        );
        setLocationLoading(false);
        return;
      }

      console.log('Getting current location...');
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeout: 10000,
      });

      console.log('Location obtained:', location.coords);
      setUserLocation(location.coords);
      
      // Optional: Reverse geocode to get address
      try {
        const [address] = await Location.reverseGeocodeAsync(location.coords);
        if (address && !formData.location.city) {
          setFormData(prev => ({
            ...prev,
            location: {
              ...prev.location,
              city: address.city || address.subregion || 'Unknown City'
            }
          }));
        }
      } catch (geocodeError) {
        console.log('Geocoding failed:', geocodeError.message);
      }

    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert(
        'Location Error', 
        'Could not get your current location. You can still create the event without location data.'
      );
    } finally {
      setLocationLoading(false);
    }
  };

  const formatDateTime = (date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter an event title');
      return false;
    }
    if (!formData.description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return false;
    }
    if (!formData.location.name.trim()) {
      Alert.alert('Error', 'Please enter a location name');
      return false;
    }
    if (formData.startDate >= formData.endDate) {
      Alert.alert('Error', 'End time must be after start time');
      return false;
    }
    if (formData.startDate < new Date()) {
      Alert.alert('Error', 'Event cannot be scheduled in the past');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!user?.uid) {
      Alert.alert('Error', 'Please log in to create events');
      return;
    }

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // Convert tags string to array
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim().toLowerCase())
        .filter(tag => tag.length > 0);

      const eventData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        authorId: user.uid,
        authorName: userDocument?.displayName || user.displayName || 'User',
        authorAvatar: userDocument?.profilePicture || null,
        category: formData.category,
        location: {
          name: formData.location.name.trim(),
          address: formData.location.address.trim(),
          city: formData.location.city.trim() || 'Unknown City',
          coordinates: userLocation ? {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude
          } : {
            latitude: 0,
            longitude: 0
          }
        },
        startTime: formData.startDate,
        endTime: formData.endDate,
        imageUrl: null, // Skip images for now
        tags: tagsArray,
        isActive: true
      };

      const result = await firestoreService.createEvent(eventData);
      if (result.success) {
        Alert.alert(
          'Success!',
          'Your event has been created successfully.',
          [{
            text: 'View Events',
            onPress: () => {
              resetForm();
              navigation.navigate('Events'); // Navigate to Events tab
            }
          }]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to create event');
      }
    } catch (error) {
      console.error('Error creating event:', error);
      Alert.alert('Error', 'Failed to create event. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'music',
      location: { name: '', address: '', city: '' },
      startDate: new Date(),
      endDate: new Date(Date.now() + 2 * 60 * 60 * 1000),
      tags: ''
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Create Event</Text>
          <Text style={styles.subtitle}>Share what's happening in your area</Text>
        </View>

        {/* Event Title */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Event Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="What's the name of your event?"
            placeholderTextColor={theme.colors.textMuted}
            value={formData.title}
            onChangeText={(text) => handleInputChange('title', text)}
            maxLength={100}
          />
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe your event, what makes it special?"
            placeholderTextColor={theme.colors.textMuted}
            value={formData.description}
            onChangeText={(text) => handleInputChange('description', text)}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={500}
          />
        </View>

        {/* Category Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Category</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesContainer}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryButton,
                  { borderColor: category.color },
                  formData.category === category.id && {
                    backgroundColor: category.color
                  }
                ]}
                onPress={() => handleInputChange('category', category.id)}
              >
                <Ionicons
                  name={category.icon}
                  size={20}
                  color={formData.category === category.id ? '#FFFFFF' : category.color}
                />
                <Text
                  style={[
                    styles.categoryText,
                    { color: formData.category === category.id ? '#FFFFFF' : category.color }
                  ]}
                >
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Location */}
        <View style={styles.inputGroup}>
          <View style={styles.locationHeader}>
            <Text style={styles.label}>Location *</Text>
            <TouchableOpacity
              style={styles.locationButton}
              onPress={getCurrentLocation}
              disabled={locationLoading}
            >
              {locationLoading ? (
                <Text style={styles.locationButtonText}>Getting location...</Text>
              ) : (
                <>
                  <Ionicons 
                    name={userLocation ? "checkmark-circle" : "location-outline"} 
                    size={16} 
                    color={userLocation ? theme.colors.success : theme.colors.primary} 
                  />
                  <Text style={[
                    styles.locationButtonText,
                    { color: userLocation ? theme.colors.success : theme.colors.primary }
                  ]}>
                    {userLocation ? 'Location captured' : 'Use my location'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
          
          <TextInput
            style={styles.input}
            placeholder="Venue name"
            placeholderTextColor={theme.colors.textMuted}
            value={formData.location.name}
            onChangeText={(text) => handleInputChange('location.name', text)}
          />
          <TextInput
            style={[styles.input, styles.marginTop]}
            placeholder="Address (optional)"
            placeholderTextColor={theme.colors.textMuted}
            value={formData.location.address}
            onChangeText={(text) => handleInputChange('location.address', text)}
          />
          <TextInput
            style={[styles.input, styles.marginTop]}
            placeholder="City"
            placeholderTextColor={theme.colors.textMuted}
            value={formData.location.city}
            onChangeText={(text) => handleInputChange('location.city', text)}
          />
        </View>

        {/* Date & Time */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Date & Time</Text>
          <View style={styles.dateTimeRow}>
            <TouchableOpacity
              style={[styles.dateButton, { flex: 1, marginRight: theme.spacing.sm }]}
              onPress={() => setShowDatePicker({ type: 'startDate', visible: true })}
            >
              <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
              <View style={styles.dateTextContainer}>
                <Text style={styles.dateLabel}>Start</Text>
                <Text style={styles.dateText}>{formatDateTime(formData.startDate)}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dateButton, { flex: 1, marginLeft: theme.spacing.sm }]}
              onPress={() => setShowDatePicker({ type: 'endDate', visible: true })}
            >
              <Ionicons name="time-outline" size={20} color={theme.colors.primary} />
              <View style={styles.dateTextContainer}>
                <Text style={styles.dateLabel}>End</Text>
                <Text style={styles.dateText}>{formatDateTime(formData.endDate)}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tags */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tags (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="music, outdoor, free, family-friendly (separate with commas)"
            placeholderTextColor={theme.colors.textMuted}
            value={formData.tags}
            onChangeText={(text) => handleInputChange('tags', text)}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Text style={styles.submitButtonText}>Creating Event...</Text>
          ) : (
            <>
              <Ionicons name="add-circle" size={20} color={theme.colors.background} />
              <Text style={styles.submitButtonText}>Create Event</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Simple Date/Time Picker Modal */}
      {showDatePicker.visible && (
        <View style={styles.datePickerOverlay}>
          <View style={styles.datePickerModal}>
            <Text style={styles.datePickerTitle}>
              Select {showDatePicker.type === 'startDate' ? 'Start' : 'End'} Date & Time
            </Text>
            <View style={styles.datePickerButtons}>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => {
                  const now = new Date();
                  handleDateChange(showDatePicker.type, now);
                }}
              >
                <Text style={styles.datePickerButtonText}>Now</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  handleDateChange(showDatePicker.type, tomorrow);
                }}
              >
                <Text style={styles.datePickerButtonText}>Tomorrow</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => {
                  const nextWeek = new Date();
                  nextWeek.setDate(nextWeek.getDate() + 7);
                  handleDateChange(showDatePicker.type, nextWeek);
                }}
              >
                <Text style={styles.datePickerButtonText}>Next Week</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.datePickerCancel}
              onPress={() => setShowDatePicker({ type: null, visible: false })}
            >
              <Text style={styles.datePickerCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: theme.typography.fontSize['3xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
    textShadowColor: theme.colors.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
  },
  inputGroup: {
    marginBottom: theme.spacing.xl,
  },
  label: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text,
    minHeight: 50,
  },
  textArea: {
    minHeight: 100,
    paddingTop: theme.spacing.md,
  },
  marginTop: {
    marginTop: theme.spacing.sm,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    gap: theme.spacing.xs,
  },
  locationButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  categoriesContainer: {
    marginTop: theme.spacing.sm,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderRadius: theme.borderRadius.full,
    marginRight: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  categoryText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
  },
  dateTimeRow: {
    flexDirection: 'row',
    marginTop: theme.spacing.sm,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  dateTextContainer: {
    flex: 1,
  },
  dateLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
    marginBottom: 2,
  },
  dateText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text,
    fontWeight: theme.typography.fontWeight.medium,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.lg,
    gap: theme.spacing.sm,
    ...theme.shadows.md,
  },
  submitButtonDisabled: {
    backgroundColor: theme.colors.textMuted,
  },
  submitButtonText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.background,
  },
  datePickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  datePickerModal: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    width: '100%',
    maxWidth: 300,
  },
  datePickerTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  datePickerButtons: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  datePickerButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  datePickerButtonText: {
    color: theme.colors.background,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  datePickerCancel: {
    alignItems: 'center',
    padding: theme.spacing.sm,
  },
  datePickerCancelText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.base,
  },
});