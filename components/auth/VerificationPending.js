'use client';

import { useState } from 'react';

export function VerificationPending({ user, onApprove }) {
  const [isSimulatingApproval, setIsSimulatingApproval] = useState(false);

  const handleSimulateApproval = () => {
    setIsSimulatingApproval(true);
    
    // Simulate mentor approval after 3 seconds
    setTimeout(() => {
      onApprove();
    }, 3000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-yellow-100">
            <span className="text-3xl">⏳</span>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Verification Pending
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Your application is waiting for mentor approval
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow rounded-xl">
          <div className="space-y-6">
            {/* User Info */}
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Application Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Name:</span>
                  <span className="text-gray-900">{user?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Email:</span>
                  <span className="text-gray-900">{user?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Role:</span>
                  <span className="text-gray-900 capitalize">{user?.role}</span>
                </div>
                {user?.college_name && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">College:</span>
                    <span className="text-gray-900">{user.college_name}</span>
                  </div>
                )}
                {user?.cohort_name && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Cohort:</span>
                    <span className="text-gray-900">{user.cohort_name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Status */}
            <div className="text-center">
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                <span className="mr-2">⏳</span>
                Pending Approval
              </div>
            </div>

            {/* What's Next */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-2">What happens next?</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Your mentor will review your application</li>
                <li>• You'll receive an email notification when approved</li>
                <li>• Once approved, you can access your dashboard</li>
              </ul>
            </div>

            {/* Demo Simulation */}
            <div className="border-t border-gray-200 pt-4">
              <p className="text-xs text-gray-500 text-center mb-4">
                Demo Mode: Simulate mentor approval
              </p>
              <button
                onClick={handleSimulateApproval}
                disabled={isSimulatingApproval}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSimulatingApproval ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Simulating Approval...
                  </>
                ) : (
                  'Simulate Mentor Approval'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Additional Actions */}
        <div className="text-center space-y-2">
          <p className="text-xs text-gray-500">
            Need help? Contact your mentor or administrator
          </p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-blue-600 hover:text-blue-500 underline"
          >
            Refresh Status
          </button>
        </div>
      </div>
    </div>
  );
}