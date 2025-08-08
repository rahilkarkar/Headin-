/**
 * Mock User Data for Day 7 Profile Screen Implementation
 * 
 * This file contains realistic user data for testing the profile screen
 * including user stats, posted events, and profile information
 */

export const mockCurrentUser = {
  uid: 'current_user_123',
  email: 'john.smith@email.com',
  displayName: 'John Smith',
  isGuest: false,
  bio: 'Love discovering new spots around LA! Always down for good music, great food, and meeting new people. 🎵🍕',
  profilePicture: null, // Will be replaced with actual image URLs later
  location: {
    city: 'Los Angeles',
    state: 'CA'
  },
  createdAt: new Date('2024-01-15'),
  
  // Social stats
  stats: {
    eventsPosted: 12,
    followersCount: 234,
    followingCount: 189,
    totalLikes: 456
  },
  
  // Arrays for relationships
  following: ['user_456', 'user_789', 'user_321'],
  followers: ['user_111', 'user_222', 'user_333'],
  eventsPosted: ['event_1', 'event_2', 'event_3'],
  eventsLiked: ['event_4', 'event_5', 'event_6'],
  
  // Settings and preferences
  preferences: {
    notifications: true,
    publicProfile: true,
    showLocation: true
  }
};

export const mockGuestUser = {
  uid: 'guest_user_456',
  email: null,
  displayName: 'Guest User',
  isGuest: true,
  bio: '',
  profilePicture: null,
  location: null,
  createdAt: new Date(),
  
  stats: {
    eventsPosted: 0,
    followersCount: 0,
    followingCount: 0,
    totalLikes: 0
  },
  
  following: [],
  followers: [],
  eventsPosted: [],
  eventsLiked: [],
  
  preferences: {
    notifications: false,
    publicProfile: false,
    showLocation: false
  }
};

// User's posted events for profile display
export const mockUserEvents = [
  {
    id: 'event_1',
    title: 'Rooftop Jazz Night',
    description: 'Smooth jazz under the stars with local musicians.',
    category: 'music',
    location: {
      name: 'Sky Lounge',
      city: 'Los Angeles'
    },
    startTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
    imageUrl: null,
    tags: ['jazz', 'rooftop', 'music'],
    stats: {
      likesCount: 24,
      commentsCount: 8,
      attendeesCount: 12
    },
    isActive: true,
    createdAt: new Date(Date.now() - 30 * 60 * 1000)
  },
  {
    id: 'event_2', 
    title: 'Food Truck Friday',
    description: 'The best food trucks in the city gather every Friday!',
    category: 'food',
    location: {
      name: 'Central Park Plaza',
      city: 'Los Angeles'
    },
    startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    imageUrl: null,
    tags: ['food', 'trucks', 'friday'],
    stats: {
      likesCount: 45,
      commentsCount: 12,
      attendeesCount: 67
    },
    isActive: true,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
  },
  {
    id: 'event_3',
    title: 'Beach Volleyball Tournament', 
    description: 'Join us for a friendly competition on the sand!',
    category: 'sports',
    location: {
      name: 'Manhattan Beach',
      city: 'Los Angeles'
    },
    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
    imageUrl: null,
    tags: ['volleyball', 'beach', 'sports'],
    stats: {
      likesCount: 18,
      commentsCount: 5, 
      attendeesCount: 28
    },
    isActive: true,
    createdAt: new Date(Date.now() - 60 * 60 * 1000)
  }
];

// Achievement badges for user profile
export const mockUserBadges = [
  {
    id: 'early_adopter',
    title: 'Early Adopter',
    description: 'One of the first users of Headin\'',
    icon: 'star',
    earned: true,
    earnedAt: new Date('2024-01-15')
  },
  {
    id: 'event_host',
    title: 'Event Host',
    description: 'Posted 10+ events',
    icon: 'calendar',
    earned: true,
    earnedAt: new Date('2024-03-20')
  },
  {
    id: 'social_butterfly',
    title: 'Social Butterfly',
    description: 'Has 100+ followers',
    icon: 'people',
    earned: true,
    earnedAt: new Date('2024-04-10')
  }
];

// Profile activity feed items
export const mockProfileActivity = [
  {
    id: 'activity_1',
    type: 'event_posted',
    eventTitle: 'Rooftop Jazz Night',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    likes: 24
  },
  {
    id: 'activity_2', 
    type: 'event_liked',
    eventTitle: 'Sunset Yoga Session',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    authorName: 'Alex Kim'
  },
  {
    id: 'activity_3',
    type: 'follower_gained',
    followerName: 'Emma Johnson',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000)
  }
];