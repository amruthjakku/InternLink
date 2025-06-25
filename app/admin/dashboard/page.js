'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { SystemMonitoring } from '../../../components/admin/SystemMonitoring';
import { AdvancedUserManagement } from '../../../components/admin/AdvancedUserManagement';
import { AdvancedAnalytics } from '../../../components/admin/AdvancedAnalytics';
import { AttendanceAnalytics } from '../../../components/admin/AttendanceAnalytics';
import { IPManagement } from '../../../components/admin/IPManagement';
import { CollegeManagement } from '../../../components/CollegeManagement';
import { SuperMentorManagement } from '../../../components/admin/SuperMentorManagement';
import { UserActivationManagement } from '../../../components/admin/UserActivationManagement';
import { AttendanceDebugger } from '../../../components/admin/AttendanceDebugger';
import { MetricCard } from '../../../components/Charts';

export default function AdminDashboard() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [filteredColleges, setFilteredColleges] = useState([]);
  const [sessionRefreshed, setSessionRefreshed] = useState(false);
  
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

  // Refresh session data on mount to get latest role
  const refreshSession = async () => {
    try {
      const response = await fetch('/api/auth/refresh-session');
      if (response.ok) {
        const data = await response.json();
        // Force session update with fresh data
        await update({
          ...session?.user,
          role: data.user.role,
          college: data.user.college,
          assignedBy: data.user.assignedBy
        });
        setSessionRefreshed(true);
      }
    } catch (error) {
      console.error('Failed to refresh session:', error);
      setSessionRefreshed(true); // Continue with existing session
    }
  };

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/');
      return;
    }

    // Refresh session to get latest role information
    if (!sessionRefreshed) {
      refreshSession();
      return;
    }

    // If user needs registration, redirect to onboarding (but not if they're admin)
    if (session.user.needsRegistration) {
      router.push('/onboarding');
      return;
    }
    
    // If user has pending role and is not admin, redirect 
    if (session.user.role === 'pending') {
      router.push('/pending');
      return;
    }

    if (session.user.role !== 'admin') {
      router.push('/unauthorized');
      return;
    }

    fetchDashboardData();
  }, [session, status, sessionRefreshed]);

  // Filter users when search or filter changes
  useEffect(() => {
    if (!users || !Array.isArray(users)) {
      setFilteredUsers([]);
      return;
    }
    
    let filtered = users;
    
    if (userSearch) {
      filtered = filtered.filter(user => 
        user.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
        user.gitlabUsername?.toLowerCase().includes(userSearch.toLowerCase()) ||
        user.email?.toLowerCase().includes(userSearch.toLowerCase())
      );
    }
    
    if (userRoleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === userRoleFilter);
    }
    
    setFilteredUsers(filtered);
  }, [users, userSearch, userRoleFilter]);

  // Filter colleges when search changes
  useEffect(() => {
    if (!colleges || !Array.isArray(colleges)) {
      setFilteredColleges([]);
      return;
    }
    
    let filtered = colleges;
    
    if (collegeSearch) {
      filtered = filtered.filter(college => 
        college.name?.toLowerCase().includes(collegeSearch.toLowerCase()) ||
        college.location?.toLowerCase().includes(collegeSearch.toLowerCase()) ||
        college.mentorUsername?.toLowerCase().includes(collegeSearch.toLowerCase())
      );
    }
    
    setFilteredColleges(filtered);
  }, [colleges, collegeSearch]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch real data from APIs
      const [statsResponse, usersResponse, collegesResponse] = await Promise.all([
        fetch('/api/admin/stats').catch(() => ({ ok: false })),
        fetch('/api/admin/users').catch(() => ({ ok: false })),
        fetch('/api/admin/colleges').catch(() => ({ ok: false }))
      ]);

      // Handle stats
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.stats || {
          totalUsers: 0,
          totalColleges: 0,
          totalMentors: 0,
          totalInterns: 0,
          activeUsers: 0,
          systemHealth: 100,
          avgPerformance: 0,
          tasksCompleted: 0
        });
      } else {
        setStats({
          totalUsers: 0,
          totalColleges: 0,
          totalMentors: 0,
          totalInterns: 0,
          activeUsers: 0,
          systemHealth: 100,
          avgPerformance: 0,
          tasksCompleted: 0
        });
      }

      // Handle users
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        const usersList = usersData.users || [];
        setUsers(usersList);
        
        // Calculate user stats
        const userStats = {
          totalUsers: usersList.length,
          activeUsers: usersList.filter(user => user.isActive).length,
          inactiveUsers: usersList.filter(user => !user.isActive).length,
          totalMentors: usersList.filter(user => user.role === 'mentor' || user.role === 'super-mentor').length,
          totalInterns: usersList.filter(user => user.role === 'intern').length,
          pendingUsers: usersList.filter(user => user.role === 'pending').length
        };
        
        // Merge with existing stats
        setStats(prevStats => ({
          ...prevStats,
          ...userStats
        }));
      } else {
        setUsers([]);
      }

      // Handle colleges
      if (collegesResponse.ok) {
        const collegesData = await collegesResponse.json();
        setColleges(collegesData.colleges || []);
      } else {
        setColleges([]);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set default empty states on error
      setStats({
        totalUsers: 0,
        totalColleges: 0,
        totalMentors: 0,
        totalInterns: 0,
        activeUsers: 0,
        systemHealth: 100,
        avgPerformance: 0,
        tasksCompleted: 0
      });
      setUsers([]);
      setColleges([]);
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
        body: JSON.stringify({
          ...newUser,
          assignedBy: session?.user?.gitlabUsername || 'admin'
        })
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

  // Debug functions
  const debugUsers = async () => {
    try {
      console.log('🔍 Running debug users...');
      const response = await fetch('/api/debug/users');
      const data = await response.json();
      console.log('🔍 Debug Users Result:', data);
      alert(`Debug complete! Check console. Found ${data.totalUsers} users, ${data.activeUsers} active`);
    } catch (error) {
      console.error('❌ Debug error:', error);
      alert('Debug failed. Check console for errors.');
    }
  };

  const testUserLookup = async () => {
    const username = prompt('Enter GitLab username to test:');
    if (!username) return;
    
    try {
      console.log('🔍 Testing username lookup for:', username);
      const response = await fetch('/api/debug/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      const data = await response.json();
      console.log('🔍 Username Test Result:', data);
      alert(`Test complete! Check console for detailed results.`);
    } catch (error) {
      console.error('❌ Username test error:', error);
      alert('Username test failed. Check console for errors.');
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
              { id: 'debug', name: 'Debug Tools', icon: '🔍' },
              { id: 'system-monitoring', name: 'System Monitoring', icon: '🖥️' },
              { id: 'advanced-analytics', name: 'Advanced Analytics', icon: '🔬' },
              { id: 'attendance-analytics', name: 'Attendance Analytics', icon: '📍' },
              { id: 'ip-management', name: 'IP Management', icon: '🛡️' },
              { id: 'user-management', name: 'User Management', icon: '👥' },
              { id: 'user-activation', name: 'User Activation', icon: '🔄' },
              { id: 'attendance-debugger', name: 'Attendance Debug', icon: '🔧' },
              { id: 'super-mentor-management', name: 'Super-Mentors', icon: '👨‍🏫' },
              { id: 'colleges', name: 'Colleges', icon: '🏫' },
              { id: 'college-management', name: 'College Management', icon: '🎓' },
              { id: 'bulk-operations', name: 'Bulk Operations', icon: '📦' },
              { id: 'analytics', name: 'Analytics', icon: '📈' }
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
            
            {/* Enhanced Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <MetricCard
                title="Total Users"
                value={stats.totalUsers || 0}
                change={5.2}
                icon="👥"
                color="blue"
              />
              <MetricCard
                title="Active Users"
                value={stats.activeUsers || 0}
                change={3.1}
                icon="✅"
                color="green"
              />
              <MetricCard
                title="Inactive Users"
                value={stats.inactiveUsers || 0}
                change={-2.1}
                icon="❌"
                color="red"
              />
              <MetricCard
                title="Pending Users"
                value={stats.pendingUsers || 0}
                change={1.2}
                icon="⏳"
                color="yellow"
              />
              <MetricCard
                title="System Health"
                value={`${stats.systemHealth || 0}%`}
                change={0.5}
                icon="🖥️"
                color="purple"
              />
              <MetricCard
                title="Avg Performance"
                value={`${stats.avgPerformance || 0}%`}
                change={2.3}
                icon="📊"
                color="orange"
              />
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={() => setShowAddUserModal(true)}
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <div className="text-center">
                    <span className="text-2xl mb-2 block">👤</span>
                    <span className="text-sm font-medium text-gray-700">Add New User</span>
                  </div>
                </button>
                
                <button
                  onClick={() => setShowAddCollegeModal(true)}
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
                >
                  <div className="text-center">
                    <span className="text-2xl mb-2 block">🏫</span>
                    <span className="text-sm font-medium text-gray-700">Add New College</span>
                  </div>
                </button>
                
                <button
                  onClick={() => setShowBulkImportModal(true)}
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
                >
                  <div className="text-center">
                    <span className="text-2xl mb-2 block">📦</span>
                    <span className="text-sm font-medium text-gray-700">Bulk Import</span>
                  </div>
                </button>
                
                <button
                  onClick={() => setActiveTab('user-activation')}
                  className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors"
                >
                  <div className="text-center">
                    <span className="text-2xl mb-2 block">🔄</span>
                    <span className="text-sm font-medium text-gray-700">User Activation</span>
                    {stats.inactiveUsers > 0 && (
                      <div className="text-xs text-orange-600 mt-1">
                        {stats.inactiveUsers} inactive users
                      </div>
                    )}
                  </div>
                </button>
              </div>
            </div>

            {/* Recent Users */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Recent Users</h3>
                <button
                  onClick={() => setActiveTab('user-management')}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  View All
                </button>
              </div>
              <div className="space-y-3">
                {users.slice(0, 5).map((user) => (
                  <div key={user._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {user.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        user.role === 'admin' ? 'bg-red-100 text-red-800' :
                        user.role === 'mentor' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {user.role}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                ))}
                {users.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    No users found. Add some users to get started.
                  </div>
                )}
              </div>
            </div>

            {/* Recent Colleges */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Recent Colleges</h3>
                <button
                  onClick={() => setActiveTab('colleges')}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  View All
                </button>
              </div>
              <div className="space-y-3">
                {colleges.slice(0, 3).map((college) => (
                  <div key={college._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        🏫
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{college.name}</p>
                        <p className="text-xs text-gray-500">{college.location}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        Mentor: {college.mentorUsername || 'Unassigned'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {college.createdAt ? new Date(college.createdAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                ))}
                {colleges.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    No colleges found. Add some colleges to get started.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Debug Tab */}
        {activeTab === 'debug' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">🔍 Debug Tools</h2>
              <div className="text-sm text-gray-500">
                Use these tools to debug authentication issues
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* User Database Debug */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Database Debug</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Check all users in database and their roles
                </p>
                <button
                  onClick={debugUsers}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Debug All Users
                </button>
              </div>

              {/* Username Lookup Test */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Username Lookup Test</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Test if a specific GitLab username can be found
                </p>
                <button
                  onClick={testUserLookup}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Test Username Lookup
                </button>
              </div>
            </div>

            {/* Debug Instructions */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-yellow-800 mb-2">🔧 Debug Instructions</h3>
              <div className="text-sm text-yellow-700 space-y-2">
                <p><strong>1. Debug All Users:</strong> Shows all users in database with their roles and status</p>
                <p><strong>2. Test Username Lookup:</strong> Enter a GitLab username to test different query methods</p>
                <p><strong>3. Check Console:</strong> All debug output goes to browser console (F12)</p>
                <p><strong>4. Common Issues:</strong></p>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li>Username case sensitivity mismatch</li>
                  <li>User marked as inactive (isActive: false)</li>
                  <li>User not saved to database properly</li>
                  <li>GitLab profile username differs from database</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* System Monitoring Tab */}
        {activeTab === 'system-monitoring' && <SystemMonitoring />}

        {/* Advanced Analytics Tab */}
        {activeTab === 'advanced-analytics' && <AdvancedAnalytics />}

        {/* Attendance Analytics Tab */}
        {activeTab === 'attendance-analytics' && <AttendanceAnalytics />}

        {/* IP Management Tab */}
        {activeTab === 'ip-management' && <IPManagement />}

        {/* User Management Tab */}
        {activeTab === 'user-management' && <AdvancedUserManagement />}

        {/* User Activation Management Tab */}
        {activeTab === 'user-activation' && <UserActivationManagement />}

        {/* Attendance Debugger Tab */}
        {activeTab === 'attendance-debugger' && <AttendanceDebugger />}

        {/* Super-Mentor Management Tab */}
        {activeTab === 'super-mentor-management' && <SuperMentorManagement />}

        {/* Colleges Tab */}
        {activeTab === 'colleges' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">College Management</h2>
              <button
                onClick={() => setShowAddCollegeModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Add College
              </button>
            </div>

            {/* Search and Filter */}
            <div className="bg-white p-4 rounded-lg shadow">
              <input
                type="text"
                placeholder="Search colleges..."
                value={collegeSearch}
                onChange={(e) => setCollegeSearch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Colleges Table */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      College
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mentor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredColleges.map((college) => (
                    <tr key={college._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{college.name}</div>
                          <div className="text-sm text-gray-500">{college.description}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {college.location}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {college.mentorUsername}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(college.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => {
                            setEditingCollege(college);
                            setShowEditCollegeModal(true);
                          }}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCollege(college._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* College Management Tab */}
        {activeTab === 'college-management' && <CollegeManagement />}

        {/* Bulk Operations Tab */}
        {activeTab === 'bulk-operations' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Bulk Operations</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bulk Import */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Bulk Import</h3>
                <form onSubmit={handleBulkImport}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Import Type
                    </label>
                    <select
                      value={bulkImportType}
                      onChange={(e) => setBulkImportType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="users">Users</option>
                      <option value="colleges">Colleges</option>
                    </select>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      JSON Data
                    </label>
                    <textarea
                      value={bulkImportData}
                      onChange={(e) => setBulkImportData(e.target.value)}
                      rows={10}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Paste your JSON data here..."
                    />
                  </div>
                  
                  <button
                    type="submit"
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Import Data
                  </button>
                </form>
                
                {bulkImportResults && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-md">
                    <h4 className="font-medium text-gray-900">Import Results:</h4>
                    <pre className="text-sm text-gray-600 mt-2">
                      {JSON.stringify(bulkImportResults, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              {/* Bulk Export */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Bulk Export</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => exportData('users')}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Export Users
                  </button>
                  <button
                    onClick={() => exportData('colleges')}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Export Colleges
                  </button>
                  <button
                    onClick={() => exportData('all')}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Export All Data
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && <AdvancedAnalytics />}
      </div>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add New User</h3>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GitLab Username
                </label>
                <input
                  type="text"
                  value={newUser.gitlabUsername}
                  onChange={(e) => setNewUser({...newUser, gitlabUsername: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
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
                  required
                >
                  <option value="intern">Intern</option>
                  <option value="mentor">Mentor</option>
                  <option value="super-mentor">Super-Mentor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              
              {(newUser.role === 'intern' || newUser.role === 'mentor' || newUser.role === 'super-mentor') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    College
                  </label>
                  <select
                    value={newUser.college}
                    onChange={(e) => setNewUser({...newUser, college: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required={newUser.role === 'intern' || newUser.role === 'mentor' || newUser.role === 'super-mentor'}
                  >
                    <option value="">Select College</option>
                    {colleges.map((college) => (
                      <option key={college._id} value={college._id}>
                        {college.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add User
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddUserModal(false);
                    setNewUser({ gitlabUsername: '', name: '', email: '', role: 'intern', college: '' });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add College Modal */}
      {showAddCollegeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add New College</h3>
            <form onSubmit={handleAddCollege} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  College Name
                </label>
                <input
                  type="text"
                  value={newCollege.name}
                  onChange={(e) => setNewCollege({...newCollege, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newCollege.description}
                  onChange={(e) => setNewCollege({...newCollege, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={newCollege.location}
                  onChange={(e) => setNewCollege({...newCollege, location: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website (Optional)
                </label>
                <input
                  type="url"
                  value={newCollege.website}
                  onChange={(e) => setNewCollege({...newCollege, website: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mentor Username (Optional)
                </label>
                <input
                  type="text"
                  value={newCollege.mentorUsername}
                  onChange={(e) => setNewCollege({...newCollege, mentorUsername: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="GitLab username of assigned mentor"
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Add College
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddCollegeModal(false);
                    setNewCollege({ name: '', description: '', location: '', website: '', mentorUsername: '' });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUserModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Edit User</h3>
            <form onSubmit={handleEditUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="intern">Intern</option>
                  <option value="mentor">Mentor</option>
                  <option value="super-mentor">Super-Mentor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              
              {(editingUser.role === 'intern' || editingUser.role === 'mentor' || editingUser.role === 'super-mentor') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    College
                  </label>
                  <select
                    value={editingUser.college}
                    onChange={(e) => setEditingUser({...editingUser, college: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required={editingUser.role === 'intern' || editingUser.role === 'mentor' || editingUser.role === 'super-mentor'}
                  >
                    <option value="">Select College</option>
                    {colleges.map((college) => (
                      <option key={college._id} value={college._id}>
                        {college.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Update User
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditUserModal(false);
                    setEditingUser(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit College Modal */}
      {showEditCollegeModal && editingCollege && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Edit College</h3>
            <form onSubmit={handleEditCollege} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  College Name
                </label>
                <input
                  type="text"
                  value={editingCollege.name}
                  onChange={(e) => setEditingCollege({...editingCollege, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={editingCollege.description}
                  onChange={(e) => setEditingCollege({...editingCollege, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={editingCollege.location}
                  onChange={(e) => setEditingCollege({...editingCollege, location: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website
                </label>
                <input
                  type="url"
                  value={editingCollege.website}
                  onChange={(e) => setEditingCollege({...editingCollege, website: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mentor Username
                </label>
                <input
                  type="text"
                  value={editingCollege.mentorUsername}
                  onChange={(e) => setEditingCollege({...editingCollege, mentorUsername: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Update College
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditCollegeModal(false);
                    setEditingCollege(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showBulkImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Bulk Import Data</h3>
            <form onSubmit={handleBulkImport} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Import Type
                </label>
                <select
                  value={bulkImportType}
                  onChange={(e) => setBulkImportType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="users">Users</option>
                  <option value="colleges">Colleges</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  JSON Data
                </label>
                <textarea
                  value={bulkImportData}
                  onChange={(e) => setBulkImportData(e.target.value)}
                  rows={12}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  placeholder={bulkImportType === 'users' ? 
                    `[
  {
    "gitlabUsername": "john.doe",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "intern",
    "college": "University Name"
  }
]` : 
                    `[
  {
    "name": "University Name",
    "description": "A great university",
    "location": "City, State",
    "website": "https://university.edu",
    "mentorUsername": "mentor.username"
  }
]`}
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Import Data
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowBulkImportModal(false);
                    setBulkImportData('');
                    setBulkImportResults(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
            
            {bulkImportResults && (
              <div className="mt-6 p-4 bg-gray-50 rounded-md">
                <h4 className="font-medium text-gray-900 mb-2">Import Results:</h4>
                <div className="text-sm space-y-1">
                  <p className="text-green-600">✅ Successful: {bulkImportResults.successful}</p>
                  <p className="text-red-600">❌ Failed: {bulkImportResults.failed}</p>
                  {bulkImportResults.errors && bulkImportResults.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="font-medium text-gray-700">Errors:</p>
                      <ul className="list-disc list-inside text-red-600 space-y-1">
                        {bulkImportResults.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                      {bulkImportResults.totalErrors > bulkImportResults.errors.length && (
                        <p className="text-gray-600 mt-1">
                          ... and {bulkImportResults.totalErrors - bulkImportResults.errors.length} more errors
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}