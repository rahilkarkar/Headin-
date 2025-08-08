/**
 * EventCard Component
 * 
 * A responsive, interactive card component for displaying event information
 * Features:
 * - Responsive design that adapts to different screen sizes
 * - Interactive like functionality with visual feedback
 * - Category-based color coding and icons
 * - Smart time formatting (relative and absolute)
 * - Optimized for FlatList rendering performance
 * 
 * @param {Object} event - The event object containing all event data
 * @param {Function} onPress - Callback when the card is pressed
 * @param {Function} onLike - Callback when the like button is pressed
 * @param {Function} onSave - Callback when the save button is pressed
 * @param {Function} onComment - Callback when the comment button is pressed
 * @param {boolean} isLiked - Whether the current user has liked this event
 * @param {boolean} isSaved - Whether the current user has saved this event
 * @param {boolean} isHighlighted - Whether this event should be highlighted (from navigation)
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';

// Get device dimensions for responsive design
const { width, height } = Dimensions.get('window');

// Define breakpoints for responsive design
const SCREEN_BREAKPOINTS = {
  small: 360,   // Small phones
  medium: 400,  // Regular phones  
  large: 500,   // Large phones/small tablets
};

function EventCard({ event, onPress, onLike, onSave, onComment, isLiked = false, isSaved = false, isHighlighted = false }) {
  /**
   * Formats date/time for user-friendly display
   * Shows relative time for upcoming events, absolute time for distant events
   * 
   * @param {Date|string} date - The date to format
   * @returns {string} Formatted date string
   */
  const formatDate = (date) => {
    const now = new Date();
    const eventDate = new Date(date);
    const diffInHours = Math.abs(eventDate - now) / (1000 * 60 * 60);
    
    // Show relative time for events within 24 hours
    if (diffInHours < 1) {
      return 'Starting soon';
    } else if (diffInHours < 24) {
      return `In ${Math.floor(diffInHours)} hours`;
    } else {
      // Show absolute time for distant events
      return eventDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  /**
   * Maps event categories to appropriate Ionicons
   * Provides visual context for different event types
   * 
   * @param {string} category - The event category
   * @returns {string} Ionicon name
   */
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

  /**
   * Maps event categories to brand colors
   * Creates visual hierarchy and category recognition
   * 
   * @param {string} category - The event category  
   * @returns {string} Hex color code
   */
  const getCategoryColor = (category) => {
    const colors = {
      music: '#9333EA',      // Purple - creativity, artistry
      sports: '#059669',     // Green - energy, health
      food: '#DC2626',       // Red - appetite, warmth
      wellness: '#16A34A',   // Green - nature, health
      art: '#7C2D12',        // Brown - earthiness, culture
      party: '#BE185D',      // Pink - fun, celebration
      networking: '#1D4ED8', // Blue - professionalism, trust
      default: theme.colors.primary
    };
    return colors[category] || colors.default;
  };

  /**
   * Determines responsive sizing based on screen width
   * Ensures cards look good on all device sizes
   * 
   * @returns {Object} Responsive style values
   */
  const getResponsiveStyles = () => {
    const isSmallScreen = width < SCREEN_BREAKPOINTS.small;
    const isLargeScreen = width > SCREEN_BREAKPOINTS.large;
    
    return {
      // Responsive padding and margins
      cardPadding: isSmallScreen ? theme.spacing.md : theme.spacing.lg,
      cardMargin: isSmallScreen ? theme.spacing.sm : theme.spacing.md,
      
      // Responsive font sizes
      titleSize: isSmallScreen 
        ? theme.typography.fontSize.lg 
        : isLargeScreen 
        ? theme.typography.fontSize['2xl']
        : theme.typography.fontSize.xl,
        
      // Responsive spacing
      elementSpacing: isSmallScreen ? theme.spacing.sm : theme.spacing.md,
      
      // Maximum number of tags to show
      maxTags: isSmallScreen ? 2 : 3,
    };
  };

  // Get responsive styles for this render
  const responsive = getResponsiveStyles();

  return (
    <TouchableOpacity 
      style={[
        styles.card, 
        { 
          marginHorizontal: responsive.cardMargin,
          padding: responsive.cardPadding 
        },
        isHighlighted && styles.highlightedCard // Apply highlight styling if needed
      ]} 
      onPress={onPress}
      activeOpacity={0.8} // Provide visual feedback on press
    >
      {/* 
        HEADER SECTION
        Contains author info and category badge
        Responsive layout adapts to screen size
      */}
      <View style={[styles.header, { marginBottom: responsive.elementSpacing }]}>
        {/* Author information with avatar */}
        <View style={styles.authorInfo}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={16} color={theme.colors.primary} />
          </View>
          <View style={styles.authorDetails}>
            <Text style={styles.authorName}>{event.authorName}</Text>
            <Text style={styles.timeAgo}>{formatDate(event.createdAt)}</Text>
          </View>
        </View>
        
        {/* Category badge with dynamic color and icon */}
        <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(event.category) }]}>
          <Ionicons 
            name={getCategoryIcon(event.category)} 
            size={12} 
            color="#FFFFFF" 
          />
          <Text style={styles.categoryText}>
            {event.category.charAt(0).toUpperCase() + event.category.slice(1)}
          </Text>
        </View>
      </View>

      {/* 
        CONTENT SECTION
        Main event information: title, description, details
        Uses responsive font sizes
      */}
      <View style={[styles.content, { marginBottom: responsive.elementSpacing }]}>
        {/* Event title with responsive sizing */}
        <Text style={[styles.title, { fontSize: responsive.titleSize }]}>
          {event.title}
        </Text>
        
        {/* Event description - truncated to 2 lines for consistent card height */}
        <Text style={styles.description} numberOfLines={2}>
          {event.description}
        </Text>
        
        {/* Location & Time information with icons */}
        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={16} color={theme.colors.primary} />
            <Text style={styles.detailText}>{event.location.name}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={16} color={theme.colors.primary} />
            <Text style={styles.detailText}>{formatDate(event.startTime)}</Text>
          </View>
        </View>

        {/* 
          TAGS SECTION
          Displays hashtags with responsive quantity
          Shows "+X" indicator for hidden tags
        */}
        <View style={styles.tags}>
          {event.tags && Array.isArray(event.tags) && event.tags.slice(0, responsive.maxTags).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
          {/* Show count of remaining tags if there are more */}
          {event.tags && event.tags.length > responsive.maxTags && (
            <Text style={styles.moreTagsText}>
              +{event.tags.length - responsive.maxTags}
            </Text>
          )}
        </View>
      </View>

      {/* 
        FOOTER SECTION
        Engagement stats and action buttons (like and save)
        Shows likes, comments, and attendee counts
      */}
      <View style={styles.footer}>
        {/* Engagement statistics */}
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Ionicons name="heart" size={16} color={theme.colors.primary} />
            <Text style={styles.statText}>{event.stats.likesCount}</Text>
          </View>
          <TouchableOpacity 
            style={styles.statItem} 
            onPress={() => onComment && onComment(event)}
            activeOpacity={0.7}
          >
            <Ionicons name="chatbubble" size={16} color={theme.colors.primary} />
            <Text style={styles.statText}>{event.stats.commentsCount}</Text>
          </TouchableOpacity>
          <View style={styles.statItem}>
            <Ionicons name="people" size={16} color={theme.colors.primary} />
            <Text style={styles.statText}>{event.stats.attendeesCount}</Text>
          </View>
        </View>

        {/* Action buttons container */}
        <View style={styles.actionButtons}>
          {/* 
            Interactive save button
            Changes appearance based on save state
          */}
          <TouchableOpacity 
            style={[styles.actionButton, isSaved && styles.savedButton]} 
            onPress={() => onSave && onSave(event.id)}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={isSaved ? "bookmark" : "bookmark-outline"} 
              size={18} 
              color={isSaved ? theme.colors.background : theme.colors.primary} 
            />
          </TouchableOpacity>
          
          {/* 
            Interactive like button
            Changes appearance based on like state
            Provides immediate visual feedback
          */}
          <TouchableOpacity 
            style={[styles.actionButton, isLiked && styles.likedButton]} 
            onPress={() => onLike && onLike(event.id)}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={isLiked ? "heart" : "heart-outline"} 
              size={18} 
              color={isLiked ? theme.colors.background : theme.colors.primary} 
            />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

/**
 * STYLESHEET DOCUMENTATION
 * 
 * This stylesheet defines the visual appearance of the EventCard component.
 * All styles use the theme system for consistency across the app.
 * Responsive adjustments are handled via inline styles in the component.
 */
const styles = StyleSheet.create({
  // Main card container - provides the base styling for the entire card
  card: {
    backgroundColor: theme.colors.surface,     // Dark surface color for card background
    borderRadius: theme.borderRadius.lg,      // Large border radius for modern look
    marginVertical: theme.spacing.sm,         // Vertical spacing between cards
    borderWidth: 1,                           // Subtle border for definition
    borderColor: theme.colors.border,         // Border using theme border color
    ...theme.shadows.md,                      // Medium shadow for depth (gold tinted)
    // Note: marginHorizontal and padding are set dynamically for responsiveness
  },
  
  // Highlighted card styling for navigation from map
  highlightedCard: {
    borderColor: theme.colors.primary,        // Gold border for highlight
    borderWidth: 2,                           // Thicker border for emphasis
    backgroundColor: 'rgba(255, 215, 0, 0.05)', // Subtle gold background tint
    ...theme.shadows.lg,                      // Larger shadow for prominence
  },
  // Header section containing author info and category badge
  header: {
    flexDirection: 'row',                     // Horizontal layout
    justifyContent: 'space-between',          // Space between author and category
    alignItems: 'center',                     // Vertical centering
    // marginBottom set dynamically for responsive spacing
  },
  
  // Container for author avatar and details
  authorInfo: {
    flexDirection: 'row',                     // Horizontal layout for avatar + text
    alignItems: 'center',                     // Vertical centering
    flex: 1,                                  // Take available space, leaving room for category badge
  },
  
  // Circular avatar container with theme styling
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,                         // Perfect circle (half of width/height)
    backgroundColor: theme.colors.background, // Black background
    borderWidth: 1,                           // Gold border
    borderColor: theme.colors.primary,        // Gold color from theme
    alignItems: 'center',                     // Center the person icon
    justifyContent: 'center',
    marginRight: theme.spacing.sm,            // Space between avatar and text
  },
  // Author text container
  authorDetails: {
    flex: 1,                                  // Take remaining space in author section
  },
  
  // Author name styling
  authorName: {
    fontSize: theme.typography.fontSize.sm,   // Small font for compact header
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,                 // White text
  },
  
  // Time ago text styling  
  timeAgo: {
    fontSize: theme.typography.fontSize.xs,   // Extra small for secondary info
    color: theme.colors.textMuted,            // Muted color for less emphasis
    marginTop: 2,                             // Slight spacing from author name
  },
  
  // Category badge with dynamic background color
  categoryBadge: {
    flexDirection: 'row',                     // Icon + text horizontal layout
    alignItems: 'center',                     // Vertical centering
    paddingHorizontal: theme.spacing.sm,     // Horizontal padding for badge shape
    paddingVertical: theme.spacing.xs,       // Minimal vertical padding
    borderRadius: theme.borderRadius.full,   // Pill-shaped badge
    gap: theme.spacing.xs,                    // Space between icon and text
    // backgroundColor set dynamically based on category
  },
  
  // White text inside category badge
  categoryText: {
    fontSize: theme.typography.fontSize.xs,   // Small text for compact badge
    fontWeight: theme.typography.fontWeight.semibold,
    color: '#FFFFFF',                         // Always white for contrast
  },
  
  // Main content section
  content: {
    // marginBottom set dynamically for responsive spacing
  },
  
  // Event title with glow effect
  title: {
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,                 // White text
    marginBottom: theme.spacing.sm,
    textShadowColor: theme.colors.primary,    // Gold glow effect
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,                      // Glow radius
    // fontSize set dynamically for responsive design
  },
  // Event description with line height for readability
  description: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,        // Secondary text color
    lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.base,
    marginBottom: theme.spacing.md,
  },
  
  // Container for location and time details  
  details: {
    gap: theme.spacing.xs,                    // Spacing between detail rows
    marginBottom: theme.spacing.md,
  },
  
  // Individual detail row (location or time)
  detailRow: {
    flexDirection: 'row',                     // Icon + text layout
    alignItems: 'center',
    gap: theme.spacing.sm,                    // Space between icon and text
  },
  
  // Detail text styling
  detailText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  
  // Container for hashtags
  tags: {
    flexDirection: 'row',                     // Horizontal layout
    alignItems: 'center',
    gap: theme.spacing.xs,                    // Space between tags
    flexWrap: 'wrap',                         // Wrap to new line if needed
  },
  
  // Individual hashtag styling
  tag: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)', // Translucent gold background
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',      // Translucent gold border
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs / 2,
    borderRadius: theme.borderRadius.sm,
  },
  
  // Hashtag text
  tagText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.primary,              // Gold text
    fontWeight: theme.typography.fontWeight.medium,
  },
  
  // "+X more tags" indicator
  moreTagsText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
  },
  
  // Footer with stats and like button
  footer: {
    flexDirection: 'row',                     // Horizontal layout
    justifyContent: 'space-between',          // Stats left, like button right
    alignItems: 'center',
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,                        // Separator line
    borderTopColor: theme.colors.border,
  },
  
  // Container for engagement statistics
  stats: {
    flexDirection: 'row',                     // Horizontal layout of stats
    gap: theme.spacing.lg,                    // Space between stat items
  },
  
  // Individual stat item (likes, comments, attendees)
  statItem: {
    flexDirection: 'row',                     // Icon + number layout
    alignItems: 'center',
    gap: theme.spacing.xs,                    // Space between icon and number
  },
  
  // Stat number text
  statText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.fontWeight.medium,
  },
  
  // Action buttons container (like and save)
  actionButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },

  // Action button - default state (outline)
  actionButton: {
    padding: theme.spacing.sm,                // Touchable area
    borderRadius: theme.borderRadius.full,    // Circular button
    backgroundColor: 'transparent',           // Transparent background
    borderWidth: 1,                           // Gold border
    borderColor: theme.colors.primary,
  },
  
  // Like button - liked state (filled)
  likedButton: {
    backgroundColor: theme.colors.primary,    // Gold background when liked
  },

  // Save button - saved state (filled)
  savedButton: {
    backgroundColor: theme.colors.primary,    // Gold background when saved
  },
});

/**
 * PERFORMANCE OPTIMIZATION: Memoized EventCard
 * 
 * React.memo prevents re-rendering when props haven't changed
 * This is crucial for FlatList performance with many items
 * 
 * The component will only re-render if:
 * - event object changes (shallow comparison)
 * - onPress callback changes (should be stable with useCallback)
 * - onLike callback changes (should be stable with useCallback) 
 * - isLiked boolean changes (when user likes/unlikes)
 * 
 * Custom comparison function could be added for deep prop comparison:
 * export default React.memo(EventCard, (prevProps, nextProps) => {
 *   return prevProps.isLiked === nextProps.isLiked &&
 *          prevProps.event.id === nextProps.event.id;
 * });
 */
export default React.memo(EventCard);