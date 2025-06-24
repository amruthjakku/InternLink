'use client';

import { useState, useEffect } from 'react';
import { EnhancedBarChart, ActivityHeatmap, MetricCard } from '../Charts';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { getCollegeName } from '../../utils/helpers';
import UserModal from './UserModal';

export function AdvancedUserManagement() {
  const [users, setUsers] = useState([]);
  const [colleges, setColleges] = useState([]);
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
  const [mentors, setMentors] = useState([]);

  useEffect(() => {
    fetchUsers();
    fetchColleges();
    fetchUserSegments();
    fetchActivityLogs();
    fetchPermissions();
    fetchMentors();
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

  const fetchColleges = async () => {
    try {
      const response = await fetch('/api/admin/colleges');
      if (response.ok) {
        const data = await response.json();
        setColleges(data.colleges || []);
      } else {
        console.error('Failed to fetch colleges');
        setColleges([]);
      }
    } catch (error) {
      console.error('Error fetching colleges:', error);
      setColleges([]);
    }
  };

  const fetchUserSegments = async () => {
    try {
      const response = await fetch('/api/admin/user-segments');
      if (response.ok) {
        const data = await response.json();
        const mappedSegments = (data.segments || []).map(segment => ({
          id: segment.id,
          name: segment.name,
          description: segment.description,
          userCount: segment.count || segment.userCount || 0,
          color: segment.color
        }));
        setUserSegments(mappedSegments);
      } else {
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

  const fetchMentors = async (collegeName = null) => {
    try {
      let url = '/api/admin/users?role=mentor';
      if (collegeName) {
        url += `&college=${encodeURIComponent(collegeName)}`;
      }
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setMentors(data.users || []);
      } else {
        setMentors([]);
      }
    } catch (error) {
      setMentors([]);
    }
  };

  const handleSendMessage = async (userId) => {
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
      status: user.status,
      assignedMentor: user.assignedMentor || '',
    });
    setShowUserModal(true);
  };

  const handleFormFieldChange = (field, value) => {
    setEditFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if ((field === 'college' || field === 'role') && updated.role === 'intern') {
        fetchMentors(updated.college);
        updated.assignedMentor = '';
      }
      return updated;
    });
  };

  const handleSaveUser = async (userData) => {
    try {
      const url = userData.id ? `/api/admin/users/${userData.id}` : '/api/admin/users';
      const method = userData.id ? 'PUT' : 'POST';
      const payload = { ...userData };
      if (payload.role !== 'intern') {
        delete payload.assignedMentor;
      }
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('Response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Success result:', result);
        fetchUsers();
        setShowUserModal(false);
        setSelectedUser(null);
        setIsEditMode(false);
        setEditFormData({});
        const successMessage = userData.id 
          ? `✅ User "${userData.name}" updated successfully!\n\n⚠️ Note: If you changed their role, they may need to log out and log back in to see the changes in their dashboard.` 
          : `🎉 New ${userData.role} "${userData.name}" created successfully!\n📧 Email: ${userData.email}\n🔗 GitLab: ${userData.gitlabUsername}`;
        alert(successMessage);
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
        fetchUsers();
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
      status: 'active',
      assignedMentor: '',
    });
    setShowUserModal(true);
  };

  const handleQuickAddUser = (role = 'intern') => {
    setSelectedUser(null);
    setIsEditMode(true);
    setEditFormData({
      name: '',
      email: '',
      gitlabUsername: '',
      role: role,
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
        fetchUsers();
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
    ? Math.round(users.reduce((sum, user) => sum + (user.performanceScore || 0), 0) / users.length)
    : 0;
  const atRiskUsers = (users && Array.isArray(users)) ? users.filter(u => u.riskLevel === 'high').length : 0;

  // User distribution data
  const roleDistributionData = {
    labels: ['Interns', 'Mentors', 'Super Mentors', 'Admins'],
    datasets: [{
      data: [
        (users && Array.isArray(users)) ? users.filter(u => u.role === 'intern').length : 0,
        (users && Array.isArray(users)) ? users.filter(u => u.role === 'mentor').length : 0,
        (users && Array.isArray(users)) ? users.filter(u => u.role === 'super-mentor').length : 0,
        (users && Array.isArray(users)) ? users.filter(u => u.role === 'admin').length : 0
      ],
      backgroundColor: ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B']
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

  return (
    <div className="space-y-6">
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
          <div className="flex space-x-3">
            <button
              onClick={handleAddUser}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <span>Add User</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search users..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Roles</option>
              <option value="intern">Intern</option>
              <option value="mentor">Mentor</option>
              <option value="super-mentor">Super Mentor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">College</label>
            <select
              value={filterCollege}
              onChange={(e) => setFilterCollege(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Colleges</option>
              {colleges.map(college => (
                <option key={college.id} value={college.name}>
                  {college.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-900">User</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Role</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">College</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Performance</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="capitalize text-sm font-medium text-gray-900">{user.role}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-gray-600">{user.college}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">{user.performanceScore || 0}%</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRiskColor(user.riskLevel)}`}>
                        {user.riskLevel || 'low'} risk
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setIsEditMode(false);
                          setShowUserModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleEditUser(user)}
                        className="text-green-600 hover:text-green-800 text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Delete
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
            <p className="text-gray-500">No users found matching your criteria.</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Segments</h3>
          <div className="space-y-3">
            {userSegments.map(segment => (
              <div key={segment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: segment.color }}
                  ></div>
                  <div>
                    <div className="font-medium text-gray-900">{segment.name}</div>
                    <div className="text-sm text-gray-500">{segment.description}</div>
                  </div>
                </div>
                <span className="text-lg font-bold text-gray-900">{segment.userCount}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {activityLogs.slice(0, 5).map(log => (
              <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {log.userName ? log.userName.charAt(0) : 'U'}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {log.userName} - {log.action}
                    </div>
                    <div className="text-xs text-gray-500">
                      {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Unknown time'} • {log.ipAddress}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    const user = users.find(u => u.id === log.userId);
                    if (user) {
                      setSelectedUser(user);
                      setShowUserModal(true);
                    }
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <UserModal
        isOpen={showUserModal}
        isEditMode={isEditMode}
        editFormData={editFormData}
        setEditFormData={setEditFormData}
        colleges={colleges}
        mentors={mentors}
        onClose={() => {
          setShowUserModal(false);
          setSelectedUser(null);
          setIsEditMode(false);
          setEditFormData({});
        }}
        onSave={async (userData) => {
          try {
            const url = userData.id ? `/api/admin/users/${userData.id}` : '/api/admin/users';
            const method = userData.id ? 'PUT' : 'POST';
            const payload = { ...userData };
            if (payload.role !== 'intern') {
              delete payload.assignedMentor;
            }
            const response = await fetch(url, {
              method,
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(payload),
            });
            if (response.ok) {
              const result = await response.json();
              fetchUsers();
              setShowUserModal(false);
              setSelectedUser(null);
              setIsEditMode(false);
              setEditFormData({});
              const successMessage = userData.id 
                ? `✅ User "${userData.name}" updated successfully!\n\n⚠️ Note: If you changed their role, they may need to log out and log back in to see the changes in their dashboard.` 
                : `🎉 New ${userData.role} "${userData.name}" created successfully!\n📧 Email: ${userData.email}\n🔗 GitLab: ${userData.gitlabUsername}`;
              alert(successMessage);
            } else {
              const error = await response.json();
              alert(`Error: ${error.error || error.message || 'Failed to save user'}`);
            }
          } catch (error) {
            alert(`Error saving user: ${error.message}`);
          }
        }}
        selectedUser={selectedUser}
        activityLogs={activityLogs}
      />
    </div>
  );
}