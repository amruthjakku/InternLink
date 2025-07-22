'use client';

import { useState, useEffect } from 'react';

export default function UserRegistrationDebugPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newUser, setNewUser] = useState({
    gitlabUsername: '',
    name: '',
    email: '',
    role: 'AI developer Intern',
    isActive: true
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/debug/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        setError('Failed to fetch users');
      }
    } catch (err) {
      setError('Error fetching users: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const addUser = async () => {
    try {
      if (!newUser.gitlabUsername || !newUser.name || !newUser.email) {
        alert('Please fill in all required fields');
        return;
      }

      const response = await fetch('/api/debug/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });

      if (response.ok) {
        alert('User added successfully!');
        setNewUser({
          gitlabUsername: '',
          name: '',
          email: '',
          role: 'AI developer Intern',
          isActive: true
        });
        fetchUsers();
      } else {
        const errorData = await response.json();
        alert('Failed to add user: ' + errorData.error);
      }
    } catch (err) {
      alert('Error adding user: ' + err.message);
    }
  };

  const activateUser = async (userId, gitlabUsername) => {
    try {
      const response = await fetch('/api/debug/activate-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gitlabUsername,
          activate: true
        })
      });

      if (response.ok) {
        alert('User activated successfully!');
        fetchUsers();
      } else {
        const errorData = await response.json();
        alert('Failed to activate user: ' + errorData.error);
      }
    } catch (err) {
      alert('Error activating user: ' + err.message);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user =>
    user.gitlabUsername?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            🔧 User Registration Debug Tool
          </h1>
          <p className="text-gray-600 mb-6">
            This tool helps you debug and fix user registration issues. You can view existing users and add new ones.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Add New User */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-blue-900 mb-4">
                Add New User
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    GitLab Username *
                  </label>
                  <input
                    type="text"
                    value={newUser.gitlabUsername}
                    onChange={(e) => setNewUser({...newUser, gitlabUsername: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter GitLab username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="AI developer Intern">AI developer Intern</option>
                    <option value="Tech Lead">Tech Lead</option>
                    <option value="POC">POC</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <button
                  onClick={addUser}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Add User
                </button>
              </div>
            </div>

            {/* Search Users */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Search Existing Users
              </h2>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                placeholder="Search by username, name, or email"
              />
            </div>
          </div>
        </div>

        {/* Users List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Users in Database ({loading ? '...' : filteredUsers.length})
            </h2>
          </div>

          {error && (
            <div className="px-6 py-4 bg-red-50 text-red-700 border-b border-gray-200">
              {error}
            </div>
          )}

          {loading ? (
            <div className="px-6 py-8 text-center">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              Loading users...
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500">
                  No users found
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <div key={user._id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-900">
                              {user.name}
                            </h3>
                            <p className="text-sm text-gray-500">
                              @{user.gitlabUsername} • {user.email}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          user.role === 'admin' ? 'bg-red-100 text-red-800' :
                          user.role === 'POC' ? 'bg-blue-100 text-blue-800' :
                          user.role === 'Tech Lead' ? 'bg-green-100 text-green-800' :
                          user.role === 'AI developer Intern' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                        {!user.isActive && (
                          <button
                            onClick={() => activateUser(user._id, user.gitlabUsername)}
                            className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                          >
                            Activate
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-yellow-800 font-medium mb-2">How to fix the registration issue:</h3>
          <ol className="text-yellow-700 text-sm space-y-1 ml-4 list-decimal">
            <li>Find your GitLab username in the list above</li>
            <li>If you're not in the list, add yourself using the form</li>
            <li>If you're in the list but inactive, click "Activate"</li>
            <li>Try logging in again after making changes</li>
          </ol>
        </div>
      </div>
    </div>
  );
}