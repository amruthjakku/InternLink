'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const [error, setError] = useState('');

  useEffect(() => {
    const errorType = searchParams.get('error');
    
    // Log error details for debugging
    console.log('Auth Error Page:', {
      errorType,
      allParams: Object.fromEntries([...searchParams.entries()])
    });
    
    switch (errorType) {
      case 'AccessDenied':
        setError('access_denied');
        break;
      case 'OAuthSignin':
        setError('oauth_signin');
        break;
      case 'OAuthCallback':
        setError('oauth_callback');
        break;
      case 'OAuthCreateAccount':
        setError('oauth_create_account');
        break;
      case 'EmailCreateAccount':
        setError('email_create_account');
        break;
      case 'Callback':
        setError('callback');
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
      case 'oauth_signin':
        return {
          title: 'GitLab Sign-In Error',
          message: 'There was a problem starting the GitLab sign-in process.',
          description: 'Please try again or use a different browser. If the problem persists, contact support.',
          icon: '🔄',
          color: 'yellow'
        };
      case 'oauth_callback':
        return {
          title: 'Authentication Response Error',
          message: 'There was a problem processing the GitLab authentication response.',
          description: 'This could be due to an expired session or network issues. Please try signing in again.',
          icon: '🔄',
          color: 'yellow'
        };
      case 'oauth_create_account':
        return {
          title: 'Account Creation Failed',
          message: 'We couldn\'t create your account using your GitLab profile.',
          description: 'There might be missing information in your GitLab profile. Please ensure your GitLab profile has a name and email address.',
          icon: '👤',
          color: 'red'
        };
      case 'callback':
        return {
          title: 'Authentication Process Error',
          message: 'There was an error during the authentication callback process.',
          description: 'This could be due to network issues or server problems. Please try again later.',
          icon: '🔄',
          color: 'yellow'
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
        
        {/* Debug Information (only in development) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 p-4 bg-gray-100 border border-gray-200 rounded-lg text-xs font-mono">
            <details>
              <summary className="cursor-pointer font-medium text-gray-700">Debug Information</summary>
              <div className="mt-2 overflow-auto max-h-40">
                <p className="mb-1 text-gray-700">Error Type: <span className="text-red-600">{searchParams.get('error') || 'None'}</span></p>
                <p className="mb-1 text-gray-700">Error Description: <span className="text-red-600">{searchParams.get('error_description') || 'None'}</span></p>
                <p className="mb-1 text-gray-700">Error URI: <span className="text-red-600">{searchParams.get('error_uri') || 'None'}</span></p>
                <p className="mb-1 text-gray-700">All Parameters:</p>
                <pre className="bg-gray-800 text-green-400 p-2 rounded text-xs">
                  {JSON.stringify(Object.fromEntries([...searchParams.entries()]), null, 2)}
                </pre>
              </div>
            </details>
          </div>
        )}
      </div>


    </div>
  );
}

export default function AuthError() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <span className="text-6xl">⏳</span>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Loading...
            </h2>
          </div>
        </div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  );
}