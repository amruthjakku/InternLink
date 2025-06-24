'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { VerificationPending } from '../../components/auth/VerificationPending';
import SessionRefresh from '../../components/SessionRefresh';

export default function Unauthorized() {
  const { data: session } = useSession();
  const router = useRouter();


  const handleApprove = () => {
    // In a real app, this would be handled by the admin/mentor
    // For demo purposes, redirect to appropriate dashboard
    const dashboardPath = session?.user?.role === 'admin' ? '/admin/dashboard' :
                         session?.user?.role === 'mentor' ? '/mentor/dashboard' :
                         '/intern/dashboard';
    router.push(dashboardPath);
  };

  // If user is pending approval, show verification pending
  if (session?.user?.role === 'pending') {
    return <VerificationPending user={session.user} onApprove={handleApprove} />;
  }

  // Otherwise show the basic unauthorized page
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-4xl">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-8">
            You don't have permission to access this page.
          </p>
        </div>

        <SessionRefresh />

        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center space-y-4">
            <button
              onClick={() => router.push('/')}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Go Back to Home
            </button>
            
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
            >
              Sign Out
            </button>


          </div>
        </div>
      </div>
    </div>
  );
}