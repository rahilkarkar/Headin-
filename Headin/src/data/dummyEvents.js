export const dummyEvents = [
  {
    id: '1',
    title: 'Rooftop Jazz Night',
    description: 'Smooth jazz under the stars with local musicians. Bring your friends for an unforgettable evening of music and vibes.',
    authorId: 'user1',
    authorName: 'Sarah Chen',
    authorAvatar: null,
    category: 'music',
    location: {
      name: 'Sky Lounge',
      address: '123 High Street, Downtown',
      city: 'Los Angeles',
      coordinates: {
        latitude: 34.0522,
        longitude: -118.2437
      }
    },
    startTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
    endTime: new Date(Date.now() + 5 * 60 * 60 * 1000), // 5 hours from now
    imageUrl: null,
    tags: ['jazz', 'rooftop', 'music', 'nightlife'],
    stats: {
      likesCount: 24,
      commentsCount: 8,
      attendeesCount: 12
    },
    likedBy: [],
    attendees: [],
    isActive: true,
    createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    updatedAt: new Date(Date.now() - 30 * 60 * 1000)
  },
  {
    id: '2',
    title: 'Beach Volleyball Tournament',
    description: 'Join us for a friendly competition on the sand! Teams of 4, prizes for winners. All skill levels welcome.',
    authorId: 'user2',
    authorName: 'Mike Rodriguez',
    authorAvatar: null,
    category: 'sports',
    location: {
      name: 'Manhattan Beach',
      address: 'The Strand, Manhattan Beach',
      city: 'Los Angeles',
      coordinates: {
        latitude: 33.8846,
        longitude: -118.4085
      }
    },
    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    endTime: new Date(Date.now() + 28 * 60 * 60 * 1000), // Tomorrow + 4 hours
    imageUrl: null,
    tags: ['volleyball', 'beach', 'sports', 'tournament'],
    stats: {
      likesCount: 18,
      commentsCount: 5,
      attendeesCount: 28
    },
    likedBy: [],
    attendees: [],
    isActive: true,
    createdAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
    updatedAt: new Date(Date.now() - 60 * 60 * 1000)
  },
  {
    id: '3',
    title: 'Food Truck Friday',
    description: 'The best food trucks in the city gather every Friday! Korean BBQ, Tacos, Gourmet Burgers, and more.',
    authorId: 'user3',
    authorName: 'Emma Johnson',
    authorAvatar: null,
    category: 'food',
    location: {
      name: 'Central Park Plaza',
      address: '456 Park Avenue',
      city: 'Los Angeles',
      coordinates: {
        latitude: 34.0522,
        longitude: -118.2437
      }
    },
    startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // In 3 days
    endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000), // +6 hours
    imageUrl: null,
    tags: ['food', 'trucks', 'friday', 'variety'],
    stats: {
      likesCount: 45,
      commentsCount: 12,
      attendeesCount: 67
    },
    likedBy: [],
    attendees: [],
    isActive: true,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
  },
  {
    id: '4',
    title: 'Sunset Yoga Session',
    description: 'Find your zen as the sun sets over the city. All levels welcome. Mats provided.',
    authorId: 'user4',
    authorName: 'Alex Kim',
    authorAvatar: null,
    category: 'wellness',
    location: {
      name: 'Griffith Observatory',
      address: '2800 E Observatory Rd',
      city: 'Los Angeles',
      coordinates: {
        latitude: 34.1184,
        longitude: -118.3004
      }
    },
    startTime: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours from now
    endTime: new Date(Date.now() + 7.5 * 60 * 60 * 1000), // +1.5 hours
    imageUrl: null,
    tags: ['yoga', 'sunset', 'wellness', 'meditation'],
    stats: {
      likesCount: 31,
      commentsCount: 7,
      attendeesCount: 15
    },
    likedBy: [],
    attendees: [],
    isActive: true,
    createdAt: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
    updatedAt: new Date(Date.now() - 45 * 60 * 1000)
  },
  {
    id: '5',
    title: 'Late Night Art Gallery Opening',
    description: 'Discover emerging local artists in an intimate gallery setting. Wine and light refreshments provided.',
    authorId: 'user5',
    authorName: 'Isabella Martinez',
    authorAvatar: null,
    category: 'art',
    location: {
      name: 'Modern Space Gallery',
      address: '789 Arts District',
      city: 'Los Angeles',
      coordinates: {
        latitude: 34.0407,
        longitude: -118.2358
      }
    },
    startTime: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
    endTime: new Date(Date.now() + 8 * 60 * 60 * 1000), // +4 hours
    imageUrl: null,
    tags: ['art', 'gallery', 'wine', 'culture'],
    stats: {
      likesCount: 22,
      commentsCount: 4,
      attendeesCount: 35
    },
    likedBy: [],
    attendees: [],
    isActive: true,
    createdAt: new Date(Date.now() - 20 * 60 * 1000), // 20 minutes ago
    updatedAt: new Date(Date.now() - 20 * 60 * 1000)
  }
];