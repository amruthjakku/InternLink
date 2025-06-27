'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { CollegeBadge } from '../../../components/CollegeLogo';

export default function RoleDebugPage() {
  const { data: session, status } = useSession();
  const [roleReport, setRoleReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchRoleReport();
  }, []);

  const fetchRoleReport = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/debug/role-changes');
      const data = await response.json();
      setRoleReport(data);
    } catch (error) {
      console.error('Failed to fetch role report:', error);
    } finally {
      setLoading(false);
    }
  };

  const forceRefreshSession = async (username) => {
    try {
      setRefreshing(true);
      const response = await fetch('/api/admin/force-refresh-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      
      const result = await response.json();
      if (response.ok) {
        alert(`Session refresh triggered for ${username}. User should refresh their browser.`);
        fetchRoleReport(); // Refresh the report
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading role debug information...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">🔧 Role Changes Debug Dashboard</h1>
          
          {/* Current Session Info */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">👤 Your Current Session</h2>
            <div className="bg-blue-50 p-4 rounded">
              {session ? (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><strong>Username:</strong> {session.user?.gitlabUsername}</div>
                  <div><strong>Session Role:</strong> <span className="font-mono bg-gray-100 px-2 py-1 rounded">{session.user?.role}</span></div>
                  <div><strong>Name:</strong> {session.user?.name}</div>
                  <div><strong>Email:</strong> {session.user?.email}</div>
                  <div><strong>Has College:</strong> {session.user?.college ? '✅ Yes' : '❌ No'}</div>
                  <div><strong>Needs Registration:</strong> {session.user?.needsRegistration ? '❌ Yes' : '✅ No'}</div>
                </div>
              ) : (
                <p className="text-gray-600">No active session</p>
              )}
            </div>
          </div>

          {/* Issues Found */}
          {roleReport?.issues && roleReport.issues.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">⚠️ Issues Found</h2>
              <div className="space-y-4">
                {roleReport.issues.map((issue, index) => (
                  <div key={index} className={`p-4 rounded border-l-4 ${
                    issue.severity === 'CRITICAL' ? 'bg-red-50 border-red-500' :
                    issue.severity === 'HIGH' ? 'bg-orange-50 border-orange-500' :
                    'bg-yellow-50 border-yellow-500'
                  }`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{issue.type}</h3>
                        <p className="text-sm text-gray-600 mt-1">{issue.description}</p>
                        <p className="text-xs text-gray-500 mt-2"><strong>Fix:</strong> {issue.fix}</p>
                        {issue.affectedUsers && (
                          <p className="text-xs text-gray-500 mt-1">
                            <strong>Affected Users:</strong> {issue.affectedUsers.join(', ')}
                          </p>
                        )}
                      </div>
                      <span className={`px-2 py-1 text-xs rounded ${
                        issue.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                        issue.severity === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {issue.severity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          {roleReport?.summary && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">📊 Summary</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded">
                  <div className="text-2xl font-bold text-blue-600">{roleReport.summary.totalUsers}</div>
                  <div className="text-sm text-gray-600">Total Users</div>
                </div>
                <div className="bg-green-50 p-4 rounded">
                  <div className="text-2xl font-bold text-green-600">{roleReport.summary.activeUsers}</div>
                  <div className="text-sm text-gray-600">Active Users</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded">
                  <div className="text-2xl font-bold text-yellow-600">{roleReport.summary.pendingUsers}</div>
                  <div className="text-sm text-gray-600">Pending Users</div>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <div className="text-2xl font-bold text-gray-600">{Object.keys(roleReport.summary.rolesDistribution).length}</div>
                  <div className="text-sm text-gray-600">Different Roles</div>
                </div>
              </div>
              
              <div className="mt-4">
                <h3 className="font-medium mb-2">Role Distribution:</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(roleReport.summary.rolesDistribution).map(([role, count]) => (
                    <span key={role} className="px-3 py-1 bg-gray-100 rounded text-sm">
                      {role}: {count}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* All Users Table */}
          {roleReport?.databaseUsers && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">👥 All Users (Database vs Session)</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 border-b text-left">Username</th>
                      <th className="px-4 py-2 border-b text-left">DB Role</th>
                      <th className="px-4 py-2 border-b text-left">Session Role</th>
                      <th className="px-4 py-2 border-b text-left">Status</th>
                      <th className="px-4 py-2 border-b text-left">College</th>
                      <th className="px-4 py-2 border-b text-left">Last Login</th>
                      <th className="px-4 py-2 border-b text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roleReport.databaseUsers.map((user) => (
                      <tr key={user.id} className={`${
                        user.roleMismatch ? 'bg-red-50' : 
                        !user.isActive ? 'bg-gray-50' : 
                        user.isCurrentUser ? 'bg-blue-50' : ''
                      }`}>
                        <td className="px-4 py-2 border-b">
                          {user.gitlabUsername}
                          {user.isCurrentUser && <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">YOU</span>}
                        </td>
                        <td className="px-4 py-2 border-b">
                          <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                            {user.databaseRole}
                          </span>
                        </td>
                        <td className="px-4 py-2 border-b">
                          {user.sessionRole ? (
                            <span className={`font-mono px-2 py-1 rounded text-xs ${
                              user.roleMismatch ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {user.sessionRole}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">No session</span>
                          )}
                        </td>
                        <td className="px-4 py-2 border-b">
                          {user.isActive ? '✅ Active' : '❌ Inactive'}
                          {user.roleMismatch && <div className="text-xs text-red-600">⚠️ Role Mismatch</div>}
                        </td>
                        <td className="px-4 py-2 border-b">
                          {user.college ? (
                            <CollegeBadge college={{ name: user.college }} />
                          ) : (
                            <span className="text-gray-500 text-sm">No college</span>
                          )}
                        </td>
                        <td className="px-4 py-2 border-b">
                          {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                        </td>
                        <td className="px-4 py-2 border-b">
                          {session?.user?.role === 'admin' && user.roleMismatch && (
                            <button
                              onClick={() => forceRefreshSession(user.gitlabUsername)}
                              disabled={refreshing}
                              className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50"
                            >
                              {refreshing ? '⏳' : '🔄'} Force Refresh
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold mb-4">🔧 Quick Actions</h2>
            <div className="space-x-4">
              <button
                onClick={fetchRoleReport}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                🔄 Refresh Report
              </button>
              <button
                onClick={() => window.location.href = '/debug'}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                📊 Full Debug Dashboard
              </button>
              {session && (
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  🚪 Sign Out & Test
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}