import React, { createContext, useContext, useState } from 'react';

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
  const [loading, setLoading] = useState(false); // Set to false for debugging
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const signOut = async () => {
    try {
      setUser(null);
      setUserDocument(null);
      setIsAuthenticated(false);
      console.log('Mock sign out');
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
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};