'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const { data: session, status } = useSession();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
            ...session.user,
            ...userData,
            gitlabId: session.user.gitlabId,
            gitlabUsername: session.user.gitlabUsername,
            is_demo: false
          });
        } catch (error) {
          console.error('Error parsing stored user data:', error);
          localStorage.removeItem(`user_${session.user.gitlabId}`);
          setUser(null);
        }
      } else {
        // User needs to complete onboarding
        setUser({
          ...session.user,
          gitlabId: session.user.gitlabId,
          gitlabUsername: session.user.gitlabUsername,
          needsOnboarding: true,
          is_demo: false
        });
      }
    } else {
      // Check for demo user session (fallback for development)
      const storedUser = localStorage.getItem('demo_user');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (error) {
          console.error('Error parsing stored demo user:', error);
          localStorage.removeItem('demo_user');
          setUser(null);
        }
      } else {
        setUser(null);
      }
    }
    
    setLoading(false);
  }, [session, status]);

  const login = (userData) => {
    // For demo login (fallback)
    setUser(userData);
    localStorage.setItem('demo_user', JSON.stringify(userData));
  };

  const completeOnboarding = (onboardingData) => {
    if (session?.user) {
      const updatedUser = {
        ...user,
        ...onboardingData,
        needsOnboarding: false
      };
      setUser(updatedUser);
      localStorage.setItem(`user_${session.user.gitlabId}`, JSON.stringify(onboardingData));
    } else if (user?.is_demo) {
      // Handle demo user profile updates
      const updatedUser = {
        ...user,
        ...onboardingData
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