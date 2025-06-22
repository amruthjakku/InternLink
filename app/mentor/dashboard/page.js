'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AuthProvider } from '../../../components/AuthProvider';
import { MentorDashboard } from '../../../components/MentorDashboard';

export default function MentorDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/');
      return;
    }

    // If user needs registration, redirect to onboarding
    if (session.user.needsRegistration || session.user.role === 'pending') {
      router.push('/onboarding');
      return;
    }

    if (session.user.role !== 'mentor') {
      router.push('/unauthorized');
      return;
    }

    setLoading(false);
  }, [session, status, router]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <MentorDashboard />
    </AuthProvider>
  );
}