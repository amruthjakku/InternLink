'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';

export default function DashboardRedirect() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      window.location.href = '/';
      return;
    }

    const { role } = session.user;
    
    switch (role) {
      case 'admin':
        window.location.href = '/admin/dashboard';
        break;
      case 'POC':
        window.location.href = '/poc/dashboard';
        break;
      case 'Tech Lead':
        window.location.href = '/tech-lead/dashboard';
        break;
      case 'AI Developer Intern':
        window.location.href = '/ai-developer-intern/dashboard';
        break;
      case 'pending':
        window.location.href = '/pending';
        break;
      default:
        if (session.user.needsOnboarding) {
          window.location.href = '/onboarding';
        } else {
          window.location.href = '/unauthorized';
        }
        break;
    }
  }, [session, status]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}