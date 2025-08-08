import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { theme } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext-firebase';
import { firestoreService } from '../../services/firestoreService';

export default function CommentsScreen() {
  const { user } = useAuth();
  const route = useRoute();
  const navigation = useNavigation();
  const { eventId, eventTitle } = route.params;
  const flatListRef = useRef(null);

  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      title: `Comments - ${eventTitle}`,
    });
    loadComments();
  }, [eventId, eventTitle]);

  const loadComments = async () => {
    try {
      console.log('Loading comments for event:', eventId);
      const result = await firestoreService.getComments(eventId, 50);
      
      if (result.success) {
        // Get user info for each comment
        const commentsWithUserInfo = await Promise.all(
          result.data.map(async (comment) => {
            try {
              const userResult = await firestoreService.getUser(comment.userId);
              return {
                ...comment,
                userInfo: userResult.success ? userResult.data : {
                  displayName: 'Unknown User',
                  profilePicture: null
                }
              };
            } catch (error) {
              console.error('Error loading user info for comment:', error);
              return {
                ...comment,
                userInfo: {
                  displayName: 'Unknown User',
                  profilePicture: null
                }
              };
            }
          })
        );

        setComments(commentsWithUserInfo);
        console.log(`Loaded ${commentsWithUserInfo.length} comments`);
      } else {
        console.error('Failed to load comments:', result.error);
        setComments([]);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
      setComments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadComments();
  }, [eventId]);

  const handleSubmitComment = async () => {
    if (!user?.uid) {
      Alert.alert('Error', 'Please log in to comment');
      return;
    }

    if (!commentText.trim()) {
      Alert.alert('Error', 'Please enter a comment');
      return;
    }

    setSubmitting(true);
    try {
      const result = await firestoreService.addComment(eventId, user.uid, commentText.trim());
      
      if (result.success) {
        // Add the new comment to the top of the list with user info
        const newComment = {
          ...result.data,
          userInfo: {
            displayName: user.displayName || 'You',
            profilePicture: user.profilePicture || null
          }
        };
        
        setComments(prevComments => [newComment, ...prevComments]);
        setCommentText('');
        
        // Scroll to top to show the new comment
        setTimeout(() => {
          flatListRef.current?.scrollToOffset({ animated: true, offset: 0 });
        }, 100);
        
        console.log('Comment added successfully - comment count should now be updated in Firestore');
        
        // Optional: Show a subtle success feedback
        // (Could add a Toast notification here in the future)
      } else {
        Alert.alert('Error', result.error || 'Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', 'Failed to add comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCommentTime = (timestamp) => {
    const commentDate = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - commentDate) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 24 * 60) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours}h ago`;
    } else if (diffInMinutes < 7 * 24 * 60) {
      const days = Math.floor(diffInMinutes / (24 * 60));
      return `${days}d ago`;
    } else {
      return commentDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: commentDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const renderComment = useCallback(({ item: comment }) => (
    <View style={styles.commentItem}>
      <View style={styles.commentHeader}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            {comment.userInfo?.profilePicture ? (
              <Image source={{ uri: comment.userInfo.profilePicture }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person" size={20} color={theme.colors.primary} />
            )}
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>
              {comment.userInfo?.displayName || 'Unknown User'}
            </Text>
            <Text style={styles.commentTime}>
              {formatCommentTime(comment.createdAt)}
            </Text>
          </View>
        </View>
      </View>
      <Text style={styles.commentText}>{comment.text}</Text>
    </View>
  ), []);

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="chatbubble-outline" size={64} color={theme.colors.textMuted} />
      <Text style={styles.emptyTitle}>No comments yet</Text>
      <Text style={styles.emptySubtitle}>
        Be the first to share your thoughts about this event
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Comments</Text>
      <Text style={styles.headerSubtitle}>
        {comments.length} comment{comments.length !== 1 ? 's' : ''}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading comments...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ref={flatListRef}
        data={comments}
        keyExtractor={(item) => item.id}
        renderItem={renderComment}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        contentContainerStyle={comments.length === 0 ? styles.emptyListContent : styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Comment Input */}
      <View style={styles.inputContainer}>
        <View style={styles.currentUserAvatar}>
          {user?.profilePicture ? (
            <Image source={{ uri: user.profilePicture }} style={styles.avatarImage} />
          ) : (
            <Ionicons name="person" size={16} color={theme.colors.primary} />
          )}
        </View>
        <TextInput
          style={styles.commentInput}
          placeholder="Add a comment..."
          placeholderTextColor={theme.colors.textMuted}
          value={commentText}
          onChangeText={setCommentText}
          multiline
          maxLength={500}
          editable={!submitting}
        />
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!commentText.trim() || submitting) && styles.submitButtonDisabled
          ]}
          onPress={handleSubmitComment}
          disabled={!commentText.trim() || submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color={theme.colors.background} />
          ) : (
            <Ionicons name="send" size={18} color={theme.colors.background} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    paddingBottom: theme.spacing.md,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  header: {
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
    textShadowColor: theme.colors.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  headerSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  commentItem: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  commentHeader: {
    marginBottom: theme.spacing.sm,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  avatarImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
  },
  commentTime: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  commentText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text,
    lineHeight: theme.typography.lineHeight.relaxed * theme.typography.fontSize.base,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    gap: theme.spacing.sm,
  },
  currentUserAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentInput: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text,
    maxHeight: 100,
    minHeight: 40,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: theme.colors.textMuted,
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