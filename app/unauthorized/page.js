'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function Unauthorized() {
  const { data: session } = useSession();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const handleGoBack = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-8">
            You don't have permission to access this page.
          </p>
        </div>

        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {session ? (
            <div className="space-y-6">
              <div className="text-center">
                <img
                  src={session.user?.image || 'https://via.placeholder.com/64'}
                  alt={session.user?.name}
                  className="w-16 h-16 rounded-full mx-auto mb-4"
                />
                <h3 className="text-lg font-medium text-gray-900">{session.user?.name}</h3>
                <p className="text-sm text-gray-600">{session.user?.email}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Role: {session.user?.role || 'No role assigned'}
                </p>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <div className="text-sm text-gray-600 mb-4">
                  <p className="mb-2">
                    <strong>Possible reasons:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Your account doesn't have the required role</li>
                    <li>You're trying to access a restricted area</li>
                    <li>Your account is pending approval</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleGoBack}
                    className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Go to Home
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-gray-600 mb-6">
                You need to be signed in to access this page.
              </p>
              <button
                onClick={handleGoBack}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Go to Sign In
              </button>
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            If you believe this is an error, please contact your administrator.
          </p>
        </div>
      </div>
    </div>
  );
}