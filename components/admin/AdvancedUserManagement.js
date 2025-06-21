'use client';

import { useState, useEffect } from 'react';
import { EnhancedBarChart, ActivityHeatmap, MetricCard } from '../Charts';
import { format, subDays, eachDayOfInterval } from 'date-fns';

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
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCollege, setFilterCollege] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Generate mock user data
    const generateUsers = () => [
      {
        id: 1,
        name: 'Alex Chen',
        email: 'alex.chen@college.edu',
        role: 'intern',
        college: 'MIT',
        status: 'active',
        joinDate: '2024-01-01',
        lastActive: '2024-01-16',
        tasksCompleted: 15,
        totalTasks: 20,
        performanceScore: 85,
        loginCount: 45,
        avgSessionTime: 120, // minutes
        skills: ['React', 'Node.js', 'MongoDB'],
        activityLevel: 'high',
        riskLevel: 'low',
        location: 'Boston, MA',
        timezone: 'EST'
      },
      {
        id: 2,
        name: 'Sarah Johnson',
        email: 'sarah.johnson@university.edu',
        role: 'intern',
        college: 'Stanford',
        status: 'active',
        joinDate: '2024-01-02',
        lastActive: '2024-01-16',
        tasksCompleted: 18,
        totalTasks: 22,
        performanceScore: 92,
        loginCount: 52,
        avgSessionTime: 95,
        skills: ['Vue.js', 'Python', 'PostgreSQL'],
        activityLevel: 'high',
        riskLevel: 'low',
        location: 'Palo Alto, CA',
        timezone: 'PST'
      },
      {
        id: 3,
        name: 'Dr. Emily Rodriguez',
        email: 'emily.rodriguez@university.edu',
        role: 'mentor',
        college: 'UC Berkeley',
        status: 'active',
        joinDate: '2023-12-15',
        lastActive: '2024-01-16',
        tasksCompleted: 0,
        totalTasks: 0,
        performanceScore: 88,
        loginCount: 38,
        avgSessionTime: 180,
        skills: ['Leadership', 'Full Stack', 'DevOps'],
        activityLevel: 'medium',
        riskLevel: 'low',
        location: 'Berkeley, CA',
        timezone: 'PST'
      },
      {
        id: 4,
        name: 'Mike Davis',
        email: 'mike.davis@tech.edu',
        role: 'intern',
        college: 'Carnegie Mellon',
        status: 'inactive',
        joinDate: '2024-01-05',
        lastActive: '2024-01-10',
        tasksCompleted: 8,
        totalTasks: 15,
        performanceScore: 65,
        loginCount: 12,
        avgSessionTime: 45,
        skills: ['JavaScript', 'CSS'],
        activityLevel: 'low',
        riskLevel: 'high',
        location: 'Pittsburgh, PA',
        timezone: 'EST'
      },
      {
        id: 5,
        name: 'Admin User',
        email: 'admin@internlink.com',
        role: 'admin',
        college: 'System',
        status: 'active',
        joinDate: '2023-12-01',
        lastActive: '2024-01-16',
        tasksCompleted: 0,
        totalTasks: 0,
        performanceScore: 100,
        loginCount: 120,
        avgSessionTime: 240,
        skills: ['System Administration', 'Analytics'],
        activityLevel: 'high',
        riskLevel: 'low',
        location: 'Remote',
        timezone: 'UTC'
      }
    ];

    // Generate user segments
    const generateUserSegments = () => [
      {
        id: 1,
        name: 'High Performers',
        description: 'Users with performance score > 85',
        criteria: { performanceScore: { $gt: 85 } },
        userCount: 12,
        color: 'green'
      },
      {
        id: 2,
        name: 'At Risk',
        description: 'Users inactive for > 5 days',
        criteria: { lastActive: { $lt: '2024-01-11' } },
        userCount: 3,
        color: 'red'
      },
      {
        id: 3,
        name: 'New Users',
        description: 'Users joined in last 30 days',
        criteria: { joinDate: { $gt: '2023-12-17' } },
        userCount: 8,
        color: 'blue'
      },
      {
        id: 4,
        name: 'Power Users',
        description: 'Users with > 40 logins',
        criteria: { loginCount: { $gt: 40 } },
        userCount: 6,
        color: 'purple'
      }
    ];

    // Generate activity logs
    const generateActivityLogs = () => {
      const activities = [
        'User logged in',
        'Task completed',
        'Profile updated',
        'File uploaded',
        'Message sent',
        'Meeting joined',
        'Report generated'
      ];

      return Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        userId: Math.floor(Math.random() * 5) + 1,
        userName: ['Alex Chen', 'Sarah Johnson', 'Dr. Emily Rodriguez', 'Mike Davis', 'Admin User'][Math.floor(Math.random() * 5)],
        action: activities[Math.floor(Math.random() * activities.length)],
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
        ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        details: { page: '/dashboard', duration: Math.floor(Math.random() * 300) }
      }));
    };

    // Generate permissions
    const generatePermissions = () => [
      { id: 1, name: 'View Dashboard', description: 'Access to main dashboard', roles: ['intern', 'mentor', 'admin'] },
      { id: 2, name: 'Manage Tasks', description: 'Create and edit tasks', roles: ['mentor', 'admin'] },
      { id: 3, name: 'View Reports', description: 'Access to analytics and reports', roles: ['mentor', 'admin'] },
      { id: 4, name: 'Manage Users', description: 'Add, edit, and delete users', roles: ['admin'] },
      { id: 5, name: 'System Settings', description: 'Modify system configuration', roles: ['admin'] },
      { id: 6, name: 'Bulk Operations', description: 'Perform bulk user operations', roles: ['admin'] }
    ];

    setUsers(generateUsers());
    setUserSegments(generateUserSegments());
    setActivityLogs(generateActivityLogs());
    setPermissions(generatePermissions());
  }, []);

  // Filter users
  const filteredUsers = users.filter(user => {
    if (filterRole !== 'all' && user.role !== filterRole) return false;
    if (filterStatus !== 'all' && user.status !== filterStatus) return false;
    if (filterCollege !== 'all' && user.college !== filterCollege) return false;
    if (searchTerm && !user.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !user.email.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  // Calculate metrics
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === 'active').length;
  const avgPerformance = users.length > 0 
    ? Math.round(users.reduce((sum, user) => sum + user.performanceScore, 0) / users.length)
    : 0;
  const atRiskUsers = users.filter(u => u.riskLevel === 'high').length;

  // User distribution data
  const roleDistributionData = {
    labels: ['Interns', 'Mentors', 'Admins'],
    datasets: [{
      data: [
        users.filter(u => u.role === 'intern').length,
        users.filter(u => u.role === 'mentor').length,
        users.filter(u => u.role === 'admin').length
      ],
      backgroundColor: ['#3B82F6', '#10B981', '#F59E0B']
    }]
  };

  // Activity level data
  const activityLevelData = {
    labels: ['High', 'Medium', 'Low'],
    datasets: [{
      data: [
        users.filter(u => u.activityLevel === 'high').length,
        users.filter(u => u.activityLevel === 'medium').length,
        users.filter(u => u.activityLevel === 'low').length
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
    if (!selectedUser) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {selectedUser.name}
                </h2>
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
              </div>
              <button
                onClick={() => setShowUserModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
          </div>

          {/* Modal Content */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* User Stats */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">User Statistics</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {selectedUser.performanceScore}
                    </div>
                    <div className="text-sm text-blue-800">Performance Score</div>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {selectedUser.loginCount}
                    </div>
                    <div className="text-sm text-green-800">Total Logins</div>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {selectedUser.avgSessionTime}m
                    </div>
                    <div className="text-sm text-purple-800">Avg Session</div>
                  </div>
                  
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {selectedUser.role === 'intern' ? `${selectedUser.tasksCompleted}/${selectedUser.totalTasks}` : 'N/A'}
                    </div>
                    <div className="text-sm text-orange-800">Tasks Completed</div>
                  </div>
                </div>

                {/* User Details */}
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Role</span>
                    <span className="text-sm font-medium text-gray-900 capitalize">{selectedUser.role}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Join Date</span>
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(selectedUser.joinDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Last Active</span>
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(selectedUser.lastActive).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Location</span>
                    <span className="text-sm font-medium text-gray-900">{selectedUser.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Timezone</span>
                    <span className="text-sm font-medium text-gray-900">{selectedUser.timezone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Activity Level</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActivityColor(selectedUser.activityLevel)}`}>
                      {selectedUser.activityLevel}
                    </span>
                  </div>
                </div>
              </div>

              {/* Skills & Activity */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Skills & Activity</h3>
                
                {/* Skills */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedUser.skills.map(skill => (
                      <span key={skill} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Recent Activity */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Activity</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {activityLogs
                      .filter(log => log.userId === selectedUser.id)
                      .slice(0, 10)
                      .map(log => (
                        <div key={log.id} className="text-sm text-gray-600 p-2 bg-gray-50 rounded">
                          <div className="font-medium">{log.action}</div>
                          <div className="text-xs text-gray-500">
                            {log.timestamp.toLocaleString()}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex space-x-3">
                <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                  Send Message
                </button>
                <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                  Edit User
                </button>
                <button className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">
                  View Full Activity
                </button>
                <button className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
                  Reset Password
                </button>
                {selectedUser.status === 'active' ? (
                  <button className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                    Deactivate
                  </button>
                ) : (
                  <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                    Activate
                  </button>
                )}
              </div>
            </div>
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
              <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
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
              {[...new Set(users.map(u => u.college))].map(college => (
                <option key={college} value={college}>{college}</option>
              ))}
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
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'admin' ? 'bg-red-100 text-red-800' :
                      user.role === 'mentor' ? 'bg-green-100 text-green-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.college}
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
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setShowUserModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      View Details
                    </button>
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
              <button className="text-xs text-blue-600 hover:text-blue-800">
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