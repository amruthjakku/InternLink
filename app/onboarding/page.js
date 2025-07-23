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

    // If user already has a role and college (complete registration), redirect them
    if (session.user.role && session.user.role !== 'pending' && session.user.college && !session.user.needsOnboarding) {
      const dashboardPath = session.user.role === 'admin' ? '/admin/dashboard' :
                           session.user.role === 'POC' ? '/poc/dashboard' :
                           session.user.role === 'Tech Lead' ? '/tech-lead/dashboard' :
                           '/ai-developer-intern/dashboard';
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

  // Show different onboarding based on user status
  if (session.user.needsOnboarding || (session.user.role === 'AI Developer Intern' && !session.user.college)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to InternLink!</h2>
            <p className="text-gray-600 mb-6">
              Your GitLab account has been automatically registered as an AI Developer Intern.
            </p>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Assignment Required
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>To complete your registration, you need to be assigned to a college and tech lead by an administrator.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-left">
                <h4 className="font-medium text-gray-900 mb-2">Next Steps:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Contact your program coordinator</li>
                  <li>• Ask them to assign you to your college</li>
                  <li>• Wait for tech lead assignment</li>
                  <li>• Return here once assigned</li>
                </ul>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => window.location.reload()}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Check Status
                </button>
                <button
                  onClick={() => signOut()}
                  className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <OnboardingFlow />;
}