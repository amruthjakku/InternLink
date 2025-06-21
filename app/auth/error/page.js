'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AuthError() {
  const searchParams = useSearchParams();
  const [error, setError] = useState('');

  useEffect(() => {
    const errorType = searchParams.get('error');
    
    switch (errorType) {
      case 'AccessDenied':
        setError('access_denied');
        break;
      case 'Configuration':
        setError('configuration');
        break;
      case 'Verification':
        setError('verification');
        break;
      default:
        setError('default');
    }
  }, [searchParams]);

  const getErrorContent = () => {
    switch (error) {
      case 'access_denied':
        return {
          title: 'Access Not Authorized',
          message: 'Your GitLab account is not yet registered in our system.',
          description: 'To gain access to the Internship Tracker platform, you need to be pre-registered by an admin or mentor.',
          icon: '🚫',
          color: 'red'
        };
      case 'configuration':
        return {
          title: 'Configuration Error',
          message: 'There was a problem with the authentication configuration.',
          description: 'Please contact the system administrator.',
          icon: '⚙️',
          color: 'yellow'
        };
      case 'verification':
        return {
          title: 'Verification Failed',
          message: 'Unable to verify your GitLab account.',
          description: 'Please try again or contact support if the problem persists.',
          icon: '❌',
          color: 'red'
        };
      default:
        return {
          title: 'Authentication Error',
          message: 'An unexpected error occurred during authentication.',
          description: 'Please try again or contact support.',
          icon: '⚠️',
          color: 'yellow'
        };
    }
  };

  const errorContent = getErrorContent();
  const colorClasses = {
    red: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      button: 'bg-red-600 hover:bg-red-700'
    },
    yellow: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      button: 'bg-yellow-600 hover:bg-yellow-700'
    }
  };

  const colors = colorClasses[errorContent.color];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <span className="text-6xl">{errorContent.icon}</span>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            {errorContent.title}
          </h2>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className={`${colors.bg} ${colors.border} border rounded-lg shadow-sm p-6`}>
          <div className="text-center">
            <h3 className={`text-lg font-medium ${colors.text} mb-2`}>
              {errorContent.message}
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              {errorContent.description}
            </p>

            {error === 'access_denied' && (
              <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-gray-900 mb-2">How to get access:</h4>
                <ul className="text-sm text-gray-600 text-left space-y-1">
                  <li>• <strong>For Interns:</strong> Ask your mentor to add your GitLab username to the system</li>
                  <li>• <strong>For Mentors:</strong> Contact an admin to register your GitLab username</li>
                  <li>• <strong>For Admins:</strong> Contact the system administrator</li>
                </ul>
              </div>
            )}

            <div className="space-y-3">
              <Link
                href="/"
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${colors.button} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
              >
                Return to Homepage
              </Link>
              
              <button
                onClick={() => window.location.reload()}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Need help? Contact your system administrator or mentor for assistance.
          </p>
        </div>
      </div>

      {/* Debug Information (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-gray-100 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Debug Information:</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <div>Error Type: {error}</div>
              <div>Search Params: {searchParams.toString()}</div>
              <div>Timestamp: {new Date().toISOString()}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}