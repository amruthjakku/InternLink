'use client';

import { useState, useEffect } from 'react';
import { EnhancedBarChart, ActivityHeatmap, MetricCard } from '../Charts';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { getCollegeName } from '../../utils/helpers';

export function AdvancedUserManagement() {
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [userSegments, setUserSegments] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [bulkActions, setBulkActions] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCollege, setFilterCollege] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchUserSegments();
    fetchActivityLogs();
    fetchPermissions();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        console.error('Failed to fetch users');
        setUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    }
  };

  const fetchUserSegments = async () => {
    try {
      const response = await fetch('/api/admin/user-segments');
      if (response.ok) {
        const data = await response.json();
        // Map the API response to match component expectations
        const mappedSegments = (data.segments || []).map(segment => ({
          id: segment.id,
          name: segment.name,
          description: segment.description,
          userCount: segment.count || segment.userCount || 0,
          color: segment.color
        }));
        setUserSegments(mappedSegments);
      } else {
        // Fallback to basic segments calculated from users
        setUserSegments([
          { id: 1, name: 'Active Users', userCount: 0, color: '#10B981', description: 'Users active in the last 7 days' },
          { id: 2, name: 'Inactive Users', userCount: 0, color: '#6B7280', description: 'Users not active recently' },
          { id: 3, name: 'Interns', userCount: 0, color: '#3B82F6', description: 'Users with intern role' },
          { id: 4, name: 'Mentors', userCount: 0, color: '#F59E0B', description: 'Users with mentor role' }
        ]);
      }
    } catch (error) {
      console.error('Error fetching user segments:', error);
      setUserSegments([]);
    }
  };

  const fetchActivityLogs = async () => {
    try {
      const response = await fetch('/api/admin/activity-logs');
      if (response.ok) {
        const data = await response.json();
        setActivityLogs(data.logs || []);
      } else {
        setActivityLogs([]);
      }
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      setActivityLogs([]);
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await fetch('/api/admin/permissions');
      if (response.ok) {
        const data = await response.json();
        setPermissions(data.permissions || []);
      } else {
        // Fallback to basic permissions
        setPermissions([
          { id: 1, name: 'View Dashboard', description: 'Access to main dashboard', roles: ['intern', 'mentor', 'admin'] },
          { id: 2, name: 'Manage Tasks', description: 'Create and edit tasks', roles: ['mentor', 'admin'] },
          { id: 3, name: 'View Reports', description: 'Access to analytics and reports', roles: ['mentor', 'admin'] },
          { id: 4, name: 'Manage Users', description: 'Add, edit, and delete users', roles: ['admin'] },
          { id: 5, name: 'System Settings', description: 'Modify system configuration', roles: ['admin'] },
          { id: 6, name: 'Bulk Operations', description: 'Perform bulk user operations', roles: ['admin'] }
        ]);
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
      setPermissions([]);
    }
  };

  const handleSendMessage = async (userId) => {
    // This would open a messaging modal or redirect to messaging system
    console.log('Send message to user:', userId);
    alert('Messaging functionality would be implemented here');
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setIsEditMode(true);
    setEditFormData({
      id: user.id,
      name: user.name,
      email: user.email,
      gitlabUsername: user.gitlabUsername,
      role: user.role,
      college: user.college,
      status: user.status
    });
    setShowUserModal(true);
  };

  const handleSaveUser = async (userData) => {
    try {
      console.log('Saving user data:', userData);
      const url = userData.id ? `/api/admin/users/${userData.id}` : '/api/admin/users';
      const method = userData.id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      console.log('Response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Success result:', result);
        fetchUsers(); // Refresh the user list
        setShowUserModal(false);
        setSelectedUser(null);
        setIsEditMode(false);
        setEditFormData({});
        alert(userData.id ? 'User updated successfully' : 'User created successfully');
      } else {
        const error = await response.json();
        console.error('API Error Response:', error);
        console.error('Response status:', response.status);
        alert(`Error: ${error.error || error.message || 'Failed to save user'}`);
      }
    } catch (error) {
      console.error('Network/Parse Error:', error);
      alert(`Error saving user: ${error.message}`);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchUsers(); // Refresh the user list
        alert('User deleted successfully');
      } else {
        alert('Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error deleting user');
    }
  };

  const handleViewFullActivity = (userId) => {
    // This would open a detailed activity view
    console.log('View full activity for user:', userId);
    alert('Full activity view would be implemented here');
  };

  const handleResetPassword = async (userId) => {
    if (!confirm('Are you sure you want to reset this user\'s password?')) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: 'POST',
      });

      if (response.ok) {
        alert('Password reset email sent successfully');
      } else {
        alert('Failed to reset password');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      alert('Error resetting password');
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'active' ? 'activate' : 'deactivate';

    if (!confirm(`Are you sure you want to ${action} this user?`)) return;

    try {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setUsers(prev => prev.map(user => 
          user.id === userId ? { ...user, status: newStatus } : user
        ));
        if (selectedUser && selectedUser.id === userId) {
          setSelectedUser(prev => ({ ...prev, status: newStatus }));
        }
      } else {
        alert(`Failed to ${action} user`);
      }
    } catch (error) {
      console.error(`Error ${action}ing user:`, error);
      alert(`Error ${action}ing user`);
    }
  };

  const handleAddUser = () => {
    setSelectedUser(null);
    setIsEditMode(true);
    setEditFormData({
      name: '',
      email: '',
      gitlabUsername: '',
      role: 'intern',
      college: '',
      status: 'active'
    });
    setShowUserModal(true);
  };

  const handleBulkAction = async (action, userIds) => {
    try {
      const response = await fetch('/api/admin/users/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, userIds }),
      });

      if (response.ok) {
        fetchUsers(); // Refresh the user list
        setSelectedUsers([]);
        setShowBulkModal(false);
      } else {
        alert('Failed to perform bulk action');
      }
    } catch (error) {
      console.error('Error performing bulk action:', error);
      alert('Error performing bulk action');
    }
  };

  // Filter users
  const filteredUsers = (users && Array.isArray(users)) ? users.filter(user => {
    if (filterRole !== 'all' && user.role !== filterRole) return false;
    if (filterStatus !== 'all' && user.status !== filterStatus) return false;
    if (filterCollege !== 'all' && user.college !== filterCollege) return false;
    if (searchTerm && !user.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !user.email.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  }) : [];

  // Calculate metrics
  const totalUsers = (users && Array.isArray(users)) ? users.length : 0;
  const activeUsers = (users && Array.isArray(users)) ? users.filter(u => u.status === 'active').length : 0;
  const avgPerformance = (users && Array.isArray(users) && users.length > 0) 
    ? Math.round(users.reduce((sum, user) => sum + user.performanceScore, 0) / users.length)
    : 0;
  const atRiskUsers = (users && Array.isArray(users)) ? users.filter(u => u.riskLevel === 'high').length : 0;

  // User distribution data
  const roleDistributionData = {
    labels: ['Interns', 'Mentors', 'Admins'],
    datasets: [{
      data: [
        (users && Array.isArray(users)) ? users.filter(u => u.role === 'intern').length : 0,
        (users && Array.isArray(users)) ? users.filter(u => u.role === 'mentor').length : 0,
        (users && Array.isArray(users)) ? users.filter(u => u.role === 'admin').length : 0
      ],
      backgroundColor: ['#3B82F6', '#10B981', '#F59E0B']
    }]
  };

  // Activity level data
  const activityLevelData = {
    labels: ['High', 'Medium', 'Low'],
    datasets: [{
      data: [
        (users && Array.isArray(users)) ? users.filter(u => u.activityLevel === 'high').length : 0,
        (users && Array.isArray(users)) ? users.filter(u => u.activityLevel === 'medium').length : 0,
        (users && Array.isArray(users)) ? users.filter(u => u.activityLevel === 'low').length : 0
      ],
      backgroundColor: ['#10B981', '#F59E0B', '#EF4444']
    }]
  };

  const getRiskColor = (level) => {
    switch (level) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getActivityColor = (level) => {
    switch (level) {
      case 'high': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const UserModal = () => {
    if (!showUserModal) return null;

    const handleFormSubmit = (e) => {
      e.preventDefault();
      handleSaveUser(editFormData);
    };

    const handleCloseModal = () => {
      setShowUserModal(false);
      setSelectedUser(null);
      setIsEditMode(false);
      setEditFormData({});
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {isEditMode ? (selectedUser ? 'Edit User' : 'Add New User') : selectedUser?.name}
                </h2>
                {!isEditMode && selectedUser && (
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>📧 {selectedUser.email}</span>
                    <span>🏫 {selectedUser.college}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      selectedUser.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedUser.status}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRiskColor(selectedUser.riskLevel)}`}>
                      {selectedUser.riskLevel} risk
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
          </div>

          {/* Modal Content */}
          <div className="p-6">
            {isEditMode ? (
              /* Edit Form */
              <form onSubmit={handleFormSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={editFormData.name || ''}
                      onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={editFormData.email || ''}
                      onChange={(e) => {
                        const email = e.target.value;
                        setEditFormData({
                          ...editFormData, 
                          email: email,
                          // Auto-generate GitLab username from email if it's empty
                          gitlabUsername: editFormData.gitlabUsername || email.split('@')[0].toLowerCase()
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      GitLab Username *
                    </label>
                    <input
                      type="text"
                      value={editFormData.gitlabUsername || ''}
                      onChange={(e) => setEditFormData({...editFormData, gitlabUsername: e.target.value.toLowerCase()})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter GitLab username"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      This will be auto-filled from email, but you can customize it
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role *
                    </label>
                    <select
                      value={editFormData.role || 'intern'}
                      onChange={(e) => setEditFormData({...editFormData, role: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="intern">Intern</option>
                      <option value="mentor">Mentor</option>
                      <option value="super-mentor">Super-Mentor</option>
                      <option value="admin">Admin</option>
                      <option value="super-admin">Super-Admin</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status *
                    </label>
                    <select
                      value={editFormData.status || 'active'}
                      onChange={(e) => setEditFormData({...editFormData, status: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  
                  {(editFormData.role === 'intern' || editFormData.role === 'mentor' || editFormData.role === 'super-mentor') && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        College {editFormData.role === 'intern' ? '*' : ''}
                      </label>
                      <input
                        type="text"
                        value={editFormData.college || ''}
                        onChange={(e) => setEditFormData({...editFormData, college: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter college name"
                        required={editFormData.role === 'intern'}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {editFormData.role === 'intern' ? 'Required for intern role' : 'Optional for mentors'}
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {selectedUser ? 'Update User' : 'Create User'}
                  </button>
                </div>
              </form>
            ) : (
              /* View Mode */
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User Stats */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">User Statistics</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {selectedUser?.performanceScore || 0}
                      </div>
                      <div className="text-sm text-blue-800">Performance Score</div>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {selectedUser?.loginCount || 0}
                      </div>
                      <div className="text-sm text-green-800">Total Logins</div>
                    </div>
                    
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {selectedUser?.avgSessionTime || 0}m
                      </div>
                      <div className="text-sm text-purple-800">Avg Session</div>
                    </div>
                    
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {selectedUser?.role === 'intern' ? `${selectedUser?.tasksCompleted || 0}/${selectedUser?.totalTasks || 0}` : 'N/A'}
                      </div>
                      <div className="text-sm text-orange-800">Tasks Completed</div>
                    </div>
                  </div>

                  {/* User Details */}
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">GitLab Username</span>
                      <span className="text-sm font-medium text-gray-900">@{selectedUser?.gitlabUsername}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Role</span>
                      <span className="text-sm font-medium text-gray-900 capitalize">{selectedUser?.role}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Join Date</span>
                      <span className="text-sm font-medium text-gray-900">
                        {selectedUser?.joinDate ? new Date(selectedUser.joinDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Last Active</span>
                      <span className="text-sm font-medium text-gray-900">
                        {selectedUser?.lastActive ? new Date(selectedUser.lastActive).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Activity Level</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActivityColor(selectedUser?.activityLevel)}`}>
                        {selectedUser?.activityLevel}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Recent Activity</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {activityLogs
                      .filter(log => log.userId === selectedUser?.id)
                      .slice(0, 10)
                      .map(log => (
                        <div key={log.id} className="text-sm text-gray-600 p-2 bg-gray-50 rounded">
                          <div className="font-medium">{log.action}</div>
                          <div className="text-xs text-gray-500">
                            {log.timestamp.toLocaleString()}
                          </div>
                        </div>
                      ))}
                    {(!activityLogs || activityLogs.filter(log => log.userId === selectedUser?.id).length === 0) && (
                      <p className="text-gray-500 text-sm">No recent activity</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons - Only show in view mode */}
            {!isEditMode && selectedUser && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex flex-wrap gap-3">
                  <button 
                    onClick={() => handleSendMessage(selectedUser.id)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Send Message
                  </button>
                  <button 
                    onClick={() => handleEditUser(selectedUser)}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    Edit User
                  </button>
                  <button 
                    onClick={() => handleViewFullActivity(selectedUser.id)}
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                  >
                    View Full Activity
                  </button>
                  <button 
                    onClick={() => handleResetPassword(selectedUser.id)}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    Reset Password
                  </button>
                  {selectedUser.status === 'active' ? (
                    <button 
                      onClick={() => handleToggleUserStatus(selectedUser.id, selectedUser.status)}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      Deactivate
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleToggleUserStatus(selectedUser.id, selectedUser.status)}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                      Activate
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total Users"
          value={totalUsers}
          icon="👥"
          color="blue"
        />
        <MetricCard
          title="Active Users"
          value={activeUsers}
          icon="✅"
          color="green"
        />
        <MetricCard
          title="Avg Performance"
          value={`${avgPerformance}%`}
          icon="📊"
          color="purple"
        />
        <MetricCard
          title="At Risk Users"
          value={atRiskUsers}
          icon="⚠️"
          color="red"
        />
      </div>

      {/* User Segments */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4">👥 User Segments</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {userSegments.map(segment => (
            <div key={segment.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">{segment.name}</h4>
                <span className={`w-3 h-3 rounded-full bg-${segment.color}-500`}></span>
              </div>
              <p className="text-sm text-gray-600 mb-3">{segment.description}</p>
              <div className="text-2xl font-bold text-gray-900">{segment.userCount}</div>
              <div className="text-xs text-gray-500">users</div>
            </div>
          ))}
        </div>
      </div>

      {/* User Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">📊 Role Distribution</h3>
          <EnhancedBarChart data={roleDistributionData} height={250} />
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">🎯 Activity Levels</h3>
          <EnhancedBarChart data={activityLevelData} height={250} />
        </div>
      </div>

      {/* User Management Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowBulkModal(true)}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                Bulk Actions
              </button>
              <button 
                onClick={handleAddUser}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                + Add User
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Roles</option>
              <option value="intern">Interns</option>
              <option value="mentor">Mentors</option>
              <option value="super-mentor">Super-Mentors</option>
              <option value="admin">Admins</option>
            </select>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            
            <select
              value={filterCollege}
              onChange={(e) => setFilterCollege(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Colleges</option>
              {users && Array.isArray(users) ? [...new Set(users.map(u => u.college))].map(college => (
                <option key={college} value={college}>{college}</option>
              )) : null}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input type="checkbox" className="rounded" />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  GitLab Username
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  College
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Activity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risk Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Active
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input type="checkbox" className="rounded" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                        {user.name.charAt(0)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">@{user.gitlabUsername}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'super-admin' ? 'bg-purple-100 text-purple-800' :
                      user.role === 'admin' ? 'bg-red-100 text-red-800' :
                      user.role === 'mentor' ? 'bg-green-100 text-green-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getCollegeName(user.college)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900 mr-2">
                        {user.performanceScore}%
                      </span>
                      <div className={`w-2 h-2 rounded-full ${
                        user.performanceScore >= 90 ? 'bg-green-500' :
                        user.performanceScore >= 70 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`} />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActivityColor(user.activityLevel)}`}>
                      {user.activityLevel}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRiskColor(user.riskLevel)}`}>
                      {user.riskLevel}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.lastActive).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setIsEditMode(false);
                          setShowUserModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        👁️
                      </button>
                      <button
                        onClick={() => handleEditUser(user)}
                        className="text-green-600 hover:text-green-900"
                        title="Edit User"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleToggleUserStatus(user.id, user.status)}
                        className={user.status === 'active' ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}
                        title={user.status === 'active' ? 'Deactivate' : 'Activate'}
                      >
                        {user.status === 'active' ? '🚫' : '✅'}
                      </button>
                      <button
                        onClick={() => handleResetPassword(user.id)}
                        className="text-orange-600 hover:text-orange-900"
                        title="Reset Password"
                      >
                        🔑
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete User"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Activity Logs */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4">📋 Recent Activity Logs</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {activityLogs.slice(0, 20).map(log => (
            <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {log.userName.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {log.userName} - {log.action}
                  </div>
                  <div className="text-xs text-gray-500">
                    {log.timestamp.toLocaleString()} • {log.ipAddress}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => {
                  setSelectedUser(user);
                  setShowUserModal(true);
                }}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                View Details
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* User Modal */}
      {showUserModal && <UserModal />}
    </div>
  );
}