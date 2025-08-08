import React, { createContext, useContext, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userDocument, setUserDocument] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const mockAuthService = {
    async signUp(email, password, displayName) {
      try {
        // Validate input
        if (!displayName || displayName.length < 2) {
          return { success: false, error: 'Display name must be at least 2 characters long' };
        }
        
        if (!email || !email.includes('@') || !email.includes('.')) {
          return { success: false, error: 'Please enter a valid email address' };
        }
        
        if (!password || password.length < 6) {
          return { success: false, error: 'Password must be at least 6 characters long' };
        }
        
        // Check if user already exists (mock check)
        const existingUser = await AsyncStorage.getItem(`user_${email}`);
        if (existingUser) {
          return { success: false, error: 'An account with this email already exists' };
        }
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Create mock user
        const mockUser = {
          uid: 'mock-user-' + Date.now(),
          email,
          displayName
        };
        
        // Store user data
        await AsyncStorage.setItem(`user_${email}`, JSON.stringify({
          email,
          password,
          displayName,
          uid: mockUser.uid
        }));
        
        await AsyncStorage.setItem('currentUser', JSON.stringify(mockUser));
        
        setUser(mockUser);
        setUserDocument({ displayName, email, isGuest: false });
        setIsAuthenticated(true);
        
        return { success: true, user: mockUser };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },

    async signIn(email, password) {
      try {
        // Validate input
        if (!email || !email.includes('@')) {
          return { success: false, error: 'Please enter a valid email address' };
        }
        
        if (!password || password.length < 1) {
          return { success: false, error: 'Please enter your password' };
        }
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Check if user exists and password matches
        const userData = await AsyncStorage.getItem(`user_${email}`);
        if (!userData) {
          return { success: false, error: 'No account found with this email address' };
        }
        
        const user = JSON.parse(userData);
        if (user.password !== password) {
          return { success: false, error: 'Incorrect password' };
        }
        
        // Create session
        const mockUser = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName
        };
        
        await AsyncStorage.setItem('currentUser', JSON.stringify(mockUser));
        setUser(mockUser);
        setUserDocument({ displayName: user.displayName, email: user.email, isGuest: false });
        setIsAuthenticated(true);
        
        return { success: true, user: mockUser };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },

    async signInAsGuest() {
      try {
        const guestUser = {
          uid: 'guest-' + Date.now(),
          email: null,
          displayName: 'Guest User'
        };
        
        setUser(guestUser);
        setUserDocument({ displayName: 'Guest User', email: null, isGuest: true });
        setIsAuthenticated(true);
        
        return { success: true, user: guestUser };
      } catch (error) {
        return { success: false, error: error.message };
      }
    },

    async resetPassword(email) {
      try {
        if (!email || !email.includes('@')) {
          return { success: false, error: 'Please enter a valid email address' };
        }
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if user exists
        const userData = await AsyncStorage.getItem(`user_${email}`);
        if (!userData) {
          return { success: false, error: 'No account found with this email address' };
        }
        
        return { success: true, message: 'Password reset link sent to your email' };
      } catch (error) {
        return { success: false, error: error.message };
      }
    }
  };

  const signOut = async () => {
    try {
      await AsyncStorage.removeItem('mockUser');
      setUser(null);
      setUserDocument(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const value = {
    user,
    userDocument,
    loading,
    isAuthenticated,
    signOut,
    authService: mockAuthService,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};