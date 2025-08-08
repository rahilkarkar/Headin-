import { ref, uploadBytes, getDownloadURL, deleteObject, uploadBytesResumable } from 'firebase/storage';
import { storage } from './firebaseConfig';
import { firestoreService } from './firestoreService';
import * as ImagePicker from 'expo-image-picker';

export const profileService = {
  /**
   * Test Firebase Storage connection
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async testStorageConnection() {
    try {
      // Create a simple test reference
      const testRef = ref(storage, 'test/connection.txt');
      const testData = new Blob(['test'], { type: 'text/plain' });
      
      await uploadBytes(testRef, testData);
      console.log('Firebase Storage test upload successful');
      
      return { success: true };
    } catch (error) {
      console.error('Firebase Storage test failed:', error);
      return { success: false, error: error.message };
    }
  },
  /**
   * Requests camera and media library permissions
   * @returns {Promise<{granted: boolean, error?: string}>}
   */
  async requestPermissions() {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        return {
          granted: false,
          error: 'Permission to access media library is required to upload profile pictures.'
        };
      }
      return { granted: true };
    } catch (error) {
      return {
        granted: false,
        error: 'Failed to request permissions: ' + error.message
      };
    }
  },

  /**
   * Launches image picker to select profile picture
   * @returns {Promise<{success: boolean, imageUri?: string, error?: string}>}
   */
  async pickProfileImage() {
    try {
      const permissionResult = await this.requestPermissions();
      if (!permissionResult.granted) {
        return {
          success: false,
          error: permissionResult.error
        };
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio
        quality: 0.5,   // Lower quality for smaller file size
        base64: true,   // Get base64 for easier upload
      });

      if (result.canceled) {
        return { success: false, error: 'Image selection was canceled' };
      }

      return {
        success: true,
        imageUri: result.assets[0].uri,
        base64: result.assets[0].base64
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to pick image: ' + error.message
      };
    }
  },

  /**
   * Launches camera to take profile picture
   * @returns {Promise<{success: boolean, imageUri?: string, error?: string}>}
   */
  async takeProfilePhoto() {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        return {
          success: false,
          error: 'Permission to access camera is required to take profile pictures.'
        };
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1], // Square aspect ratio
        quality: 0.5,   // Lower quality for smaller file size
        base64: true,   // Get base64 for easier upload
      });

      if (result.canceled) {
        return { success: false, error: 'Photo capture was canceled' };
      }

      return {
        success: true,
        imageUri: result.assets[0].uri,
        base64: result.assets[0].base64
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to take photo: ' + error.message
      };
    }
  },

  /**
   * Uploads profile image to Firebase Storage (Alternative method)
   * @param {string} imageUri - Local image URI
   * @param {string} userId - User ID for storage path
   * @returns {Promise<{success: boolean, downloadURL?: string, error?: string}>}
   */
  async uploadProfileImageAlternative(imageUri, userId) {
    return new Promise((resolve) => {
      const fileName = `profile_pictures/${userId}_${Date.now()}.jpg`;
      const storageRef = ref(storage, fileName);
      
      // Create XMLHttpRequest to handle the upload
      const xhr = new XMLHttpRequest();
      
      xhr.onload = async () => {
        if (xhr.status === 200) {
          try {
            const downloadURL = await getDownloadURL(storageRef);
            resolve({ success: true, downloadURL });
          } catch (error) {
            resolve({ success: false, error: `Failed to get download URL: ${error.message}` });
          }
        } else {
          resolve({ success: false, error: `Upload failed with status: ${xhr.status}` });
        }
      };
      
      xhr.onerror = () => {
        resolve({ success: false, error: 'Network error during upload' });
      };
      
      // For React Native, we need to handle file upload differently
      const formData = new FormData();
      formData.append('file', {
        uri: imageUri,
        type: 'image/jpeg',
        name: `profile_${userId}.jpg`
      });
      
      xhr.open('PUT', storageRef.toString());
      xhr.send(formData);
    });
  },

  /**
   * Uploads profile image to Firebase Storage
   * @param {string} imageUri - Local image URI
   * @param {string} userId - User ID for storage path
   * @returns {Promise<{success: boolean, downloadURL?: string, error?: string}>}
   */
  /**
   * Uploads profile image using base64 (React Native friendly)
   * @param {string} base64Data - Base64 image data
   * @param {string} userId - User ID for storage path
   * @returns {Promise<{success: boolean, downloadURL?: string, error?: string}>}
   */
  async uploadProfileImageFromBase64(base64Data, userId) {
    try {
      console.log('Starting base64 image upload for user:', userId);

      if (!base64Data || !userId) {
        throw new Error('Missing base64Data or userId');
      }

      // Convert base64 to blob
      const base64Response = await fetch(`data:image/jpeg;base64,${base64Data}`);
      const blob = await base64Response.blob();
      
      console.log('Base64 blob created, size:', blob.size, 'type:', blob.type);

      if (blob.size === 0) {
        throw new Error('Image file is empty');
      }

      // Create storage reference
      const fileName = `profile_pictures/${userId}_${Date.now()}.jpg`;
      console.log('Creating storage reference:', fileName);
      const storageRef = ref(storage, fileName);

      // Upload using simple uploadBytes method
      console.log('Starting upload to Firebase Storage...');
      const snapshot = await uploadBytes(storageRef, blob, {
        contentType: 'image/jpeg'
      });
      
      console.log('Upload completed, getting download URL...');
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('Download URL obtained:', downloadURL);

      return {
        success: true,
        downloadURL
      };
    } catch (error) {
      console.error('Base64 upload error:', error);
      return {
        success: false,
        error: `Failed to upload image: ${error.message || error.toString()}`
      };
    }
  },

  async uploadProfileImage(imageUri, userId, base64Data = null) {
    // If base64 data is provided, use the base64 method
    if (base64Data) {
      console.log('Using base64 upload method');
      return this.uploadProfileImageFromBase64(base64Data, userId);
    }

    try {
      console.log('Starting URI-based image upload for user:', userId);
      console.log('Image URI:', imageUri);

      // Validate inputs
      if (!imageUri || !userId) {
        throw new Error('Missing imageUri or userId');
      }

      // Create a proper blob from the image URI
      const response = await fetch(imageUri);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }

      // Get the blob
      const blob = await response.blob();
      console.log('Image blob created, size:', blob.size, 'type:', blob.type);

      if (blob.size === 0) {
        throw new Error('Image file is empty');
      }

      // Create storage reference
      const fileName = `profile_pictures/${userId}_${Date.now()}.jpg`;
      console.log('Creating storage reference:', fileName);
      const storageRef = ref(storage, fileName);

      // Use simple uploadBytes method for reliability
      console.log('Starting upload to Firebase Storage...');
      const snapshot = await uploadBytes(storageRef, blob, {
        contentType: 'image/jpeg'
      });
      
      console.log('Upload completed, getting download URL...');
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('Download URL obtained:', downloadURL);

      return {
        success: true,
        downloadURL
      };

    } catch (error) {
      console.error('Upload error details:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      return {
        success: false,
        error: `Failed to upload image: ${error.message || error.toString()}`
      };
    }
  },

  /**
   * Updates user profile picture in Firestore and Storage
   * @param {string} userId - User ID
   * @param {string} imageUri - Local image URI
   * @param {string|null} oldProfilePictureUrl - Previous profile picture URL to delete
   * @param {string|null} base64Data - Base64 image data (optional)
   * @returns {Promise<{success: boolean, downloadURL?: string, error?: string}>}
   */
  async updateProfilePicture(userId, imageUri, oldProfilePictureUrl = null, base64Data = null) {
    try {
      // Delete old profile picture if exists
      if (oldProfilePictureUrl) {
        try {
          const oldImageRef = ref(storage, oldProfilePictureUrl);
          await deleteObject(oldImageRef);
        } catch (deleteError) {
          // Non-fatal error - continue with upload
          console.warn('Failed to delete old profile picture:', deleteError);
        }
      }

      // Upload new profile picture (prefer base64 if available)
      const uploadResult = await this.uploadProfileImage(imageUri, userId, base64Data);
      if (!uploadResult.success) {
        return uploadResult;
      }

      // Update user document in Firestore
      const updateResult = await firestoreService.updateUser(userId, {
        profilePicture: uploadResult.downloadURL
      });

      if (!updateResult.success) {
        return {
          success: false,
          error: 'Failed to update profile in database: ' + updateResult.error
        };
      }

      return {
        success: true,
        downloadURL: uploadResult.downloadURL
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update profile picture: ' + error.message
      };
    }
  },

  /**
   * Gets user's liked events count from Firestore
   * @param {string} userId - User ID
   * @returns {Promise<{success: boolean, count?: number, error?: string}>}
   */
  async getUserLikedEventsCount(userId) {
    try {
      const userResult = await firestoreService.getUser(userId);
      if (!userResult.success) {
        return {
          success: false,
          error: userResult.error
        };
      }

      const eventsLiked = userResult.data.eventsLiked || [];
      return {
        success: true,
        count: eventsLiked.length
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get liked events count: ' + error.message
      };
    }
  },

  /**
   * Gets user's posted events count from Firestore
   * @param {string} userId - User ID
   * @returns {Promise<{success: boolean, count?: number, error?: string}>}
   */
  async getUserPostedEventsCount(userId) {
    try {
      const userResult = await firestoreService.getUser(userId);
      if (!userResult.success) {
        return {
          success: false,
          error: userResult.error
        };
      }

      // Use the stats.eventsCount if available, otherwise count eventsPosted array
      const statsCount = userResult.data.stats?.eventsCount;
      if (typeof statsCount === 'number') {
        return {
          success: true,
          count: statsCount
        };
      }

      const eventsPosted = userResult.data.eventsPosted || [];
      return {
        success: true,
        count: eventsPosted.length
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to get posted events count: ' + error.message
      };
    }
  }
};