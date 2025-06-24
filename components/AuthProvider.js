'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const { data: session, status } = useSession();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);

  // Function to refresh user data from database
  const refreshUserData = async () => {
    if (!session?.user?.gitlabUsername) return;
    
    try {
      const response = await fetch('/api/auth/refresh-session');
      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          // Update user state with fresh data from database
          setUser(prevUser => ({
            ...prevUser,
            ...data.user,
            gitlabId: session.user.gitlabId,
            gitlabUsername: session.user.gitlabUsername,
          }));
          
          // Update localStorage with fresh data
          localStorage.setItem(`user_${session.user.gitlabId}`, JSON.stringify(data.user));
          setLastRefresh(Date.now());
          
          console.log('User data refreshed:', data.user.role);
        }
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  useEffect(() => {
    if (status === 'loading') {
      setLoading(true);
      return;
    }

    if (session?.user) {
      // Check if user has completed onboarding
      const storedUserData = localStorage.getItem(`user_${session.user.gitlabId}`);
      
      if (storedUserData) {
        // User has completed onboarding
        try {
          const userData = JSON.parse(storedUserData);
          setUser({
            ...(session.user || {}),
            ...(userData || {}),
            gitlabId: session.user?.gitlabId,
            gitlabUsername: session.user?.gitlabUsername,
          });
          
          // Refresh user data from database to get latest role/info
          // But only if we haven't refreshed recently (within last 30 seconds)
          const now = Date.now();
          if (!lastRefresh || (now - lastRefresh) > 30000) {
            refreshUserData();
          }
        } catch (error) {
          console.error('Error parsing stored user data:', error);
          localStorage.removeItem(`user_${session.user.gitlabId}`);
          setUser(null);
        }
      } else {
        // User needs to complete onboarding
        setUser({
          ...(session.user || {}),
          gitlabId: session.user?.gitlabId,
          gitlabUsername: session.user?.gitlabUsername,
          needsOnboarding: true,
        });
      }
      // Always refresh user data from DB after login
      // This ensures new users get their correct role and info
      refreshUserData();
    } else {
      setUser(null);
    }
    
    setLoading(false);
  }, [session, status, lastRefresh]);

  const login = (userData) => {
    // For demo login (fallback)
    setUser(userData);
    localStorage.setItem('demo_user', JSON.stringify(userData));
  };

  const completeOnboarding = (onboardingData) => {
    if (session?.user) {
      const updatedUser = {
        ...(user || {}),
        ...(onboardingData || {}),
        needsOnboarding: false
      };
      setUser(updatedUser);
      localStorage.setItem(`user_${session.user.gitlabId}`, JSON.stringify(onboardingData));
    } else if (user?.is_demo) {
      // Handle demo user profile updates
      const updatedUser = {
        ...(user || {}),
        ...(onboardingData || {}),
      };
      setUser(updatedUser);
      localStorage.setItem('demo_user', JSON.stringify(updatedUser));
    }
  };

  const updateProfile = (profileData) => {
    // This function can be used specifically for profile updates
    completeOnboarding(profileData);
  };

  const logout = async () => {
    if (session) {
      // GitLab OAuth logout
      await signOut({ callbackUrl: '/' });
    } else {
      // Demo logout
      setUser(null);
      localStorage.removeItem('demo_user');
    }
  };

  const value = {
    user,
    login,
    logout,
    completeOnboarding,
    updateProfile,
    refreshUserData,
    loading,
    isGitLabAuth: !!session
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}