'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';

const AuthContext = createContext();
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function AuthProvider({ children }) {
  const { data: session, status } = useSession();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Function to refresh user data from database - CONTROLLED REFRESH
  const refreshUserData = useCallback(async () => {
    if (!session?.user?.gitlabUsername) return;
    
    // Check if we've refreshed recently (increased interval to prevent excessive calls)
    const now = Date.now();
    if (lastRefresh && (now - lastRefresh) < REFRESH_INTERVAL) {
      return; // Skip if refreshed within the last 5 minutes
    }
    
    try {
      const response = await fetch('/api/auth/refresh-session');
      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          // Update user state with fresh data from database
          setUser(prevUser => ({
            ...prevUser,
            ...data.user,
            gitlabId: session?.user?.gitlabId,
            gitlabUsername: session?.user?.gitlabUsername,
          }));
          
          // Update localStorage with fresh data
          if (session?.user?.gitlabId) {
            localStorage.setItem(`user_${session.user.gitlabId}`, JSON.stringify(data.user));
          }
          setLastRefresh(now);
        }
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  }, [session?.user?.gitlabUsername, session?.user?.gitlabId, lastRefresh]);

  useEffect(() => {
    if (!isClient || status === 'loading') {
      setLoading(true);
      return;
    }

    if (session?.user) {
      // Check if user has completed onboarding
      const storedUserData = localStorage.getItem(`user_${session.user.gitlabId}`);
      
      if (storedUserData) {
        try {
          const userData = JSON.parse(storedUserData);
          setUser({
            ...(session.user || {}),
            ...(userData || {}),
            gitlabId: session.user?.gitlabId,
            gitlabUsername: session.user?.gitlabUsername,
          });
          
          // Only refresh once per session to prevent loops
          if (!lastRefresh) {
            setTimeout(() => refreshUserData(), 1000);
          }
        } catch (error) {
          console.error('Error parsing stored user data:', error);
          localStorage.removeItem(`user_${session.user.gitlabId}`);
          setUser({
            ...(session.user || {}),
            gitlabId: session.user?.gitlabId,
            gitlabUsername: session.user?.gitlabUsername,
          });
        }
      } else {
        // User needs to complete onboarding
        setUser({
          ...(session.user || {}),
          gitlabId: session.user?.gitlabId,
          gitlabUsername: session.user?.gitlabUsername,
          needsOnboarding: true,
        });
        
        // Only refresh once for new users
        if (!lastRefresh) {
          setTimeout(() => refreshUserData(), 1000);
        }
      }
    } else {
      setUser(null);
    }
    
    setLoading(false);
  }, [session, status, isClient, refreshUserData, lastRefresh]);

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

  // Don't render children until we're on the client side and context is ready
  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    // More detailed error message for debugging
    console.error('useAuth hook called outside of AuthProvider context');
    console.error('Make sure your component is wrapped with AuthProvider');
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}