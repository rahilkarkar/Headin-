import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAvWXrJ0d7VAQFcgTd8ddT_lQOebpTFd7w",
  authDomain: "headin-5bdea.firebaseapp.com",
  projectId: "headin-5bdea",
  storageBucket: "headin-5bdea.firebasestorage.app",
  messagingSenderId: "748105454179",
  appId: "1:748105454179:web:8fe590c0e91ec5f7939e56"
};

// Initialize Firebase only if it hasn't been initialized
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize Firebase Auth with AsyncStorage persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Firestore and Storage
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
export default app;