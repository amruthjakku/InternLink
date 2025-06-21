'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';

export function GitLabLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  const handleGitLabLogin = async () => {
    setIsLoading(true);
    try {
      await signIn('gitlab', { callbackUrl: '/auth/onboarding' });
    } catch (error) {
      console.error('GitLab login error:', error);
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (role) => {
    setIsLoading(true);
    try {
      // For demo mode, we'll simulate a login by redirecting to onboarding
      // with demo parameters in the URL
      window.location.href = `/auth/onboarding?demo=true&role=${role}`;
    } catch (error) {
      console.error('Demo login error:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <span className="text-2xl">🚀</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Welcome to Progress Tracker
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in with your GitLab account to get started
          </p>
        </div>

        <div className="space-y-4">
          {/* GitLab OAuth Login */}
          <button
            onClick={handleGitLabLogin}
            disabled={isLoading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <span className="absolute left-0 inset-y-0 flex items-center pl-3">
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 0 1-.3-.94l1.22-3.78 2.44-7.51A.42.42 0 0 1 4.82 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.16l2.44 7.49h8.1l2.44-7.51A.42.42 0 0 1 18.6 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.16l2.44 7.51 1.22 3.78a.84.84 0 0 1-.3.94z"/>
                </svg>
              )}
            </span>
            {isLoading ? 'Signing in...' : 'Sign in with GitLab'}
          </button>

          {/* Demo Mode Toggle */}
          <div className="text-center">
            <button
              onClick={() => setShowDemo(!showDemo)}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              {showDemo ? 'Hide' : 'Show'} Demo Mode
            </button>
          </div>

          {/* Demo Login Options */}
          {showDemo && (
            <div className="space-y-3 pt-4 border-t border-gray-200">
              <p className="text-center text-sm text-gray-600">
                Demo Mode (for testing)
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleDemoLogin('mentor')}
                  disabled={isLoading}
                  className="flex flex-col items-center py-3 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-50"
                >
                  <span className="text-lg mb-1">👨‍🏫</span>
                  Demo Mentor
                </button>
                <button
                  onClick={() => handleDemoLogin('intern')}
                  disabled={isLoading}
                  className="flex flex-col items-center py-3 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-50"
                >
                  <span className="text-lg mb-1">👨‍🎓</span>
                  Demo Intern
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            By signing in, you agree to our terms of service and privacy policy
          </p>
        </div>
      </div>
    </div>
  );
}