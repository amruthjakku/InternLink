'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AuthProvider } from '../../../components/AuthProvider';
import { MentorDashboard } from '../../../components/MentorDashboard';

export default function MentorDashboardPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sessionRefreshed, setSessionRefreshed] = useState(false);

  // Refresh session data on mount to get latest role
  const refreshSession = async () => {
    try {
      console.log('Refreshing session for user:', session?.user?.email);
      
      // Add retry logic for session refresh
      let retries = 0;
      const maxRetries = 3;
      let response;
      
      const fetchWithRetry = async () => {
        console.log(`Refreshing session (attempt ${retries + 1}/${maxRetries})`);
        try {
          return await fetch('/api/auth/refresh-session');
        } catch (fetchError) {
          console.error(`Session refresh attempt ${retries + 1} failed:`, fetchError);
          if (retries < maxRetries - 1) {
            retries++;
            console.log(`Retrying in 1 second... (${retries}/${maxRetries - 1})`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            return fetchWithRetry();
          }
          throw fetchError;
        }
      };
      
      try {
        response = await fetchWithRetry();
        console.log('Session refresh response status:', response.status);
      } catch (fetchError) {
        console.error('All session refresh attempts failed:', fetchError);
        setSessionRefreshed(true); // Continue with existing session
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        console.log('Refreshed user data:', data.user);
        
        // Force session update with fresh data
        await update({
          ...session?.user,
          role: data.user.role,
          college: data.user.college,
          assignedBy: data.user.assignedBy
        });
        
        console.log('Session updated with role:', data.user.role);
        setSessionRefreshed(true);
      } else {
        console.error('Failed to refresh session, status:', response.status);
        setSessionRefreshed(true); // Continue with existing session
      }
    } catch (error) {
      console.error('Failed to refresh session:', error);
      setSessionRefreshed(true); // Continue with existing session
    }
  };

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/');
      return;
    }

    // Refresh session to get latest role information
    if (!sessionRefreshed) {
      refreshSession();
      return;
    }

    // If user needs registration, redirect to onboarding
    if (session.user.needsRegistration || session.user.role === 'pending') {
      router.push('/onboarding');
      return;
    }

    if (session.user.role !== 'mentor' && session.user.role !== 'super-mentor') {
      router.push('/unauthorized');
      return;
    }

    setLoading(false);
  }, [session, status, router, sessionRefreshed]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  console.log('Rendering MentorDashboardPage with user role:', session?.user?.role);
  
  return (
    <AuthProvider>
      <MentorDashboard />
    </AuthProvider>
  );
}