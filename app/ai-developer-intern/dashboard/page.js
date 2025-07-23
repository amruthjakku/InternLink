'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AuthProvider } from '../../../components/AuthProvider';
import { AIDeveloperInternDashboard } from '../../../components/AIDeveloperInternDashboard';

export default function AIDeveloperInternDashboardPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sessionRefreshed, setSessionRefreshed] = useState(false);

  // Refresh session data on mount to get latest role
  const refreshSession = async () => {
    try {
      const response = await fetch('/api/auth/refresh-session');
      if (response.ok) {
        const data = await response.json();
        // Force session update with fresh data
        await update({
          ...session?.user,
          role: data.user.role,
          college: data.user.college,
          assignedBy: data.user.assignedBy
        });
        setSessionRefreshed(true);
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

    // If user needs onboarding, redirect to onboarding
    if (session.user.needsOnboarding || !session.user.college) {
      router.push('/onboarding');
      return;
    }

    if (session.user.role !== 'AI Developer Intern') {
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

  return (
    <AuthProvider>
      <AIDeveloperInternDashboard />
    </AuthProvider>
  );
}