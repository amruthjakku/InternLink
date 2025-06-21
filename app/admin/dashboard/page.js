'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [filteredColleges, setFilteredColleges] = useState([]);
  
  // Modal states
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAddCollegeModal, setShowAddCollegeModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showEditCollegeModal, setShowEditCollegeModal] = useState(false);
  
  // Form states
  const [newUser, setNewUser] = useState({ gitlabUsername: '', name: '', email: '', role: 'intern', college: '' });
  const [newCollege, setNewCollege] = useState({ name: '', description: '', location: '', website: '', mentorUsername: '' });
  const [editingUser, setEditingUser] = useState(null);
  const [editingCollege, setEditingCollege] = useState(null);
  
  // Search and filter states
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [collegeSearch, setCollegeSearch] = useState('');
  
  // Bulk import states
  const [bulkImportType, setBulkImportType] = useState('users');
  const [bulkImportData, setBulkImportData] = useState('');
  const [bulkImportResults, setBulkImportResults] = useState(null);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/');
      return;
    }

    if (session.user.role !== 'admin') {
      router.push('/');
      return;
    }

    fetchDashboardData();
  }, [session, status]);

  // Filter users when search or filter changes
  useEffect(() => {
    let filtered = users;
    
    if (userSearch) {
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        user.gitlabUsername.toLowerCase().includes(userSearch.toLowerCase()) ||
        user.email.toLowerCase().includes(userSearch.toLowerCase())
      );
    }
    
    if (userRoleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === userRoleFilter);
    }
    
    setFilteredUsers(filtered);
  }, [users, userSearch, userRoleFilter]);

  // Filter colleges when search changes
  useEffect(() => {
    let filtered = colleges;
    
    if (collegeSearch) {
      filtered = filtered.filter(college => 
        college.name.toLowerCase().includes(collegeSearch.toLowerCase()) ||
        college.location.toLowerCase().includes(collegeSearch.toLowerCase()) ||
        college.mentorUsername.toLowerCase().includes(collegeSearch.toLowerCase())
      );
    }
    
    setFilteredColleges(filtered);
  }, [colleges, collegeSearch]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch stats, users, and colleges
      const [statsRes, usersRes, collegesRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/users'),
        fetch('/api/admin/colleges')
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      }

      if (collegesRes.ok) {
        const collegesData = await collegesRes.json();
        setColleges(collegesData);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });

      if (response.ok) {
        setShowAddUserModal(false);
        setNewUser({ gitlabUsername: '', name: '', email: '', role: 'intern', college: '' });
        fetchDashboardData();
        alert('User added successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error adding user:', error);
      alert('Failed to add user');
    }
  };

  const handleAddCollege = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/colleges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCollege)
      });

      if (response.ok) {
        setShowAddCollegeModal(false);
        setNewCollege({ name: '', description: '', location: '', website: '', mentorUsername: '' });
        fetchDashboardData();
        alert('College added successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error adding college:', error);
      alert('Failed to add college');
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/admin/users/${editingUser._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingUser)
      });

      if (response.ok) {
        setShowEditUserModal(false);
        setEditingUser(null);
        fetchDashboardData();
        alert('User updated successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user');
    }
  };

  const handleEditCollege = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/admin/colleges/${editingCollege._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingCollege)
      });

      if (response.ok) {
        setShowEditCollegeModal(false);
        setEditingCollege(null);
        fetchDashboardData();
        alert('College updated successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error updating college:', error);
      alert('Failed to update college');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchDashboardData();
        alert('User deleted successfully!');
      } else {
        alert('Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  const handleDeleteCollege = async (collegeId) => {
    if (!confirm('Are you sure you want to delete this college? This will affect all associated users.')) return;

    try {
      const response = await fetch(`/api/admin/colleges/${collegeId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchDashboardData();
        alert('College deleted successfully!');
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error deleting college:', error);
      alert('Failed to delete college');
    }
  };

  const handleBulkImport = async (e) => {
    e.preventDefault();
    try {
      let data;
      try {
        data = JSON.parse(bulkImportData);
      } catch (parseError) {
        alert('Invalid JSON format. Please check your data.');
        return;
      }

      const response = await fetch(`/api/admin/bulk-import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: bulkImportType,
          data: data
        })
      });

      const result = await response.json();
      setBulkImportResults(result);
      
      if (response.ok) {
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Error with bulk import:', error);
      alert('Failed to process bulk import');
    }
  };

  const exportData = async (type) => {
    try {
      const response = await fetch(`/api/admin/export?type=${type}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}_export_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Failed to export data');
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <img 
                  src={session?.user?.image || session?.user?.profileImage} 
                  alt={session?.user?.name}
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-sm text-gray-700">{session?.user?.name}</span>
                <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                  Admin
                </span>
              </div>
              <button
                onClick={() => signOut()}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: '📊' },
              { id: 'users', name: 'Users', icon: '👥' },
              { id: 'colleges', name: 'Colleges', icon: '🏫' },
              { id: 'bulk-operations', name: 'Bulk Operations', icon: '📦' },
              { id: 'system', name: 'System', icon: '⚙️' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">System Overview</h2>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">👥</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Users</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.totalUsers || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">🏫</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Colleges</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.totalColleges || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">👨‍🏫</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Mentors</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.totalMentors || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">🧑‍💻</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Interns</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.totalInterns || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setShowAddUserModal(true)}
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <div className="text-center">
                    <span className="text-2xl mb-2 block">👤</span>
                    <span className="text-sm font-medium">Add User</span>
                  </div>
                </button>
                <button
                  onClick={() => setShowAddCollegeModal(true)}
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <div className="text-center">
                    <span className="text-2xl mb-2 block">🏫</span>
                    <span className="text-sm font-medium">Add College</span>
                  </div>
                </button>
                <button
                  onClick={() => setShowBulkImportModal(true)}
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <div className="text-center">
                    <span className="text-2xl mb-2 block">📦</span>
                    <span className="text-sm font-medium">Bulk Import</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
              <div className="flex space-x-3">
                <button
                  onClick={() => exportData('users')}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  Export Users
                </button>
                <button
                  onClick={() => setShowAddUserModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Add User
                </button>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search Users</label>
                  <input
                    type="text"
                    placeholder="Search by name, username, or email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Role</label>
                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="all">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="mentor">Mentor</option>
                    <option value="intern">Intern</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      College
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Login
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <img 
                            src={user.profileImage || `https://gitlab.com/${user.gitlabUsername}.png`} 
                            alt={user.name}
                            className="w-8 h-8 rounded-full mr-3"
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">@{user.gitlabUsername}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          user.role === 'admin' ? 'bg-red-100 text-red-800' :
                          user.role === 'mentor' ? 'bg-green-100 text-green-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.college?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setEditingUser({...user, college: user.college?._id || ''});
                              setShowEditUserModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredUsers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No users found matching your criteria.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Colleges Tab */}
        {activeTab === 'colleges' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">College Management</h2>
              <div className="flex space-x-3">
                <button
                  onClick={() => exportData('colleges')}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  Export Colleges
                </button>
                <button
                  onClick={() => setShowAddCollegeModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Add College
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="bg-white rounded-lg shadow p-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search Colleges</label>
                <input
                  type="text"
                  placeholder="Search by name, location, or mentor..."
                  value={collegeSearch}
                  onChange={(e) => setCollegeSearch(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
            </div>

            {/* Colleges Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredColleges.map((college) => (
                <div key={college._id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-medium text-gray-900">{college.name}</h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setEditingCollege(college);
                          setShowEditCollegeModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteCollege(college._id)}
                        className="text-red-600 hover:text-red-900 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{college.description || 'No description'}</p>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Mentor:</span> @{college.mentorUsername}
                    </div>
                    <div>
                      <span className="font-medium">Location:</span> {college.location || 'Not specified'}
                    </div>
                    <div>
                      <span className="font-medium">Interns:</span> {college.internsCount || 0}
                    </div>
                    {college.website && (
                      <div>
                        <span className="font-medium">Website:</span> 
                        <a href={college.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 ml-1">
                          Visit
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {filteredColleges.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>No colleges found matching your criteria.</p>
              </div>
            )}
          </div>
        )}

        {/* Bulk Operations Tab */}
        {activeTab === 'bulk-operations' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Bulk Operations</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bulk Import */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Bulk Import</h3>
                <button
                  onClick={() => setShowBulkImportModal(true)}
                  className="w-full bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700"
                >
                  Start Bulk Import
                </button>
                <p className="text-sm text-gray-500 mt-2">
                  Import multiple users or colleges from JSON data
                </p>
              </div>

              {/* Export Options */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Export Data</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => exportData('users')}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                  >
                    Export All Users
                  </button>
                  <button
                    onClick={() => exportData('colleges')}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                  >
                    Export All Colleges
                  </button>
                  <button
                    onClick={() => exportData('all')}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                  >
                    Export Everything
                  </button>
                </div>
              </div>
            </div>

            {/* Template Examples */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Import Templates</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Users Template</h4>
                  <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`[
  {
    "gitlabUsername": "john.doe",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "role": "intern",
    "college": "College Name"
  }
]`}
                  </pre>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Colleges Template</h4>
                  <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`[
  {
    "name": "Example College",
    "description": "A great college",
    "location": "City, State",
    "website": "https://example.edu",
    "mentorUsername": "mentor.username"
  }
]`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* System Tab */}
        {activeTab === 'system' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">System Settings</h2>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Database Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-green-500 text-xl mr-2">✅</span>
                    <span className="font-medium">Database Connected</span>
                  </div>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center">
                    <span className="text-blue-500 text-xl mr-2">🔐</span>
                    <span className="font-medium">Authentication Active</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">System Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{stats.totalUsers || 0}</div>
                  <div className="text-sm text-gray-500">Total Users</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{stats.totalColleges || 0}</div>
                  <div className="text-sm text-gray-500">Total Colleges</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {stats.totalUsers && stats.totalColleges ? 
                      (stats.totalUsers / stats.totalColleges).toFixed(1) : '0'}
                  </div>
                  <div className="text-sm text-gray-500">Avg Users/College</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-screen overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add New User</h3>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">GitLab Username *</label>
                <input
                  type="text"
                  required
                  value={newUser.gitlabUsername}
                  onChange={(e) => setNewUser({...newUser, gitlabUsername: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Enter GitLab username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email *</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Role *</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="intern">Intern</option>
                  <option value="mentor">Mentor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {(newUser.role === 'mentor' || newUser.role === 'intern') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    College {newUser.role === 'intern' ? '*' : '(Optional)'}
                  </label>
                  <select
                    required={newUser.role === 'intern'}
                    value={newUser.college}
                    onChange={(e) => setNewUser({...newUser, college: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">Select College</option>
                    {colleges.map((college) => (
                      <option key={college._id} value={college._id}>{college.name}</option>
                    ))}
                  </select>
                  {newUser.role === 'mentor' && (
                    <p className="text-xs text-gray-500 mt-1">
                      Leave empty if creating college later
                    </p>
                  )}
                </div>
              )}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddUserModal(false);
                    setNewUser({ gitlabUsername: '', name: '', email: '', role: 'intern', college: '' });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUserModal && editingUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-screen overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Edit User</h3>
            <form onSubmit={handleEditUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">GitLab Username</label>
                <input
                  type="text"
                  disabled
                  value={editingUser.gitlabUsername}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100"
                />
                <p className="text-xs text-gray-500 mt-1">GitLab username cannot be changed</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name *</label>
                <input
                  type="text"
                  required
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email *</label>
                <input
                  type="email"
                  required
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Role *</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="intern">Intern</option>
                  <option value="mentor">Mentor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {(editingUser.role === 'mentor' || editingUser.role === 'intern') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    College {editingUser.role === 'intern' ? '*' : '(Optional)'}
                  </label>
                  <select
                    required={editingUser.role === 'intern'}
                    value={editingUser.college}
                    onChange={(e) => setEditingUser({...editingUser, college: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">Select College</option>
                    {colleges.map((college) => (
                      <option key={college._id} value={college._id}>{college.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditUserModal(false);
                    setEditingUser(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Update User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add College Modal */}
      {showAddCollegeModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-screen overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add New College</h3>
            <form onSubmit={handleAddCollege} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">College Name *</label>
                <input
                  type="text"
                  required
                  value={newCollege.name}
                  onChange={(e) => setNewCollege({...newCollege, name: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Enter college name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={newCollege.description}
                  onChange={(e) => setNewCollege({...newCollege, description: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  rows="3"
                  placeholder="Enter college description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <input
                  type="text"
                  value={newCollege.location}
                  onChange={(e) => setNewCollege({...newCollege, location: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Enter location"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Website</label>
                <input
                  type="url"
                  value={newCollege.website}
                  onChange={(e) => setNewCollege({...newCollege, website: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="https://example.edu"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Mentor GitLab Username</label>
                <input
                  type="text"
                  value={newCollege.mentorUsername}
                  onChange={(e) => setNewCollege({...newCollege, mentorUsername: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Enter mentor's GitLab username (optional)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty to assign mentor later
                </p>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddCollegeModal(false);
                    setNewCollege({ name: '', description: '', location: '', website: '', mentorUsername: '' });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add College
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit College Modal */}
      {showEditCollegeModal && editingCollege && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-screen overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Edit College</h3>
            <form onSubmit={handleEditCollege} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">College Name *</label>
                <input
                  type="text"
                  required
                  value={editingCollege.name}
                  onChange={(e) => setEditingCollege({...editingCollege, name: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={editingCollege.description}
                  onChange={(e) => setEditingCollege({...editingCollege, description: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  rows="3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Location</label>
                <input
                  type="text"
                  value={editingCollege.location}
                  onChange={(e) => setEditingCollege({...editingCollege, location: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Website</label>
                <input
                  type="url"
                  value={editingCollege.website}
                  onChange={(e) => setEditingCollege({...editingCollege, website: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Mentor GitLab Username</label>
                <input
                  type="text"
                  value={editingCollege.mentorUsername}
                  onChange={(e) => setEditingCollege({...editingCollege, mentorUsername: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditCollegeModal(false);
                    setEditingCollege(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Update College
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showBulkImportModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-screen overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Bulk Import</h3>
            <form onSubmit={handleBulkImport} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Import Type</label>
                <select
                  value={bulkImportType}
                  onChange={(e) => setBulkImportType(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="users">Users</option>
                  <option value="colleges">Colleges</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">JSON Data</label>
                <textarea
                  value={bulkImportData}
                  onChange={(e) => setBulkImportData(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                  rows="15"
                  placeholder={bulkImportType === 'users' ? 
                    `[{"gitlabUsername": "john.doe", "name": "John Doe", "email": "john@example.com", "role": "intern", "college": "College Name"}]` :
                    `[{"name": "Example College", "description": "A great college", "location": "City, State", "website": "https://example.edu", "mentorUsername": "mentor.username"}]`
                  }
                />
              </div>
              
              {bulkImportResults && (
                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="font-medium text-gray-900 mb-2">Import Results</h4>
                  <div className="text-sm">
                    <p className="text-green-600">✅ Successful: {bulkImportResults.successful || 0}</p>
                    <p className="text-red-600">❌ Failed: {bulkImportResults.failed || 0}</p>
                    {bulkImportResults.errors && bulkImportResults.errors.length > 0 && (
                      <div className="mt-2">
                        <p className="font-medium">Errors:</p>
                        <ul className="list-disc list-inside">
                          {bulkImportResults.errors.map((error, index) => (
                            <li key={index} className="text-red-600">{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowBulkImportModal(false);
                    setBulkImportData('');
                    setBulkImportResults(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Import Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}