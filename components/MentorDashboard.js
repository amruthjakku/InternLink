'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
// Using real API calls - no mock data
import { InternManagementTab } from './mentor/InternManagementTab';
import { AdvancedTaskManagement } from './mentor/AdvancedTaskManagement';
import { CategoriesTab } from './mentor/CategoriesTab';
import { CollegesTab } from './mentor/CollegesTab';
import { AttendanceTab } from './mentor/AttendanceTab';
import { LeaderboardTab } from './mentor/LeaderboardTab';
import { CommunicationTab } from './mentor/CommunicationTab';
import { SuperMentorCommunicationTab } from './mentor/SuperMentorCommunicationTab';
import { MeetingsTab } from './mentor/MeetingsTab';
import { AIAssistantTab } from './mentor/AIAssistantTab';
import { PerformanceOverview } from './mentor/PerformanceOverview';
import { TeamActivity } from './mentor/TeamActivity';
import { MentorManagementTab } from './mentor/MentorManagementTab';
import { CohortManagementTab } from './mentor/CohortManagementTab';
import TeamActivityDashboard from './dashboard/TeamActivity';
import { CollegeBadge } from './CollegeLogo';
import GitLabIntegrationDashboard from './dashboard/GitLabIntegration';
import { Chat } from './Chat';
import { EnhancedChat } from './EnhancedChat';

export function MentorDashboard() {
  const { user, refreshUserData, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [interns, setInterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  console.log('MentorDashboard component initialized with user:', user?.name, 'role:', user?.role);

  // Dynamic tabs based on user role
  const getTabsForRole = (role) => {
    const baseTabs = [
      { id: 'overview', name: 'Overview', icon: '📊' },
      { id: 'intern-management', name: 'Intern Management', icon: '👥' },
      { id: 'performance', name: 'Performance', icon: '📈' },
      { id: 'team-activity', name: 'Team Activity', icon: '🔄' },
      { id: 'attendance', name: 'Attendance', icon: '📍' },
      { id: 'leaderboard', name: 'Team Leaderboard', icon: '🏆' },
    ];

    if (role === 'super-mentor') {
      return [
        ...baseTabs,
        { id: 'mentor-management', name: 'Mentor Management', icon: '👨‍🏫' },
        { id: 'cohort-management', name: 'Cohort Management', icon: '🎓' },
        { id: 'task-management', name: 'Task Management', icon: '📝' },
        { id: 'team-dashboard', name: 'Team Dashboard', icon: '📊' },
        { id: 'gitlab-integration', name: 'GitLab Integration', icon: '🦊' },
        { id: 'communication', name: 'Communication', icon: '💬' },
        { id: 'team-chat', name: 'Team Chat', icon: '💭' },
        { id: 'meetings', name: 'Meetings', icon: '📹' },
        { id: 'ai-settings', name: 'AI Assistant', icon: '🤖' },
      ];
    } else {
      // Regular mentor tabs - limited functionality
      return [
        ...baseTabs,
        { id: 'team-chat', name: 'Team Chat', icon: '💭' },
        { id: 'ai-settings', name: 'AI Assistant', icon: '🤖' },
      ];
    }
  };

  // Get tabs based on user role, with fallback to regular mentor tabs
  const tabs = getTabsForRole(user?.role || 'mentor');
  console.log('Generated tabs for role:', user?.role, 'count:', tabs.length);

  useEffect(() => {
    if (user) {
      // Reset active tab to overview when user changes
      setActiveTab('overview');
      fetchInterns();
    }
  }, [user]);

  // Import SWR hooks at the top of the file
  const { useCollegeInterns } = require('../lib/swr-hooks');
  
  // Use SWR for fetching interns data
  const fetchInterns = async () => {
    setLoading(true);
    try {
      // Different API endpoints based on role
      let endpoint = '/api/admin/users?role=intern';
      
      console.log('Fetching interns for user role:', user?.role);
      
      if (user?.role === 'mentor') {
        endpoint = '/api/mentor/assigned-interns';
      } else if (user?.role === 'super-mentor') {
        endpoint = '/api/super-mentor/college-interns';
        console.log('Using super-mentor endpoint for college interns');
      }
      
      // Use fetch with improved error handling
      const response = await fetch(endpoint);
      console.log('Fetch response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched interns data:', data);
        setInterns(data.users || data.interns || []);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to fetch interns:', response.status, errorData.error || 'Unknown error');
        
        // If unauthorized, try refreshing user data
        if (response.status === 401 || response.status === 403) {
          console.log('Unauthorized, refreshing user data...');
          await refreshUserData();
        }
        
        setInterns([]);
      }
    } catch (error) {
      console.error('Error fetching interns:', error);
      setInterns([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshSession = async () => {
    setRefreshing(true);
    try {
      await refreshUserData();
      // Also refresh the interns data since role might have changed
      await fetchInterns();
      alert('✅ Session refreshed! Your dashboard has been updated with the latest permissions.');
    } catch (error) {
      console.error('Error refreshing session:', error);
      alert('❌ Failed to refresh session. Please try logging out and back in.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleSignOut = async () => {
    if (confirm('Are you sure you want to sign out?')) {
      try {
        await logout();
      } catch (error) {
        console.error('Error signing out:', error);
        alert('❌ Failed to sign out. Please try again.');
      }
    }
  };

  const renderOverview = () => {
    const totalInterns = interns.length;
    const activeInterns = interns.filter(i => i.status === 'active').length;
    const totalTasks = interns.reduce((sum, intern) => sum + intern.total_tasks, 0);
    const completedTasks = interns.reduce((sum, intern) => sum + intern.completed_tasks, 0);
    const overallCompletion = totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(1) : 0;
    const avgPerformance = interns.length > 0 ? (interns.reduce((sum, intern) => sum + intern.performance_score, 0) / interns.length).toFixed(1) : 0;

    return (
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-lg">👥</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Interns</p>
                <p className="text-2xl font-bold text-gray-900">{totalInterns}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-green-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-lg">✅</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Interns</p>
                <p className="text-2xl font-bold text-gray-900">{activeInterns}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-lg">📝</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Tasks</p>
                <p className="text-2xl font-bold text-gray-900">{totalTasks}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-orange-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-lg">📊</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Overall Completion</p>
                <p className="text-2xl font-bold text-gray-900">{overallCompletion}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-r from-pink-400 to-pink-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-lg">⭐</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Avg Performance</p>
                <p className="text-2xl font-bold text-gray-900">{avgPerformance}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Interns Performance Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Intern Performance Overview</h3>
              <span className="text-sm text-gray-500">{interns.length} interns</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Intern
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    College
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tasks
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Completion Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Performance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {interns.map((intern) => (
                  <tr key={intern.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                          {intern.name.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{intern.name}</div>
                          <div className="text-sm text-gray-500">{intern.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <CollegeBadge college={{ name: intern.college_name }} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {intern.completed_tasks}/{intern.total_tasks}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-1 mr-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${intern.completion_rate}%` }}
                            ></div>
                          </div>
                        </div>
                        <span className="text-sm text-gray-900">{intern.completion_rate.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {intern.performance_score.toFixed(1)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        intern.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {intern.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'intern-management':
        return <InternManagementTab userRole={user?.role} />;
      case 'mentor-management':
        return user?.role === 'super-mentor' ? <MentorManagementTab /> : renderComingSoon();
      case 'cohort-management':
        return user?.role === 'super-mentor' ? <CohortManagementTab /> : renderComingSoon();
      case 'task-management':
        return user?.role === 'super-mentor' ? <AdvancedTaskManagement /> : renderComingSoon();
      case 'performance':
        return <PerformanceOverview userRole={user?.role} />;
      case 'team-activity':
        return <TeamActivity userRole={user?.role} />;
      case 'team-dashboard':
        return user?.role === 'super-mentor' ? <TeamActivityDashboard /> : renderComingSoon();
      case 'gitlab-integration':
        return user?.role === 'super-mentor' ? <GitLabIntegrationDashboard /> : renderComingSoon();
      case 'attendance':
        return <AttendanceTab userRole={user?.role} />;
      case 'leaderboard':
        return <LeaderboardTab userRole={user?.role} />;
      case 'communication':
        return user?.role === 'super-mentor' ? <SuperMentorCommunicationTab /> : renderComingSoon();
      case 'team-chat':
        return <EnhancedChat userRole={user?.role} />;
      case 'meetings':
        return user?.role === 'super-mentor' ? <MeetingsTab /> : renderComingSoon();
      case 'ai-settings':
        return <AIAssistantTab />;
      default:
        return renderComingSoon();
    }
  };

  const renderComingSoon = () => (
    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">🚧</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{tabs.find(t => t.id === activeTab)?.name}</h3>
        <p className="text-gray-600 max-w-md mx-auto">
          This feature is coming soon! We're working hard to bring you amazing tools for managing your internship program.
        </p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="bg-gray-50">
        {/* Header Skeleton */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-4">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tab Navigation Skeleton */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-6 py-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Content Skeleton */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="animate-pulse space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white p-6 rounded-xl shadow-sm">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="mb-4 sm:mb-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  Welcome back, {user?.name}!
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  <span className="inline-flex items-center">
                    <span className="mr-1">{user?.role === 'super-mentor' ? '👨‍💼' : '👨‍🏫'}</span>
                    {user?.role === 'super-mentor' 
                      ? 'Manage mentors, interns, and college operations'
                      : 'Manage and monitor your assigned interns'
                    }
                  </span>
                </p>
              </div>
              
              {/* Quick Stats and Actions */}
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className="text-lg font-semibold text-blue-600">
                    {interns.length}
                  </div>
                  <div className="text-xs text-gray-500">Total Interns</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-600">
                    {interns.filter(i => i.status === 'active').length}
                  </div>
                  <div className="text-xs text-gray-500">Active</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-purple-600">
                    {interns.reduce((sum, intern) => sum + intern.totalTasks, 0)}
                  </div>
                  <div className="text-xs text-gray-500">Total Tasks</div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center space-x-2 ml-4">
                  {/* Refresh Button */}
                  <button
                    onClick={handleRefreshSession}
                    disabled={refreshing}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                    title="Refresh your session to get the latest permissions and data"
                  >
                    <svg 
                      className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span className="text-sm hidden sm:inline">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
                  </button>

                  {/* Sign Out Button */}
                  <button
                    onClick={handleSignOut}
                    className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                    title="Sign out of your account"
                  >
                    <svg 
                      className="w-4 h-4" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span className="text-sm hidden sm:inline">Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-6 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap py-3 px-3 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                } rounded-t-lg`}
              >
                <span className="text-base">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {renderTabContent()}
      </div>
    </div>
  );
}