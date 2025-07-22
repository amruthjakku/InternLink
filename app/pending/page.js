'use client';

import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';

export default function PendingApproval() {
  const { data: session } = useSession();
  const [copied, setCopied] = useState(false);

  const handleCopyUsername = () => {
    navigator.clipboard.writeText(session?.user?.gitlabUsername);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <span className="text-6xl">⏳</span>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Approval Pending
          </h2>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg shadow-sm p-6">
          <div className="text-center">
            <h3 className="text-lg font-medium text-yellow-800 mb-2">
              Welcome, {session?.user?.name}!
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Your account has been created but needs approval from an admin before you can access the system.
            </p>

            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-gray-900 mb-2">Your GitLab Username:</h4>
              <div className="flex items-center justify-center space-x-2">
                <span className="font-mono bg-gray-100 px-3 py-1 rounded text-sm">
                  {session?.user?.gitlabUsername}
                </span>
                <button
                  onClick={handleCopyUsername}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  {copied ? '✅ Copied!' : '📋 Copy'}
                </button>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
              <ul className="text-sm text-blue-800 text-left space-y-1">
                <li>• An admin will review your account</li>
                <li>• You'll be assigned a role (AI Developer Intern, Tech Lead, etc.)</li>
                <li>• You'll receive access to your dashboard</li>
                <li>• You'll get an email notification when approved</li>
              </ul>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full flex justify-center py-2 px-4 border border-yellow-300 rounded-md shadow-sm text-sm font-medium text-yellow-700 bg-yellow-50 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              >
                🔄 Check Approval Status
              </button>
              
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Need help? Contact your admin or mentor for assistance with account approval.
          </p>
        </div>
      </div>
    </div>
  );
}