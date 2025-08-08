import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from './firebaseConfig';

export const firestoreService = {
  // ====================
  // USER OPERATIONS
  // ====================

  // Create user document (called during signup)
  async createUser(uid, userData) {
    try {
      const userRef = doc(db, 'users', uid);
      const userDoc = {
        uid,
        email: userData.email,
        displayName: userData.displayName,
        isGuest: userData.isGuest || false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        profilePicture: null,
        bio: userData.bio || '',
        location: null,
        // Social data
        eventsPosted: [],
        eventsLiked: [],
        eventsSaved: [],
        following: [],
        followers: [],
        // Stats
        stats: {
          eventsCount: 0,
          followersCount: 0,
          followingCount: 0,
        }
      };
      
      await setDoc(userRef, userDoc);
      return { success: true, data: userDoc };
    } catch (error) {
      console.error('Error creating user:', error);
      return { success: false, error: error.message };
    }
  },

  // Get user document
  async getUser(uid) {
    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        return { success: true, data: userSnap.data() };
      } else {
        return { success: false, error: 'User not found' };
      }
    } catch (error) {
      console.error('Error getting user:', error);
      return { success: false, error: error.message };
    }
  },

  // Update user document
  async updateUser(uid, updates) {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating user:', error);
      return { success: false, error: error.message };
    }
  },

  // Update user profile (specialized for profile editing)
  async updateUserProfile(uid, profileUpdates) {
    try {
      const userRef = doc(db, 'users', uid);
      
      // Validate the updates
      const allowedFields = ['displayName', 'bio', 'profilePicture'];
      const filteredUpdates = {};
      
      Object.keys(profileUpdates).forEach(key => {
        if (allowedFields.includes(key)) {
          filteredUpdates[key] = profileUpdates[key];
        }
      });
      
      // Add metadata
      filteredUpdates.updatedAt = Timestamp.now();
      
      await updateDoc(userRef, filteredUpdates);
      console.log('Profile updated successfully');
      
      return { success: true };
    } catch (error) {
      console.error('Error updating user profile:', error);
      return { success: false, error: error.message };
    }
  },

  // Get all users (for social features)
  async getUsers(limitCount = 100) {
    try {
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const users = [];
      
      querySnapshot.forEach((doc) => {
        users.push({ uid: doc.id, ...doc.data() });
      });
      
      return { success: true, data: users };
    } catch (error) {
      console.error('Error getting users:', error);
      return { success: false, error: error.message };
    }
  },

  // ====================
  // EVENT OPERATIONS
  // ====================

  // Create event
  async createEvent(eventData) {
    try {
      const eventsRef = collection(db, 'events');
      const eventDoc = {
        ...eventData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        // Stats
        stats: {
          likesCount: 0,
          commentsCount: 0,
          attendeesCount: 0,
        },
        // Arrays
        likedBy: [],
        attendees: [],
        // Status
        isActive: true,
      };
      
      const docRef = await addDoc(eventsRef, eventDoc);
      
      // Update user's eventsPosted array and increment events count
      const userResult = await this.getUser(eventData.authorId);
      const currentEventsCount = userResult.success ? (userResult.data.stats?.eventsCount || 0) : 0;
      
      await this.updateUser(eventData.authorId, {
        eventsPosted: arrayUnion(docRef.id),
        'stats.eventsCount': currentEventsCount + 1,
      });

      // Send notifications to followers (async, don't wait)
      const createdEvent = { id: docRef.id, ...eventDoc };
      this.notifyFriendsOfNewEvent(eventData.authorId, createdEvent).catch(error => {
        console.error('Failed to send event notifications:', error);
      });
      
      return { success: true, data: createdEvent };
    } catch (error) {
      console.error('Error creating event:', error);
      return { success: false, error: error.message };
    }
  },

  // Get events (with filters)
  async getEvents(filters = {}) {
    try {
      let q = collection(db, 'events');
      
      // Simplified query to avoid index requirements
      // Order by createdAt desc and filter in-memory for now
      q = query(q, orderBy('createdAt', 'desc'));
      
      if (filters.limit) {
        q = query(q, limit(filters.limit || 20));
      }
      
      const querySnapshot = await getDocs(q);
      let events = [];
      
      querySnapshot.forEach((doc) => {
        const eventData = { id: doc.id, ...doc.data() };
        
        // Apply filters in-memory to avoid index requirements
        let includeEvent = true;
        
        // Filter by isActive (default to true if not specified)
        if (eventData.isActive === false) {
          includeEvent = false;
        }
        
        // Filter by authorId if specified
        if (filters.authorId && eventData.authorId !== filters.authorId) {
          includeEvent = false;
        }
        
        // Filter by category if specified
        if (filters.category && eventData.category !== filters.category) {
          includeEvent = false;
        }
        
        // Filter by location if specified
        if (filters.location && eventData.location?.city !== filters.location) {
          includeEvent = false;
        }
        
        if (includeEvent) {
          events.push(eventData);
        }
      });
      
      console.log(`Loaded ${events.length} events from Firestore`);
      return { success: true, data: events };
    } catch (error) {
      console.error('Error getting events:', error);
      return { success: false, error: error.message };
    }
  },

  // Get single event
  async getEvent(eventId) {
    try {
      const eventRef = doc(db, 'events', eventId);
      const eventSnap = await getDoc(eventRef);
      
      if (eventSnap.exists()) {
        return { success: true, data: { id: eventSnap.id, ...eventSnap.data() } };
      } else {
        return { success: false, error: 'Event not found' };
      }
    } catch (error) {
      console.error('Error getting event:', error);
      return { success: false, error: error.message };
    }
  },

  // Save/Unsave event (bookmark functionality)
  async toggleEventSave(eventId, userId) {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        return { success: false, error: 'User not found' };
      }
      
      const userData = userSnap.data();
      const savedEvents = userData.eventsSaved || [];
      const isSaved = savedEvents.includes(eventId);
      
      if (isSaved) {
        // Unsave
        await updateDoc(userRef, {
          eventsSaved: arrayRemove(eventId),
          updatedAt: Timestamp.now(),
        });
        
        return { success: true, isSaved: false };
      } else {
        // Save
        await updateDoc(userRef, {
          eventsSaved: arrayUnion(eventId),
          updatedAt: Timestamp.now(),
        });
        
        return { success: true, isSaved: true };
      }
    } catch (error) {
      console.error('Error toggling event save:', error);
      return { success: false, error: error.message };
    }
  },

  // Get user's saved events
  async getSavedEvents(userId) {
    try {
      const userResult = await this.getUser(userId);
      if (!userResult.success) {
        return { success: false, error: 'User not found' };
      }
      
      const savedEventIds = userResult.data.eventsSaved || [];
      if (savedEventIds.length === 0) {
        return { success: true, data: [] };
      }
      
      // Get saved event documents (batch them in groups of 10 due to Firestore limit)
      const savedEvents = [];
      for (let i = 0; i < savedEventIds.length; i += 10) {
        const batch = savedEventIds.slice(i, i + 10);
        const batchPromises = batch.map(id => this.getEvent(id));
        const batchResults = await Promise.all(batchPromises);
        
        batchResults.forEach(result => {
          if (result.success) {
            savedEvents.push(result.data);
          }
        });
      }
      
      return { success: true, data: savedEvents };
    } catch (error) {
      console.error('Error getting saved events:', error);
      return { success: false, error: error.message };
    }
  },

  // Like/Unlike event
  async toggleEventLike(eventId, userId) {
    try {
      const eventRef = doc(db, 'events', eventId);
      const eventSnap = await getDoc(eventRef);
      
      if (!eventSnap.exists()) {
        return { success: false, error: 'Event not found' };
      }
      
      const eventData = eventSnap.data();
      const isLiked = eventData.likedBy?.includes(userId);
      
      if (isLiked) {
        // Unlike
        await updateDoc(eventRef, {
          likedBy: arrayRemove(userId),
          'stats.likesCount': Math.max(0, (eventData.stats?.likesCount || 0) - 1),
          updatedAt: Timestamp.now(),
        });
        
        // Remove from user's liked events
        await this.updateUser(userId, {
          eventsLiked: arrayRemove(eventId),
        });
        
        return { success: true, isLiked: false };
      } else {
        // Like
        await updateDoc(eventRef, {
          likedBy: arrayUnion(userId),
          'stats.likesCount': (eventData.stats?.likesCount || 0) + 1,
          updatedAt: Timestamp.now(),
        });
        
        // Add to user's liked events
        await this.updateUser(userId, {
          eventsLiked: arrayUnion(eventId),
        });
        
        return { success: true, isLiked: true };
      }
    } catch (error) {
      console.error('Error toggling event like:', error);
      return { success: false, error: error.message };
    }
  },

  // ====================
  // COMMENT OPERATIONS
  // ====================

  // Add comment to event
  async addComment(eventId, userId, commentText) {
    try {
      const commentsRef = collection(db, 'events', eventId, 'comments');
      const commentDoc = {
        userId,
        text: commentText,
        createdAt: Timestamp.now(),
      };
      
      const docRef = await addDoc(commentsRef, commentDoc);
      
      // Update event comments count
      const eventRef = doc(db, 'events', eventId);
      const eventSnap = await getDoc(eventRef);
      const currentCount = eventSnap.data()?.stats?.commentsCount || 0;
      
      await updateDoc(eventRef, {
        'stats.commentsCount': currentCount + 1,
        updatedAt: Timestamp.now(),
      });

      // Send notification to event author (async, don't wait)
      this.notifyEventAuthorOfComment(eventId, userId, commentText).catch(error => {
        console.error('Failed to send comment notification:', error);
      });
      
      return { success: true, data: { id: docRef.id, ...commentDoc } };
    } catch (error) {
      console.error('Error adding comment:', error);
      return { success: false, error: error.message };
    }
  },

  // Get comments for event
  async getComments(eventId, limitCount = 50) {
    try {
      const commentsRef = collection(db, 'events', eventId, 'comments');
      const q = query(commentsRef, orderBy('createdAt', 'desc'), limit(limitCount));
      
      const querySnapshot = await getDocs(q);
      const comments = [];
      
      querySnapshot.forEach((doc) => {
        comments.push({ id: doc.id, ...doc.data() });
      });
      
      return { success: true, data: comments };
    } catch (error) {
      console.error('Error getting comments:', error);
      return { success: false, error: error.message };
    }
  },

  // ====================
  // FOLLOW OPERATIONS
  // ====================

  // Follow/Unfollow user
  async followUser(currentUserId, targetUserId) {
    try {
      // Get both user documents
      const [currentUserResult, targetUserResult] = await Promise.all([
        this.getUser(currentUserId),
        this.getUser(targetUserId)
      ]);
      
      if (!currentUserResult.success || !targetUserResult.success) {
        return { success: false, error: 'User not found' };
      }
      
      const currentUser = currentUserResult.data;
      const targetUser = targetUserResult.data;
      
      const isFollowing = currentUser.following?.includes(targetUserId);
      
      if (isFollowing) {
        // Unfollow
        await Promise.all([
          // Remove from current user's following list
          this.updateUser(currentUserId, {
            following: arrayRemove(targetUserId),
            'stats.followingCount': Math.max(0, (currentUser.stats?.followingCount || 0) - 1)
          }),
          // Remove from target user's followers list
          this.updateUser(targetUserId, {
            followers: arrayRemove(currentUserId),
            'stats.followersCount': Math.max(0, (targetUser.stats?.followersCount || 0) - 1)
          })
        ]);
        
        return { success: true, isFollowing: false };
      } else {
        // Follow
        await Promise.all([
          // Add to current user's following list
          this.updateUser(currentUserId, {
            following: arrayUnion(targetUserId),
            'stats.followingCount': (currentUser.stats?.followingCount || 0) + 1
          }),
          // Add to target user's followers list
          this.updateUser(targetUserId, {
            followers: arrayUnion(currentUserId),
            'stats.followersCount': (targetUser.stats?.followersCount || 0) + 1
          })
        ]);
        
        return { success: true, isFollowing: true };
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      return { success: false, error: error.message };
    }
  },

  // Get user's followers
  async getFollowers(userId, limit = 50) {
    try {
      const userResult = await this.getUser(userId);
      if (!userResult.success) {
        return { success: false, error: 'User not found' };
      }
      
      const followerIds = userResult.data.followers || [];
      if (followerIds.length === 0) {
        return { success: true, data: [] };
      }
      
      // Get follower user documents (batch them in groups of 10 due to Firestore limit)
      const followers = [];
      for (let i = 0; i < followerIds.length; i += 10) {
        const batch = followerIds.slice(i, i + 10);
        const batchPromises = batch.map(id => this.getUser(id));
        const batchResults = await Promise.all(batchPromises);
        
        batchResults.forEach(result => {
          if (result.success) {
            followers.push(result.data);
          }
        });
      }
      
      return { success: true, data: followers };
    } catch (error) {
      console.error('Error getting followers:', error);
      return { success: false, error: error.message };
    }
  },

  // Get user's following
  async getFollowing(userId, limit = 50) {
    try {
      const userResult = await this.getUser(userId);
      if (!userResult.success) {
        return { success: false, error: 'User not found' };
      }
      
      const followingIds = userResult.data.following || [];
      if (followingIds.length === 0) {
        return { success: true, data: [] };
      }
      
      // Get following user documents (batch them in groups of 10 due to Firestore limit)
      const following = [];
      for (let i = 0; i < followingIds.length; i += 10) {
        const batch = followingIds.slice(i, i + 10);
        const batchPromises = batch.map(id => this.getUser(id));
        const batchResults = await Promise.all(batchPromises);
        
        batchResults.forEach(result => {
          if (result.success) {
            following.push(result.data);
          }
        });
      }
      
      return { success: true, data: following };
    } catch (error) {
      console.error('Error getting following:', error);
      return { success: false, error: error.message };
    }
  },

  // Search users by display name or email
  async searchUsers(searchTerm, limit = 20) {
    try {
      const usersRef = collection(db, 'users');
      
      // Simple search by display name (Firestore doesn't have full-text search)
      // For production, consider using Algolia or similar for better search
      const q = query(
        usersRef,
        where('displayName', '>=', searchTerm),
        where('displayName', '<=', searchTerm + '\uf8ff'),
        limit(limit)
      );
      
      const querySnapshot = await getDocs(q);
      const users = [];
      
      querySnapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() });
      });
      
      return { success: true, data: users };
    } catch (error) {
      console.error('Error searching users:', error);
      return { success: false, error: error.message };
    }
  },

  // ====================
  // NOTIFICATION OPERATIONS
  // ====================

  // Create a notification
  async createNotification(userId, notificationData) {
    try {
      const notificationsRef = collection(db, 'users', userId, 'notifications');
      const notificationDoc = {
        ...notificationData,
        read: false,
        createdAt: Timestamp.now(),
      };
      
      const docRef = await addDoc(notificationsRef, notificationDoc);
      return { success: true, data: { id: docRef.id, ...notificationDoc } };
    } catch (error) {
      console.error('Error creating notification:', error);
      return { success: false, error: error.message };
    }
  },

  // Get user notifications
  async getUserNotifications(userId, limitCount = 50) {
    try {
      const notificationsRef = collection(db, 'users', userId, 'notifications');
      const q = query(
        notificationsRef,
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const notifications = [];
      
      querySnapshot.forEach((doc) => {
        notifications.push({ id: doc.id, ...doc.data() });
      });
      
      return { success: true, data: notifications };
    } catch (error) {
      console.error('Error getting notifications:', error);
      return { success: false, error: error.message };
    }
  },

  // Mark notifications as read
  async markNotificationsAsRead(userId, notificationIds) {
    try {
      const batch = [];
      notificationIds.forEach(notificationId => {
        const notificationRef = doc(db, 'users', userId, 'notifications', notificationId);
        batch.push(updateDoc(notificationRef, { read: true }));
      });
      
      await Promise.all(batch);
      return { success: true };
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      return { success: false, error: error.message };
    }
  },

  // Send notification when friend posts an event
  async notifyFriendsOfNewEvent(authorId, eventData) {
    try {
      // Get author's followers
      const userResult = await this.getUser(authorId);
      if (!userResult.success || !userResult.data.followers) {
        return { success: true }; // No followers to notify
      }
      
      const followers = userResult.data.followers;
      const authorName = userResult.data.displayName || 'A friend';
      
      // Create notifications for each follower
      const notificationPromises = followers.map(followerId => 
        this.createNotification(followerId, {
          type: 'friend_post',
          title: 'New Event Posted',
          message: `${authorName} posted a new event: ${eventData.title}`,
          authorId: authorId,
          eventId: eventData.id,
          eventTitle: eventData.title,
        })
      );
      
      await Promise.all(notificationPromises);
      console.log(`Sent event notifications to ${followers.length} followers`);
      return { success: true };
    } catch (error) {
      console.error('Error notifying friends of new event:', error);
      return { success: false, error: error.message };
    }
  },

  // Send notification when someone comments on an event
  async notifyEventAuthorOfComment(eventId, commentAuthorId, commentText) {
    try {
      // Get event details
      const eventResult = await this.getEvent(eventId);
      if (!eventResult.success) {
        return { success: false, error: 'Event not found' };
      }
      
      const event = eventResult.data;
      const eventAuthorId = event.authorId;
      
      // For testing: Allow notifications even on own events (remove this check for production)
      // In production, uncomment this to prevent self-notifications:
      // if (eventAuthorId === commentAuthorId) {
      //   return { success: true };
      // }
      
      // Get comment author info
      const commentAuthorResult = await this.getUser(commentAuthorId);
      const commentAuthorName = commentAuthorResult.success 
        ? (commentAuthorResult.data.displayName || 'Someone')
        : 'Someone';
      
      // Create notification
      await this.createNotification(eventAuthorId, {
        type: 'comment',
        title: 'New Comment',
        message: `${commentAuthorName} commented on your event: ${event.title}`,
        authorId: commentAuthorId,
        eventId: eventId,
        eventTitle: event.title,
      });
      
      console.log(`Sent comment notification to event author`);
      return { success: true };
    } catch (error) {
      console.error('Error notifying event author of comment:', error);
      return { success: false, error: error.message };
    }
  },

  // ====================
  // REAL-TIME LISTENERS
  // ====================

  // Listen to events feed
  subscribeToEvents(callback, filters = {}) {
    try {
      let q = collection(db, 'events');
      
      // Apply filters
      const conditions = [where('isActive', '==', true)];
      
      if (filters.authorId) {
        conditions.push(where('authorId', '==', filters.authorId));
      }
      
      // Build query
      q = query(q, ...conditions, orderBy('createdAt', 'desc'), limit(20));
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const events = [];
        querySnapshot.forEach((doc) => {
          events.push({ id: doc.id, ...doc.data() });
        });
        callback(events);
      }, (error) => {
        console.error('Error in events listener:', error);
        callback([]);
      });
      
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up events listener:', error);
      return () => {};
    }
  },
};