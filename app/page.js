'use client';

import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // If user is authenticated, redirect to appropriate dashboard
    if (session?.user) {
      redirectToDashboard();
    }
  }, [session]);

  const redirectToDashboard = () => {
    const { role } = session.user;
    
    switch (role) {
      case 'admin':
        router.push('/admin/dashboard');
        break;
      case 'mentor':
        router.push('/mentor/dashboard');
        break;
      case 'intern':
        router.push('/intern/dashboard');
        break;
      default:
        console.error('Unknown user role:', role);
        break;
    }
  };

  const handleGetStarted = async () => {
    if (session) {
      // User is already authenticated, redirect to dashboard
      redirectToDashboard();
    } else {
      // User needs to sign in
      setIsLoading(true);
      await signIn('gitlab');
    }
  };

  // Show loading if we're checking session or redirecting
  if (status === 'loading' || (session && isLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {session ? 'Redirecting to your dashboard...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-gray-900">
                  📊 Progress Tracker
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {session ? (
                <div className="flex items-center space-x-3">
                  <img 
                    src={session.user.image || session.user.profileImage} 
                    alt={session.user.name}
                    className="w-8 h-8 rounded-full"
                  />
                  <span className="text-sm text-gray-700">
                    Welcome, {session.user.name}!
                  </span>
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                    {session.user.role}
                  </span>
                </div>
              ) : (
                <Link
                  href="/auth/signin"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Track Your
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                {' '}Internship Journey
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              A comprehensive platform for interns and mentors to track progress, 
              monitor development activities, and showcase achievements through GitLab integration.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={handleGetStarted}
                disabled={isLoading}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </>
                ) : (
                  <>
                    {session ? 'Go to Dashboard' : 'Get Started'}
                    <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>
              
              {!session && (
                <Link
                  href="/auth/signin"
                  className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Sign In
                </Link>
              )}
            </div>

            {/* Access Information */}
            {!session && (
              <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg max-w-2xl mx-auto">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3 text-left">
                    <h3 className="text-sm font-medium text-blue-800">
                      Access Required
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p className="mb-2">
                        Your GitLab account must be pre-registered to access this platform:
                      </p>
                      <ul className="list-disc list-inside space-y-1">
                        <li><strong>Interns:</strong> Ask your mentor to add your GitLab username</li>
                        <li><strong>Mentors:</strong> Contact an admin to register your account</li>
                        <li><strong>Admins:</strong> Contact the system administrator</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Role-Based Access Control
            </h2>
            <p className="text-xl text-gray-600">
              Secure, hierarchical permissions for different user types
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Admin Features */}
            <div className="text-center p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.707-4.293a1 1 0 010 1.414L9.414 13.414a1 1 0 01-1.414 0L6.293 11.707a1 1 0 011.414-1.414L9 11.586l4.293-4.293a1 1 0 011.414 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Admin Dashboard</h3>
              <p className="text-gray-600 mb-4">
                Full system control with ability to manage mentors, colleges, and system-wide oversight.
              </p>
              <ul className="text-sm text-gray-500 text-left space-y-1">
                <li>• Add/manage other admins</li>
                <li>• Create and manage colleges</li>
                <li>• Assign mentors to colleges</li>
                <li>• System-wide analytics</li>
              </ul>
            </div>

            {/* Mentor Features */}
            <div className="text-center p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Mentor Dashboard</h3>
              <p className="text-gray-600 mb-4">
                College-specific management with ability to add interns and monitor their progress.
              </p>
              <ul className="text-sm text-gray-500 text-left space-y-1">
                <li>• Add interns to their college</li>
                <li>• Manage college cohorts</li>
                <li>• Monitor intern progress</li>
                <li>• GitLab integration analytics</li>
              </ul>
            </div>

            {/* Intern Features */}
            <div className="text-center p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Intern Dashboard</h3>
              <p className="text-gray-600 mb-4">
                Personal progress tracking with GitLab integration and development analytics.
              </p>
              <ul className="text-sm text-gray-500 text-left space-y-1">
                <li>• Track development progress</li>
                <li>• GitLab commits & issues</li>
                <li>• View assigned tasks</li>
                <li>• Progress visualization</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Security Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Secure & Controlled Access
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Admin-controlled role assignment ensures proper access management
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-2xl mb-2">🔐</div>
              <h4 className="font-semibold text-gray-900">Pre-Registration</h4>
              <p className="text-sm text-gray-600">All users must be pre-registered by authorized personnel</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-2xl mb-2">🏢</div>
              <h4 className="font-semibold text-gray-900">College-Scoped</h4>
              <p className="text-sm text-gray-600">Mentors and interns are restricted to their assigned college</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-2xl mb-2">👥</div>
              <h4 className="font-semibold text-gray-900">Role Hierarchy</h4>
              <p className="text-sm text-gray-600">Clear permission structure from admin to intern level</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-2xl mb-2">🦊</div>
              <h4 className="font-semibold text-gray-900">GitLab OAuth</h4>
              <p className="text-sm text-gray-600">Secure authentication using GitLab accounts</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">📊 Progress Tracker</h3>
            <p className="text-gray-400 mb-6">
              Secure internship progress tracking with role-based access control
            </p>
            <div className="mt-8 pt-8 border-t border-gray-800">
              <p className="text-gray-400">
                © 2024 Progress Tracker. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}