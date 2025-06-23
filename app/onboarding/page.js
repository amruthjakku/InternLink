'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { signOut } from 'next-auth/react';
import { OnboardingFlow } from '../../components/auth/OnboardingFlow';

export default function Onboarding() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/');
      return;
    }

    // If user already has a role (not pending), redirect them
    if (session.user.role && session.user.role !== 'pending') {
      const dashboardPath = session.user.role === 'admin' ? '/admin/dashboard' :
                           session.user.role === 'super-mentor' ? '/mentor/dashboard' :
                           session.user.role === 'mentor' ? '/mentor/dashboard' :
                           '/intern/dashboard';
      router.push(dashboardPath);
      return;
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return <OnboardingFlow />;
}