'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export function UserActivationManagement() {
  const { data: session } = useSession();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, inactive
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

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
      } else {
        console.error('Failed to fetch users:', data.error);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserActivation = async (username, currentStatus) => {
    if (!confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} user ${username}?`)) {
      return;
    }

    try {
      setActivating(true);
      const response = await fetch('/api/debug/activate-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          gitlabUsername: username, 
          activate: !currentStatus 
        })
      });
      
      const result = await response.json();
      if (response.ok) {
        alert(result.message);
        fetchUsers(); // Refresh the list
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setActivating(false);
    }
  };

  const bulkActivateUsers = async (usernames, activate) => {
    if (!confirm(`Are you sure you want to ${activate ? 'activate' : 'deactivate'} ${usernames.length} users?`)) {
      return;
    }

    try {
      setActivating(true);
      const promises = usernames.map(username => 
        fetch('/api/debug/activate-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gitlabUsername: username, activate })
        })
      );
      
      await Promise.all(promises);
      alert(`${activate ? 'Activated' : 'Deactivated'} ${usernames.length} users successfully`);
      fetchUsers();
    } catch (error) {
      alert(`Error in bulk operation: ${error.message}`);
    } finally {
      setActivating(false);
    }
  };

  const forceRefreshSession = async (username) => {
    try {
      const response = await fetch('/api/admin/reset-user-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      const result = await response.json();
      if (response.ok) {
        alert(`Session reset for ${username}. User should refresh their browser.`);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  const testUserLogin = async (username) => {
    try {
      const response = await fetch('/api/debug/test-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      const result = await response.json();
      
      if (result.canLogin) {
        alert(`✅ ${username} can log in successfully!\nChecks passed: ${Object.keys(result.checks).filter(k => result.checks[k]).join(', ')}`);
      } else {
        const issueDetails = result.issues.join(', ');
        if (confirm(`❌ ${username} has login issues: ${issueDetails}\n\nWould you like to auto-fix these issues?`)) {
          await autoFixUserIssues(username, result.issues);
        }
      }
    } catch (error) {
      alert(`Error testing login: ${error.message}`);
    }
  };

  const autoFixUserIssues = async (username, issues) => {
    try {
      setActivating(true);
      
      // Fix mentor assignment if needed
      if (issues.includes('hasTech LeadIfNeeded')) {
        const response = await fetch('/api/debug/fix-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, action: 'fix_mentor_assignment' })
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error);
        }
      }
      
      alert(`✅ Fixed issues for ${username}. Please test login again.`);
      fetchUsers(); // Refresh the user list
    } catch (error) {
      alert(`Error fixing user issues: ${error.message}`);
    } finally {
      setActivating(false);
    }
  };

  // Selection management functions
  const handleSelectUser = (username) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(username)) {
      newSelected.delete(username);
    } else {
      newSelected.add(username);
    }
    setSelectedUsers(newSelected);
    setSelectAll(newSelected.size === filteredUsers.length && filteredUsers.length > 0);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedUsers(new Set());
      setSelectAll(false);
    } else {
      const allUsernames = filteredUsers.map(user => user.username).filter(Boolean);
      setSelectedUsers(new Set(allUsernames));
      setSelectAll(true);
    }
  };

  const clearSelection = () => {
    setSelectedUsers(new Set());
    setSelectAll(false);
  };

  const bulkActivateSelected = async (activate) => {
    const selectedUsersList = Array.from(selectedUsers);
    if (selectedUsersList.length === 0) {
      alert('Please select at least one user.');
      return;
    }

    if (!confirm(`Are you sure you want to ${activate ? 'activate' : 'deactivate'} ${selectedUsersList.length} selected users?`)) {
      return;
    }

    try {
      setActivating(true);
      const promises = selectedUsersList.map(username => 
        fetch('/api/debug/activate-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gitlabUsername: username, activate })
        })
      );
      
      await Promise.all(promises);
      alert(`${activate ? 'Activated' : 'Deactivated'} ${selectedUsersList.length} selected users successfully`);
      clearSelection();
      fetchUsers();
    } catch (error) {
      alert(`Error in bulk operation: ${error.message}`);
    } finally {
      setActivating(false);
    }
  };

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = (user.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.college || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && user.isActive) ||
                         (statusFilter === 'inactive' && !user.isActive);
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesStatus && matchesRole;
  });

  const inactiveUsers = filteredUsers.filter(user => !user.isActive);
  const activeUsers = filteredUsers.filter(user => user.isActive);
  
  // Update selectAll state when filters change
  useEffect(() => {
    const currentlySelected = Array.from(selectedUsers).filter(username => 
      filteredUsers.some(user => user.username === username && user.username)
    );
    setSelectedUsers(new Set(currentlySelected));
    setSelectAll(currentlySelected.length === filteredUsers.length && filteredUsers.length > 0);
  }, [searchTerm, statusFilter, roleFilter]);

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-center mt-4 text-gray-600">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">👥 User Activation Management</h2>
            <p className="text-gray-600 mt-1">Manage user account activation status</p>
          </div>
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '⏳' : '🔄'} Refresh
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{users.length}</div>
            <div className="text-sm text-gray-600">Total Users</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{activeUsers.length}</div>
            <div className="text-sm text-gray-600">Active Users</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{inactiveUsers.length}</div>
            <div className="text-sm text-gray-600">Inactive Users</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {users.filter(u => u.needsRefresh).length}
            </div>
            <div className="text-sm text-gray-600">Need Session Refresh</div>
          </div>
        </div>

        {/* Inactivity Analysis */}
        {inactiveUsers.length > 0 && (
          <div className="mb-6 p-4 bg-orange-50 border-l-4 border-orange-400 rounded-lg">
            <h3 className="font-medium text-orange-900 mb-2">🔍 Why Users Go Inactive - Analysis</h3>
            <div className="text-sm text-orange-800 space-y-2">
              <p><strong>📋 Current Issues Found:</strong></p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><strong>Missing Tech Leads:</strong> {users.filter(u => u.role === 'AI Developer Intern' && !u.assignedTech Lead && !u.isActive).length} inactive interns need mentor assignment</li>
                <li><strong>Never Logged In:</strong> {users.filter(u => !u.lastLoginAt && !u.isActive).length} users created but never accessed the system</li>
                <li><strong>Login Validation Failures:</strong> Users who failed required field checks during authentication</li>
                <li><strong>Admin Actions:</strong> Some users were manually deactivated for security/management reasons</li>
              </ul>
              <div className="mt-3 p-2 bg-orange-100 rounded">
                <p><strong>💡 How to Fix:</strong></p>
                <ol className="list-decimal list-inside ml-2 space-y-1">
                  <li>Click "🧪 Test Login" to diagnose specific issues</li>
                  <li>Use "✅ Activate" to restore access</li>
                  <li>Check if mentors need to be activated first</li>
                  <li>Verify all required fields are populated</li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex-1 min-w-64">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search by username or college..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="POC">POC</option>
              <option value="Tech Lead">Tech Lead</option>
              <option value="AI Developer Intern">AI Developer Intern</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        {/* Quick Selection Shortcuts */}
        <div className="mb-6 p-3 bg-gray-100 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-gray-700">🎯 Quick Selection</h3>
            {selectedUsers.size > 0 && (
              <span className="text-xs text-blue-600 font-medium">
                {selectedUsers.size} of {filteredUsers.length} selected
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedUsers(new Set(inactiveUsers.map(u => u.username)))}
              className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
            >
              Select All Inactive ({inactiveUsers.length})
            </button>
            <button
              onClick={() => setSelectedUsers(new Set(activeUsers.map(u => u.username)))}
              className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
            >
              Select All Active ({activeUsers.length})
            </button>
            <button
              onClick={() => setSelectedUsers(new Set(filteredUsers.filter(u => u.role === 'pending').map(u => u.username)))}
              className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
            >
              Select All Pending ({filteredUsers.filter(u => u.role === 'pending').length})
            </button>
            <button
              onClick={() => setSelectedUsers(new Set(filteredUsers.filter(u => u.role === 'AI Developer Intern').map(u => u.username)))}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              Select All AI Developer Interns ({filteredUsers.filter(u => u.role === 'AI Developer Intern').length})
            </button>
            {selectedUsers.size > 0 && (
              <button
                onClick={clearSelection}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 border-2 border-gray-300"
              >
                Clear All ({selectedUsers.size})
              </button>
            )}
          </div>
        </div>

        {/* Selection-Based Bulk Actions */}
        {selectedUsers.size > 0 && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-3">
              🎯 Selected Actions ({selectedUsers.size} users selected)
            </h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => bulkActivateSelected(true)}
                disabled={activating}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {activating ? '⏳' : '✅'} Activate Selected ({selectedUsers.size})
              </button>
              <button
                onClick={() => bulkActivateSelected(false)}
                disabled={activating}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                {activating ? '⏳' : '🚫'} Deactivate Selected ({selectedUsers.size})
              </button>
              <button
                onClick={clearSelection}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                🗑️ Clear Selection
              </button>
            </div>
          </div>
        )}

        {/* General Bulk Actions */}
        {(inactiveUsers.length > 0 || activeUsers.filter(u => u.role === 'pending').length > 0) && (
          <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <h3 className="font-medium text-orange-900 mb-3">⚡ Quick Bulk Actions</h3>
            <div className="flex flex-wrap gap-3">
              {inactiveUsers.length > 0 && (
                <button
                  onClick={() => bulkActivateUsers(inactiveUsers.map(u => u.username), true)}
                  disabled={activating}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {activating ? '⏳' : '✅'} Activate All Inactive ({inactiveUsers.length})
                </button>
              )}
              {activeUsers.filter(u => u.role === 'pending').length > 0 && (
                <button
                  onClick={() => bulkActivateUsers(
                    activeUsers.filter(u => u.role === 'pending').map(u => u.username), 
                    false
                  )}
                  disabled={activating}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                >
                  {activating ? '⏳' : '🚫'} Deactivate All Pending ({activeUsers.filter(u => u.role === 'pending').length})
                </button>
              )}
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2">Select All</span>
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  College
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Update
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.username || user.id || Math.random()} className={`${
                  !user.isActive ? 'bg-red-50' : 
                  user.needsRefresh ? 'bg-yellow-50' : ''
                } ${selectedUsers.has(user.username) ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={user.username && selectedUsers.has(user.username)}
                      onChange={() => user.username && handleSelectUser(user.username)}
                      disabled={!user.username || user.username === session?.user?.gitlabUsername}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                    />
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.username || 'No username'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.username === session?.user?.gitlabUsername && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              You
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                      user.role === 'POC' ? 'bg-blue-100 text-blue-800' :
                      user.role === 'Tech Lead' ? 'bg-green-100 text-green-800' :
                      user.role === 'AI Developer Intern' ? 'bg-gray-100 text-gray-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? '✅ Active' : '❌ Inactive'}
                      </span>
                      {user.needsRefresh && (
                        <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          ⚠️ Needs Refresh
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.college}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.timeSinceUpdate ? `${Math.floor(user.timeSinceUpdate / 60)}m ago` : 'N/A'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => user.username && toggleUserActivation(user.username, user.isActive)}
                        disabled={!user.username || activating || user.username === session?.user?.gitlabUsername}
                        className={`px-3 py-1 rounded text-xs font-medium ${
                          user.isActive ? 
                          'bg-red-600 text-white hover:bg-red-700' : 
                          'bg-green-600 text-white hover:bg-green-700'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {activating ? '⏳' : user.isActive ? '🚫 Deactivate' : '✅ Activate'}
                      </button>
                      
                      <button
                        onClick={() => user.username && forceRefreshSession(user.username)}
                        disabled={!user.username}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        🔄 Refresh
                      </button>
                      
                      <button
                        onClick={() => user.username && testUserLogin(user.username)}
                        disabled={!user.username}
                        className="px-3 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        🧪 Test Login
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-4">👥</div>
            <p className="text-gray-500">No users found matching your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}