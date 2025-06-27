'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { SystemMonitoring } from '../../../components/admin/SystemMonitoring';
import { AdvancedUserManagement } from '../../../components/admin/AdvancedUserManagement';
import { EnhancedUserManagement } from '../../../components/admin/EnhancedUserManagement';
import { DataIntegrityChecker } from '../../../components/admin/DataIntegrityChecker';
import { AdvancedAnalytics } from '../../../components/admin/AdvancedAnalytics';
import { AttendanceAnalytics } from '../../../components/admin/AttendanceAnalytics';
import { IPManagement } from '../../../components/admin/IPManagement';
import { CollegeManagement } from '../../../components/CollegeManagement';
import { SuperMentorManagement } from '../../../components/admin/SuperMentorManagement';
import { UserActivationManagement } from '../../../components/admin/UserActivationManagement';
import { AttendanceDebugger } from '../../../components/admin/AttendanceDebugger';
import { CohortManagementTab } from '../../../components/admin/CohortManagementTab';
import { TaskManagementTab } from '../../../components/admin/TaskManagementTab';
import { BulkImportTab } from '../../../components/admin/BulkImportTab';
import { CohortAssignmentTab } from '../../../components/admin/CohortAssignmentTab';
import { MetricCard } from '../../../components/Charts';
import { ProfileCard } from '../../../components/ProfileCard';
import { detectUserRole, detectCohortFromUsername, validateGitlabUsername, getRoleSuggestions } from '../../../utils/roleDetection';

// Enhanced Tab Components
const CombinedCollegeManagement = () => {
  const [activeSubTab, setActiveSubTab] = useState('list');
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
            <span className="text-white text-xl">🏫</span>
          </div>
          College Management Hub
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveSubTab('list')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeSubTab === 'list'
                ? 'bg-purple-100 text-purple-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            College List
          </button>
          <button
            onClick={() => setActiveSubTab('management')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeSubTab === 'management'
                ? 'bg-purple-100 text-purple-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Advanced Management
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {activeSubTab === 'list' && (
          <div>
            {/* College List Component */}
            <p className="text-gray-600">College list and basic operations will be displayed here.</p>
          </div>
        )}
        {activeSubTab === 'management' && (
          <CollegeManagement />
        )}
      </div>
    </div>
  );
};

const CombinedAttendanceSystem = () => {
  const [activeSubTab, setActiveSubTab] = useState('analytics');
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
            <span className="text-white text-xl">📊</span>
          </div>
          Attendance & IP Management Center
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveSubTab('analytics')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeSubTab === 'analytics'
                ? 'bg-blue-100 text-blue-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveSubTab('ip-management')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeSubTab === 'ip-management'
                ? 'bg-blue-100 text-blue-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            IP Management
          </button>
          <button
            onClick={() => setActiveSubTab('debug')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeSubTab === 'debug'
                ? 'bg-blue-100 text-blue-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Debug Tools
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {activeSubTab === 'analytics' && <AttendanceAnalytics />}
        {activeSubTab === 'ip-management' && <IPManagement />}
        {activeSubTab === 'debug' && <AttendanceDebugger />}
      </div>
    </div>
  );
};

const CombinedUserManagement = () => {
  const [activeSubTab, setActiveSubTab] = useState('advanced');
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
            <span className="text-white text-xl">👥</span>
          </div>
          User Management Suite
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveSubTab('advanced')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeSubTab === 'advanced'
                ? 'bg-green-100 text-green-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Advanced Management
          </button>
          <button
            onClick={() => setActiveSubTab('enhanced')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeSubTab === 'enhanced'
                ? 'bg-green-100 text-green-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Enhanced Features
          </button>
          <button
            onClick={() => setActiveSubTab('activation')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeSubTab === 'activation'
                ? 'bg-green-100 text-green-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            User Activation
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {activeSubTab === 'advanced' && <AdvancedUserManagement />}
        {activeSubTab === 'enhanced' && <EnhancedUserManagement />}
        {activeSubTab === 'activation' && <UserActivationManagement />}
      </div>
    </div>
  );
};

const CombinedCohortSystem = () => {
  const [activeSubTab, setActiveSubTab] = useState('management');
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
            <span className="text-white text-xl">🎯</span>
          </div>
          Cohort Management Hub
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveSubTab('management')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeSubTab === 'management'
                ? 'bg-orange-100 text-orange-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Cohort Management
          </button>
          <button
            onClick={() => setActiveSubTab('assignment')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeSubTab === 'assignment'
                ? 'bg-orange-100 text-orange-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Member Assignment
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {activeSubTab === 'management' && <CohortManagementTab />}
        {activeSubTab === 'assignment' && <CohortAssignmentTab />}
      </div>
    </div>
  );
};

export default function EnhancedAdminDashboard() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [sessionRefreshed, setSessionRefreshed] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Define the default tab configuration
  const defaultTabs = [
    { id: 'overview', name: 'Overview', icon: '📊', color: 'from-blue-500 to-purple-500', category: 'main' },
    { id: 'combined-college', name: 'College Management', icon: '🏫', color: 'from-purple-500 to-pink-500', category: 'management' },
    { id: 'combined-attendance', name: 'Attendance & IP System', icon: '📋', color: 'from-blue-500 to-cyan-500', category: 'monitoring' },
    { id: 'combined-users', name: 'User Management', icon: '👥', color: 'from-green-500 to-emerald-500', category: 'management' },
    { id: 'combined-cohorts', name: 'Cohort System', icon: '🎯', color: 'from-orange-500 to-red-500', category: 'management' },
    { id: 'system-monitoring', name: 'System Monitoring', icon: '🖥️', color: 'from-gray-500 to-slate-500', category: 'monitoring' },
    { id: 'advanced-analytics', name: 'Analytics Hub', icon: '📈', color: 'from-indigo-500 to-blue-500', category: 'analytics' },
    { id: 'task-management', name: 'Task Management', icon: '📝', color: 'from-yellow-500 to-orange-500', category: 'management' },
    { id: 'super-mentor-management', name: 'Super Mentors', icon: '👨‍🏫', color: 'from-teal-500 to-green-500', category: 'management' },
    { id: 'data-integrity', name: 'Data Integrity', icon: '🔧', color: 'from-red-500 to-pink-500', category: 'monitoring' },
    { id: 'bulk-operations', name: 'Bulk Operations', icon: '📦', color: 'from-purple-500 to-indigo-500', category: 'tools' },
    { id: 'debug-tools', name: 'Debug Tools', icon: '🔍', color: 'from-gray-600 to-gray-800', category: 'tools' }
  ];

  // Tab management with drag and drop functionality
  const [tabs, setTabs] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTabs = localStorage.getItem('adminDashboardTabs');
      return savedTabs ? JSON.parse(savedTabs) : defaultTabs;
    }
    return defaultTabs;
  });

  // Save tab configuration to localStorage
  const saveTabConfiguration = (newTabs) => {
    setTabs(newTabs);
    if (typeof window !== 'undefined') {
      localStorage.setItem('adminDashboardTabs', JSON.stringify(newTabs));
    }
  };

  // Handle drag and drop for tab reordering
  const handleOnDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(tabs);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    saveTabConfiguration(items);
  };

  // Reset to default tab configuration
  const resetTabConfiguration = () => {
    saveTabConfiguration(defaultTabs);
    setActiveTab('overview');
  };

  // Toggle tab visibility
  const toggleTabVisibility = (tabId) => {
    const updatedTabs = tabs.map(tab => 
      tab.id === tabId ? { ...tab, hidden: !tab.hidden } : tab
    );
    saveTabConfiguration(updatedTabs);
  };

  // Filter tabs based on search query
  const filteredTabs = tabs.filter(tab => 
    !tab.hidden && 
    (tab.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     tab.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Session refresh logic
  const refreshSession = async () => {
    try {
      const response = await fetch('/api/auth/refresh-session');
      if (response.ok) {
        const data = await response.json();
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
      setSessionRefreshed(true);
    }
  };

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/');
      return;
    }

    if (!sessionRefreshed) {
      refreshSession();
      return;
    }

    if (session.user.needsRegistration) {
      router.push('/onboarding');
      return;
    }
    
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

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [statsResponse] = await Promise.all([
        fetch('/api/admin/stats').catch(() => ({ ok: false }))
      ]);

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
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-gray-50 to-gray-100'} transition-colors duration-300`}>
      {/* Enhanced Header */}
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white/80 backdrop-blur-md border-gray-200'} shadow-lg border-b sticky top-0 z-40`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <span className="text-xl">☰</span>
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl font-bold">A</span>
                </div>
                <div>
                  <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Admin Dashboard
                  </h1>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    InternLink Management Center
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search tabs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`pl-10 pr-4 py-2 rounded-lg border ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-400">🔍</span>
                </div>
              </div>

              {/* Dark Mode Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-lg transition-colors ${
                  darkMode ? 'bg-gray-700 text-yellow-400' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {darkMode ? '☀️' : '🌙'}
              </button>

              {/* User Profile */}
              <div className="flex items-center space-x-3">
                <img 
                  src={session?.user?.image || session?.user?.profileImage} 
                  alt={session?.user?.name}
                  className="w-10 h-10 rounded-full ring-2 ring-blue-500/20"
                />
                <div className="text-right">
                  <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {session?.user?.name}
                  </p>
                  <span className="px-2 py-1 text-xs font-medium bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-full">
                    Admin
                  </span>
                </div>
              </div>

              <button
                onClick={() => signOut()}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  darkMode 
                    ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Navigation */}
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white/90 backdrop-blur-md border-gray-200'} border-b sticky top-20 z-30`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <DragDropContext onDragEnd={handleOnDragEnd}>
              <Droppable droppableId="tabs" direction="horizontal">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="flex space-x-2 overflow-x-auto scrollbar-hide flex-1 mr-4"
                  >
                    {filteredTabs.map((tab, index) => (
                      <Draggable key={tab.id} draggableId={tab.id} index={index}>
                        {(provided, snapshot) => (
                          <button
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-shrink-0 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 transform ${
                              activeTab === tab.id
                                ? `bg-gradient-to-r ${tab.color} text-white shadow-lg scale-105`
                                : darkMode 
                                  ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                            } ${snapshot.isDragging ? 'rotate-3 shadow-2xl' : ''}`}
                          >
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">{tab.icon}</span>
                              <span className="whitespace-nowrap">{tab.name}</span>
                            </div>
                          </button>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            {/* Tab Configuration */}
            <div className="flex items-center space-x-2">
              <button
                onClick={resetTabConfiguration}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  darkMode 
                    ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
                title="Reset tab order"
              >
                🔄
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab - Enhanced */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <div className="lg:col-span-3 space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-3`}>
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                      <span className="text-white text-2xl">📊</span>
                    </div>
                    System Overview
                  </h2>
                  <div className={`px-4 py-2 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Last updated: {new Date().toLocaleTimeString()}
                    </span>
                  </div>
                </div>
            
                {/* Enhanced Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                    title="System Health"
                    value={`${stats.systemHealth || 0}%`}
                    change={0.5}
                    icon="🖥️"
                    color="purple"
                  />
                  <MetricCard
                    title="Total Mentors"
                    value={stats.totalMentors || 0}
                    change={2.1}
                    icon="👨‍🏫"
                    color="orange"
                  />
                  <MetricCard
                    title="Total Interns"
                    value={stats.totalInterns || 0}
                    change={4.3}
                    icon="🎓"
                    color="teal"
                  />
                  <MetricCard
                    title="Avg Performance"
                    value={`${stats.avgPerformance || 0}%`}
                    change={2.3}
                    icon="📈"
                    color="indigo"
                  />
                </div>

                {/* Quick Actions with modern design */}
                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm border ${darkMode ? 'border-gray-700' : 'border-gray-200'} p-8`}>
                  <h3 className={`text-xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Quick Actions
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      { icon: '👤', title: 'Add User', subtitle: 'Create new user account', color: 'from-blue-500 to-cyan-500', action: () => setActiveTab('combined-users') },
                      { icon: '🏫', title: 'Add College', subtitle: 'Register new institution', color: 'from-purple-500 to-pink-500', action: () => setActiveTab('combined-college') },
                      { icon: '📦', title: 'Bulk Import', subtitle: 'Import multiple records', color: 'from-green-500 to-emerald-500', action: () => setActiveTab('bulk-operations') },
                      { icon: '📊', title: 'View Analytics', subtitle: 'Detailed system insights', color: 'from-orange-500 to-red-500', action: () => setActiveTab('advanced-analytics') }
                    ].map((action, index) => (
                      <button
                        key={index}
                        onClick={action.action}
                        className={`group p-6 rounded-xl border-2 border-dashed ${
                          darkMode ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400'
                        } transition-all duration-200 hover:scale-105 hover:shadow-lg`}
                      >
                        <div className="text-center">
                          <div className={`w-12 h-12 bg-gradient-to-r ${action.color} rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                            <span className="text-white text-2xl">{action.icon}</span>
                          </div>
                          <h4 className={`font-semibold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {action.title}
                          </h4>
                          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {action.subtitle}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Enhanced Sidebar */}
              <div className="lg:col-span-1">
                <div className="sticky top-32">
                  <ProfileCard user={session?.user} showMilestones={true} />
                  
                  {/* System Status */}
                  <div className={`mt-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-sm border ${darkMode ? 'border-gray-700' : 'border-gray-200'} p-6`}>
                    <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      System Status
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          Database
                        </span>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-sm font-medium text-green-600">Online</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          API Status
                        </span>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-sm font-medium text-green-600">Active</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          GitLab Integration
                        </span>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-sm font-medium text-green-600">Connected</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Combined Components */}
        {activeTab === 'combined-college' && <CombinedCollegeManagement />}
        {activeTab === 'combined-attendance' && <CombinedAttendanceSystem />}
        {activeTab === 'combined-users' && <CombinedUserManagement />}
        {activeTab === 'combined-cohorts' && <CombinedCohortSystem />}

        {/* Individual Component Tabs */}
        {activeTab === 'system-monitoring' && <SystemMonitoring />}
        {activeTab === 'advanced-analytics' && <AdvancedAnalytics />}
        {activeTab === 'task-management' && <TaskManagementTab />}
        {activeTab === 'super-mentor-management' && <SuperMentorManagement />}
        {activeTab === 'data-integrity' && <DataIntegrityChecker />}
        {activeTab === 'bulk-operations' && <BulkImportTab />}
        
        {/* Debug Tools Tab */}
        {activeTab === 'debug-tools' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-3`}>
                <div className="w-10 h-10 bg-gradient-to-r from-gray-600 to-gray-800 rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl">🔍</span>
                </div>
                Debug Tools
              </h2>
            </div>
            
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-sm border ${darkMode ? 'border-gray-700' : 'border-gray-200'} p-6`}>
              <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                Debug tools and utilities will be displayed here.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}