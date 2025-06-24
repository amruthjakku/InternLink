'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function FixesPage() {
  const { data: session } = useSession();
  const [verification, setVerification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fixing, setFixing] = useState(false);

  useEffect(() => {
    fetchVerification();
  }, []);

  const fetchVerification = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/debug/verify-fixes');
      const data = await response.json();
      setVerification(data);
    } catch (error) {
      console.error('Failed to fetch verification:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFixes = async () => {
    try {
      setFixing(true);
      const response = await fetch('/api/debug/verify-fixes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'fix_common_issues' })
      });
      const result = await response.json();
      
      if (response.ok) {
        alert('Fixes applied successfully! All users should refresh their browsers.');
        fetchVerification(); // Refresh the verification
      } else {
        alert(`Error applying fixes: ${result.error}`);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setFixing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Verifying fixes...</p>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'PASS': return 'text-green-600 bg-green-50 border-green-200';
      case 'FAIL': return 'text-red-600 bg-red-50 border-red-200';
      case 'INFO': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PASS': return '✅';
      case 'FAIL': return '❌';
      case 'INFO': return 'ℹ️';
      default: return '❓';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            🔧 Role Access Fixes - Verification Dashboard
          </h1>
          
          {/* Overall Status */}
          {verification && (
            <div className={`p-4 rounded-lg mb-6 border-2 ${
              verification.overallStatus === 'ALL_PASS' ? 'bg-green-50 border-green-200' :
              verification.overallStatus === 'PASS_WITH_WARNINGS' ? 'bg-yellow-50 border-yellow-200' :
              'bg-red-50 border-red-200'
            }`}>
              <h2 className="text-xl font-semibold mb-2">
                {verification.overallStatus === 'ALL_PASS' ? '🎉 All Systems Working!' :
                 verification.overallStatus === 'PASS_WITH_WARNINGS' ? '⚠️ Working with Warnings' :
                 '🚨 Issues Found'}
              </h2>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{verification.summary.passed}</div>
                  <div className="text-gray-600">Passed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{verification.summary.warnings}</div>
                  <div className="text-gray-600">Warnings</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{verification.summary.failed}</div>
                  <div className="text-gray-600">Failed</div>
                </div>
              </div>
            </div>
          )}

          {/* Current User Status */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">👤 Your Current Status</h3>
            {session ? (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>Username:</strong> {session.user?.gitlabUsername}</div>
                <div><strong>Role:</strong> <span className="font-mono bg-white px-2 py-1 rounded">{session.user?.role}</span></div>
                <div><strong>Active:</strong> {session.user?.isActive ? '✅ Yes' : '❌ No'}</div>
                <div><strong>College:</strong> {session.user?.college?.name || 'None'}</div>
              </div>
            ) : (
              <p className="text-gray-600">No active session</p>
            )}
          </div>

          {/* Fix Actions */}
          {session?.user?.role === 'admin' && (
            <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <h3 className="font-medium text-orange-900 mb-3">🛠️ Admin Actions</h3>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={applyFixes}
                  disabled={fixing}
                  className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
                >
                  {fixing ? '⏳ Applying Fixes...' : '🔧 Apply Auto-Fixes'}
                </button>
                <button
                  onClick={fetchVerification}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  🔄 Re-run Verification
                </button>
                <button
                  onClick={() => window.location.href = '/debug/admin'}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  🎛️ Admin Debug Console
                </button>
              </div>
            </div>
          )}

          {/* Verification Results */}
          {verification && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">📋 Verification Results</h3>
              <div className="space-y-3">
                {verification.checks.map((check, index) => (
                  <div key={index} className={`p-4 rounded-lg border ${getStatusColor(check.status)}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium flex items-center">
                          <span className="mr-2">{getStatusIcon(check.status)}</span>
                          {check.name}
                        </h4>
                        <p className="text-sm mt-1">{check.message}</p>
                        
                        {check.details && (
                          <div className="mt-2 p-2 bg-white bg-opacity-50 rounded text-xs">
                            <strong>Details:</strong>
                            <pre className="mt-1 whitespace-pre-wrap">
                              {JSON.stringify(check.details, null, 2)}
                            </pre>
                          </div>
                        )}
                        
                        {check.error && (
                          <div className="mt-2 p-2 bg-red-100 rounded text-xs">
                            <strong>Error:</strong> {check.error}
                          </div>
                        )}
                      </div>
                      <span className={`px-2 py-1 text-xs rounded font-medium ${
                        check.status === 'PASS' ? 'bg-green-100 text-green-800' :
                        check.status === 'FAIL' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {check.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Manual Testing Instructions */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">🧪 Manual Testing Steps</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li><strong>Test Auto-Registration:</strong> Try logging in with a new GitLab user - should create pending account</li>
                <li><strong>Test Role Changes:</strong> Admin changes user's role, user refreshes browser - should see new permissions</li>
                <li><strong>Test User Deactivation:</strong> Admin deactivates user - user should lose access immediately</li>
                <li><strong>Test Session Refresh:</strong> Use "Force Refresh Session" button - user should get updated permissions</li>
                <li><strong>Test Access Control:</strong> Users should only access appropriate dashboards based on their role</li>
              </ol>
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">🚀 Quick Navigation</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button
                onClick={() => window.location.href = '/debug/roles'}
                className="px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
              >
                🔧 Role Debug
              </button>
              <button
                onClick={() => window.location.href = '/debug'}
                className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                📊 Full Debug
              </button>
              <button
                onClick={() => window.location.href = '/admin/dashboard'}
                className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
              >
                🏠 Admin Dashboard
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
              >
                🔄 Reload Page
              </button>
            </div>
          </div>
          
          {/* Verification Timestamp */}
          {verification && (
            <div className="mt-6 text-xs text-gray-500 text-center">
              Last verified: {new Date(verification.timestamp).toLocaleString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}