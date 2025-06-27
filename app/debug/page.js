'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { CollegeBadge } from '../../components/CollegeLogo';

export default function DebugPage() {
  const { data: session, status } = useSession();
  const [dbReport, setDbReport] = useState(null);
  const [authFlow, setAuthFlow] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDebugInfo();
  }, []);

  const fetchDebugInfo = async () => {
    try {
      // Fetch database report
      const dbResponse = await fetch('/api/debug/database');
      const dbData = await dbResponse.json();
      setDbReport(dbData);

      // Fetch auth flow check
      const authResponse = await fetch('/api/debug/auth-flow');
      const authData = await authResponse.json();
      setAuthFlow(authData);
    } catch (error) {
      console.error('Debug fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading debug information...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">🔍 System Debug Dashboard</h1>
          
          {/* Session Info */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">📋 Current Session</h2>
            <div className="bg-gray-50 p-4 rounded">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><strong>Status:</strong> {status}</div>
                <div><strong>Has Session:</strong> {session ? '✅ Yes' : '❌ No'}</div>
                {session && (
                  <>
                    <div><strong>Username:</strong> {session.user?.gitlabUsername || 'N/A'}</div>
                    <div><strong>Role:</strong> {session.user?.role || 'N/A'}</div>
                    <div><strong>Name:</strong> {session.user?.name || 'N/A'}</div>
                    <div><strong>Email:</strong> {session.user?.email || 'N/A'}</div>
                    <div><strong>Needs Registration:</strong> {session.user?.needsRegistration ? '❌ Yes' : '✅ No'}</div>
                    <div><strong>Has College:</strong> {session.user?.college ? '✅ Yes' : '❌ No'}</div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Auth Flow Check */}
          {authFlow && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">🚦 Authentication Flow Check</h2>
              <div className={`p-4 rounded ${authFlow.status === 'SUCCESS' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><strong>Step:</strong> {authFlow.step}</div>
                  <div><strong>Status:</strong> 
                    <span className={authFlow.status === 'SUCCESS' ? 'text-green-600' : 'text-red-600'}>
                      {authFlow.status === 'SUCCESS' ? ' ✅ SUCCESS' : ' ❌ FAIL'}
                    </span>
                  </div>
                  {authFlow.reason && <div className="col-span-2"><strong>Reason:</strong> {authFlow.reason}</div>}
                  {authFlow.recommendation && <div className="col-span-2"><strong>Recommendation:</strong> {authFlow.recommendation}</div>}
                  {authFlow.user && (
                    <>
                      <div className="col-span-2 mt-4"><strong>User Details:</strong></div>
                      <div><strong>Database Role:</strong> {authFlow.user.role}</div>
                      <div><strong>Expected Dashboard:</strong> {authFlow.user.expectedDashboard}</div>
                      <div><strong>College:</strong> {authFlow.user.college || 'None'}</div>
                      <div><strong>Active:</strong> {authFlow.user.isActive ? '✅ Yes' : '❌ No'}</div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Database Report */}
          {dbReport && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">🗄️ Database State</h2>
              
              {/* Summary */}
              <div className="bg-blue-50 p-4 rounded mb-4">
                <h3 className="font-medium mb-2">Summary</h3>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div><strong>Total Users:</strong> {dbReport.summary.totalUsers}</div>
                  <div><strong>Active Users:</strong> {dbReport.summary.activeUsers}</div>
                  <div><strong>Inactive Users:</strong> {dbReport.summary.inactiveUsers}</div>
                  <div><strong>Colleges:</strong> {dbReport.summary.totalColleges}</div>
                </div>
              </div>

              {/* All Users Table */}
              <div className="mb-6">
                <h3 className="font-medium mb-2">All Users</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 border-b text-left">Username</th>
                        <th className="px-4 py-2 border-b text-left">Role</th>
                        <th className="px-4 py-2 border-b text-left">Active</th>
                        <th className="px-4 py-2 border-b text-left">College</th>
                        <th className="px-4 py-2 border-b text-left">Last Login</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dbReport.allUsers.map((user) => (
                        <tr key={user.id} className={!user.isActive ? 'bg-red-50' : ''}>
                          <td className="px-4 py-2 border-b">{user.gitlabUsername}</td>
                          <td className="px-4 py-2 border-b">{user.role}</td>
                          <td className="px-4 py-2 border-b">
                            {user.isActive ? '✅ Yes' : '❌ No'}
                          </td>
                          <td className="px-4 py-2 border-b">
                            {user.college ? (
                              <CollegeBadge college={{ name: user.college }} />
                            ) : (
                              <span className="text-gray-500 text-sm">No college</span>
                            )}
                          </td>
                          <td className="px-4 py-2 border-b">
                            {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Inactive Users */}
              {dbReport.inactiveUsers.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-medium mb-2 text-red-600">⚠️ Inactive Users (These might be causing "user exists" issues)</h3>
                  <div className="bg-red-50 p-4 rounded">
                    {dbReport.inactiveUsers.map((user) => (
                      <div key={user.id} className="mb-2 text-sm">
                        <div className="flex items-center space-x-2">
                          <strong>{user.gitlabUsername}</strong> 
                          <span>({user.role})</span>
                          {user.college && <CollegeBadge college={{ name: user.college }} />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Colleges */}
              <div>
                <h3 className="font-medium mb-2">Colleges</h3>
                <div className="grid grid-cols-2 gap-2">
                  {dbReport.colleges.map((college) => (
                    <div key={college.id} className="bg-gray-50 p-2 rounded text-sm">
                      <strong>{college.name}</strong> {college.isActive ? '✅' : '❌'}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold mb-4">🔧 Quick Actions</h2>
            <div className="space-x-4">
              <button
                onClick={fetchDebugInfo}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                🔄 Refresh Debug Info
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                🏠 Go to Homepage
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}