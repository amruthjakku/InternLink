'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function AdminDebugPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState(null);

  useEffect(() => {
    if (session?.user?.role === 'admin') {
      fetchUsers();
    }
  }, [session]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/debug/test-database-updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test_all_users_status' })
      });
      const data = await response.json();
      if (response.ok) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const testRoleUpdate = async (username, newRole, isActive) => {
    try {
      setTesting(true);
      const response = await fetch('/api/debug/test-database-updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'test_role_update',
          username,
          newRole,
          isActive
        })
      });
      const data = await response.json();
      setTestResults(data);
      
      // Refresh users list
      fetchUsers();
    } catch (error) {
      console.error('Test failed:', error);
    } finally {
      setTesting(false);
    }
  };

  const forceRefreshSession = async (username) => {
    try {
      const response = await fetch('/api/admin/force-refresh-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      const result = await response.json();
      if (response.ok) {
        alert(`Session refresh triggered for ${username}`);
        fetchUsers();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  if (!session) {
    return <div className="p-8">Please sign in to access this page.</div>;
  }

  if (session.user.role !== 'admin') {
    return <div className="p-8">Admin access required.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            🔧 Admin Database Debug Console
          </h1>
          
          <div className="mb-6 p-4 bg-blue-50 rounded">
            <h2 className="font-medium text-blue-900 mb-2">Quick Role Update Tests</h2>
            <p className="text-sm text-blue-800 mb-4">
              Test if role changes are actually being saved to the database and triggering session refreshes.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <button
                onClick={() => testRoleUpdate('test1', 'intern', true)}
                disabled={testing}
                className="px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
              >
                {testing ? '⏳' : '✅'} Make test1 Intern
              </button>
              <button
                onClick={() => testRoleUpdate('test1', 'mentor', true)}
                disabled={testing}
                className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {testing ? '⏳' : '👨‍💼'} Make test1 Mentor
              </button>
              <button
                onClick={() => testRoleUpdate('test1', 'pending', true)}
                disabled={testing}
                className="px-3 py-2 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 disabled:opacity-50"
              >
                {testing ? '⏳' : '⏳'} Make test1 Pending
              </button>
              <button
                onClick={() => testRoleUpdate('test1', null, false)}
                disabled={testing}
                className="px-3 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50"
              >
                {testing ? '⏳' : '🚫'} Deactivate test1
              </button>
            </div>
          </div>

          {/* Test Results */}
          {testResults && (
            <div className="mb-6 p-4 bg-gray-50 rounded">
              <h3 className="font-medium text-gray-900 mb-4">📋 Test Results</h3>
              <div className="space-y-3">
                {testResults.testResults?.map((result, index) => (
                  <div key={index} className={`p-3 rounded border-l-4 ${
                    result.result === 'SUCCESS' ? 'bg-green-50 border-green-400' :
                    result.result === 'WARNING' ? 'bg-yellow-50 border-yellow-400' :
                    'bg-red-50 border-red-400'
                  }`}>
                    <h4 className="font-medium">Step {result.step}: {result.action}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Status: <span className={`font-medium ${
                        result.result === 'SUCCESS' ? 'text-green-600' :
                        result.result === 'WARNING' ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>{result.result}</span>
                    </p>
                    <pre className="text-xs bg-white p-2 rounded mt-2 overflow-x-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
              
              {testResults.recommendations && (
                <div className="mt-4 p-3 bg-blue-50 rounded">
                  <h4 className="font-medium text-blue-900">💡 Recommendations:</h4>
                  <ul className="text-sm text-blue-800 mt-1 space-y-1">
                    {testResults.recommendations.map((rec, index) => (
                      <li key={index}>• {rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Users Table */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">👥 All Users Status</h2>
              <button
                onClick={fetchUsers}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? '⏳ Loading...' : '🔄 Refresh'}
              </button>
            </div>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading users...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 border-b text-left">Username</th>
                      <th className="px-4 py-2 border-b text-left">Role</th>
                      <th className="px-4 py-2 border-b text-left">Active</th>
                      <th className="px-4 py-2 border-b text-left">College</th>
                      <th className="px-4 py-2 border-b text-left">Last Update</th>
                      <th className="px-4 py-2 border-b text-left">Needs Refresh</th>
                      <th className="px-4 py-2 border-b text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.username} className={`${
                        !user.isActive ? 'bg-red-50' : 
                        user.needsRefresh ? 'bg-yellow-50' : ''
                      }`}>
                        <td className="px-4 py-2 border-b font-mono text-xs">{user.username}</td>
                        <td className="px-4 py-2 border-b">
                          <span className={`px-2 py-1 rounded text-xs ${
                            user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                            user.role === 'super-mentor' ? 'bg-blue-100 text-blue-800' :
                            user.role === 'mentor' ? 'bg-green-100 text-green-800' :
                            user.role === 'intern' ? 'bg-gray-100 text-gray-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 py-2 border-b">
                          {user.isActive ? '✅' : '❌'}
                        </td>
                        <td className="px-4 py-2 border-b text-xs">{user.college}</td>
                        <td className="px-4 py-2 border-b text-xs">
                          {user.timeSinceUpdate ? `${user.timeSinceUpdate}s ago` : 'N/A'}
                        </td>
                        <td className="px-4 py-2 border-b">
                          {user.needsRefresh ? '⚠️ Yes' : '✅ No'}
                        </td>
                        <td className="px-4 py-2 border-b">
                          <div className="flex space-x-1">
                            <button
                              onClick={() => testRoleUpdate(user.username, 'intern', true)}
                              className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                            >
                              👨‍🎓 Intern
                            </button>
                            <button
                              onClick={() => testRoleUpdate(user.username, 'mentor', true)}
                              className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                            >
                              👨‍💼 Mentor
                            </button>
                            <button
                              onClick={() => forceRefreshSession(user.username)}
                              className="px-2 py-1 bg-orange-600 text-white rounded text-xs hover:bg-orange-700"
                            >
                              🔄 Refresh
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="border-t pt-4">
            <h2 className="text-lg font-semibold mb-4">🚀 Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={() => window.location.href = '/debug/roles'}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                🔧 Role Debug Page
              </button>
              <button
                onClick={() => window.location.href = '/debug'}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                📊 Full Debug Dashboard
              </button>
              <button
                onClick={() => window.location.href = '/admin/dashboard'}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                🏠 Admin Dashboard
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                🔄 Reload Page
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}