import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../constants/theme';
import { useAuth } from '../../contexts/AuthContext-firebase';
import { firestoreService } from '../../services/firestoreService';
import { profileService } from '../../services/profileService';

export default function EditProfileScreen() {
  const { user, userDocument, refreshUserDocument } = useAuth();
  const navigation = useNavigation();

  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    profilePicture: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, [userDocument]);

  const loadUserProfile = async () => {
    try {
      if (userDocument) {
        setFormData({
          displayName: userDocument.displayName || '',
          bio: userDocument.bio || '',
          profilePicture: userDocument.profilePicture || null,
        });
      } else if (user) {
        // Fallback to user data if userDocument not available
        setFormData({
          displayName: user.displayName || '',
          bio: '',
          profilePicture: null,
        });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImagePress = () => {
    Alert.alert(
      'Update Profile Picture',
      'Choose an option to update your profile picture',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Take Photo', 
          onPress: () => handleTakePhoto()
        },
        { 
          text: 'Choose from Gallery', 
          onPress: () => handleChooseFromGallery()
        }
      ]
    );
  };

  const handleTakePhoto = async () => {
    if (!user?.uid) return;

    setUploadingImage(true);
    try {
      const result = await profileService.takeProfilePhoto();
      if (result.success) {
        const uploadResult = await profileService.updateProfilePicture(
          user.uid,
          result.imageUri,
          formData.profilePicture,
          result.base64
        );
        
        if (uploadResult.success) {
          setFormData(prev => ({
            ...prev,
            profilePicture: uploadResult.downloadURL
          }));
        } else {
          Alert.alert('Error', uploadResult.error || 'Failed to update profile picture');
        }
      } else if (result.error !== 'Photo capture was canceled') {
        Alert.alert('Error', result.error || 'Failed to take photo');
      }
    } catch (error) {
      console.error('Camera upload error:', error);
      Alert.alert('Error', 'Failed to update profile picture');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleChooseFromGallery = async () => {
    if (!user?.uid) return;

    setUploadingImage(true);
    try {
      const result = await profileService.pickProfileImage();
      if (result.success) {
        const uploadResult = await profileService.updateProfilePicture(
          user.uid,
          result.imageUri,
          formData.profilePicture,
          result.base64
        );
        
        if (uploadResult.success) {
          setFormData(prev => ({
            ...prev,
            profilePicture: uploadResult.downloadURL
          }));
        } else {
          Alert.alert('Error', uploadResult.error || 'Failed to update profile picture');
        }
      } else if (result.error !== 'Image selection was canceled') {
        Alert.alert('Error', result.error || 'Failed to pick image');
      }
    } catch (error) {
      console.error('Gallery upload error:', error);
      Alert.alert('Error', 'Failed to update profile picture');
    } finally {
      setUploadingImage(false);
    }
  };

  const validateForm = () => {
    if (!formData.displayName.trim()) {
      Alert.alert('Error', 'Display name is required');
      return false;
    }
    
    if (formData.displayName.trim().length < 2) {
      Alert.alert('Error', 'Display name must be at least 2 characters');
      return false;
    }
    
    if (formData.displayName.trim().length > 50) {
      Alert.alert('Error', 'Display name must be less than 50 characters');
      return false;
    }
    
    if (formData.bio.length > 500) {
      Alert.alert('Error', 'Bio must be less than 500 characters');
      return false;
    }
    
    return true;
  };

  const handleSave = async () => {
    if (!user?.uid) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    if (!validateForm()) return;

    setSaving(true);
    try {
      const updates = {
        displayName: formData.displayName.trim(),
        bio: formData.bio.trim(),
      };

      // Only update profile picture if it has changed
      if (formData.profilePicture !== (userDocument?.profilePicture || null)) {
        updates.profilePicture = formData.profilePicture;
      }

      const result = await firestoreService.updateUserProfile(user.uid, updates);
      
      if (result.success) {
        Alert.alert(
          'Success! ✅',
          'Your profile has been updated successfully.',
          [
            {
              text: 'Done',
              onPress: () => {
                refreshUserDocument?.();
                navigation.goBack();
              }
            }
          ],
          { cancelable: false }
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const hasUnsavedChanges = () => {
    if (!userDocument) return false;
    return (
      formData.displayName !== (userDocument.displayName || '') ||
      formData.bio !== (userDocument.bio || '') ||
      formData.profilePicture !== (userDocument.profilePicture || null)
    );
  };

  const handleCancel = () => {
    // Only show confirmation if there are unsaved changes
    if (!hasUnsavedChanges()) {
      navigation.goBack();
      return;
    }

    Alert.alert(
      'Discard Changes?',
      'You have unsaved changes that will be lost. Are you sure you want to continue?',
      [
        { 
          text: 'Keep Editing', 
          style: 'cancel',
          onPress: () => console.log('User chose to keep editing')
        },
        { 
          text: 'Discard Changes', 
          style: 'destructive', 
          onPress: () => {
            console.log('User discarded changes');
            navigation.goBack();
          }
        }
      ],
      { cancelable: true }
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

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
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <Ionicons name="close" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Edit Profile</Text>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={theme.colors.background} />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Profile Picture Section */}
        <View style={styles.profilePictureSection}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={handleImagePress}
            disabled={uploadingImage}
          >
            {uploadingImage ? (
              <ActivityIndicator size="large" color={theme.colors.primary} />
            ) : formData.profilePicture ? (
              <Image source={{ uri: formData.profilePicture }} style={styles.profileImage} />
            ) : (
              <Ionicons name="person" size={50} color={theme.colors.primary} />
            )}
            
            <View style={styles.cameraOverlay}>
              <Ionicons name="camera" size={16} color={theme.colors.background} />
            </View>
          </TouchableOpacity>
          <Text style={styles.changePhotoText}>Tap to change photo</Text>
        </View>

        {/* Form Fields */}
        <View style={styles.formSection}>
          {/* Display Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Display Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your display name"
              placeholderTextColor={theme.colors.textMuted}
              value={formData.displayName}
              onChangeText={(text) => handleInputChange('displayName', text)}
              maxLength={50}
              autoCapitalize="words"
            />
            <Text style={styles.helperText}>
              {formData.displayName.length}/50 characters
            </Text>
          </View>

          {/* Bio */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.bioInput]}
              placeholder="Tell others about yourself..."
              placeholderTextColor={theme.colors.textMuted}
              value={formData.bio}
              onChangeText={(text) => handleInputChange('bio', text)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
            />
            <Text style={styles.helperText}>
              {formData.bio.length}/500 characters
            </Text>
          </View>

          {/* Account Info (Read-only) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.readOnlyInput}>
              <Text style={styles.readOnlyText}>{user?.email}</Text>
            </View>
            <Text style={styles.helperText}>
              Email cannot be changed
            </Text>
          </View>
        </View>
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  cancelButton: {
    padding: theme.spacing.sm,
  },
  title: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text,
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: theme.colors.textMuted,
  },
  saveButtonText: {
    color: theme.colors.background,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  profilePictureSection: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
    ...theme.shadows.md,
    position: 'relative',
  },
  profileImage: {
    width: 116,
    height: 116,
    borderRadius: 58,
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.background,
  },
  changePhotoText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  formSection: {
    padding: theme.spacing.lg,
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
  bioInput: {
    minHeight: 100,
    paddingTop: theme.spacing.md,
  },
  readOnlyInput: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    minHeight: 50,
    justifyContent: 'center',
  },
  readOnlyText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textMuted,
  },
  helperText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xs,
  },
});