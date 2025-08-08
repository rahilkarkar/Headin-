import React, { createContext, useContext, useEffect, useState } from 'react';

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
  const [authService, setAuthService] = useState(null);

  useEffect(() => {
    let unsubscribe = () => {};
    
    // Initialize Firebase auth service with error handling
    const initializeAuth = async () => {
      try {
        const { authService: service } = await import('../services/authService');
        setAuthService(service);
        
        unsubscribe = service.onAuthStateChanged(async (firebaseUser) => {
          try {
            if (firebaseUser) {
              setUser(firebaseUser);
              setIsAuthenticated(true);
              
              // Fetch user document from Firestore
              const userDocResult = await service.getUserDocument(firebaseUser.uid);
              if (userDocResult.success) {
                setUserDocument(userDocResult.data);
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
      } catch (error) {
        console.error('Firebase initialization error:', error);
        // Fallback - no auth functionality
        setLoading(false);
        setIsAuthenticated(false);
      }
    };

    initializeAuth();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const signOut = async () => {
    try {
      if (authService) {
        await authService.signOut();
      }
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
    authService, // Expose authService for login screens
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};