'use client';

import { getProviders, signIn, getSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignIn() {
  const [providers, setProviders] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const setupProviders = async () => {
      const providers = await getProviders();
      setProviders(providers);
    };
    setupProviders();
  }, []);

  const handleSignIn = async (providerId) => {
    setLoading(true);
    try {
      await signIn(providerId, { callbackUrl: '/' });
    } catch (error) {
      console.error('Sign in error:', error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              📊 Progress Tracker
            </h1>
          </Link>
          <h2 className="text-xl text-gray-600">
            Sign in to your account
          </h2>
        </div>
      </div>

      {/* Sign In Form */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10 border border-gray-200">
          {providers && Object.values(providers).map((provider) => (
            <div key={provider.name} className="space-y-4">
              <button
                onClick={() => handleSignIn(provider.id)}
                disabled={loading}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 0 1-.3-.94l1.22-3.78 2.44-7.51A.42.42 0 0 1 4.82 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.16l2.44 7.49h8.1l2.44-7.51A.42.42 0 0 1 18.6 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.16l2.44 7.51 1.22 3.78a.84.84 0 0 1-.3.94z"/>
                    </svg>
                    Sign in with {provider.name}
                  </>
                )}
              </button>
            </div>
          ))}

          {/* Information Box */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Access Required
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    Your GitLab account must be pre-registered by an admin or mentor to access this platform.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Help Section */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have access?{' '}
              <span className="font-medium text-gray-900">
                Contact your mentor or admin
              </span>
            </p>
          </div>
        </div>

        {/* Back to Homepage */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-blue-600 hover:text-blue-500 font-medium"
          >
            ← Back to Homepage
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-xs text-gray-500">
          Secure authentication powered by GitLab OAuth
        </p>
      </div>
    </div>
  );
}