import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/authService';

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
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let unsubscribe = () => {};

    // Initialize Firebase auth listener
    const initializeAuth = async () => {
      try {
        console.log('Initializing Firebase auth...');
        
        unsubscribe = authService.onAuthStateChanged(async (firebaseUser) => {
          console.log('Auth state changed:', firebaseUser ? 'User logged in' : 'User logged out');
          
          try {
            if (firebaseUser) {
              setUser(firebaseUser);
              setIsAuthenticated(true);
              
              // Fetch user document from Firestore
              const userDocResult = await authService.getUserDocument(firebaseUser.uid);
              if (userDocResult.success) {
                setUserDocument(userDocResult.data);
                console.log('User document loaded:', userDocResult.data.displayName);
              }
            } else {
              setUser(null);
              setUserDocument(null);
              setIsAuthenticated(false);
            }
          } catch (error) {
            console.error('Auth state change error:', error);
            setUser(null);
            setUserDocument(null);
            setIsAuthenticated(false);
          } finally {
            setLoading(false);
          }
        });
        
        console.log('Firebase auth listener initialized');
      } catch (error) {
        console.error('Firebase initialization error:', error);
        // Fallback - no auth functionality
        setLoading(false);
        setIsAuthenticated(false);
      }
    };

    initializeAuth();

    return () => {
      console.log('Cleaning up Firebase auth listener');
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const signOut = async () => {
    try {
      console.log('Signing out...');
      await authService.signOut();
      setUser(null);
      setUserDocument(null);
      setIsAuthenticated(false);
      console.log('Sign out successful');
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
    authService, // Expose authService for login screens
  };

  console.log('Auth context state:', { 
    isAuthenticated, 
    loading, 
    userEmail: user?.email,
    displayName: userDocument?.displayName 
  });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};