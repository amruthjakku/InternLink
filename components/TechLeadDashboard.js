'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { AIDeveloperInternManagementTab } from './tech-lead/InternManagementTab';
import { AdvancedTaskManagement } from './tech-lead/AdvancedTaskManagement';
import { AttendanceTab } from './tech-lead/AttendanceTab';
import { LeaderboardTab } from './tech-lead/LeaderboardTab';
import { CommunicationTab } from './tech-lead/CommunicationTab';
import { POCCommunicationTab } from './tech-lead/SuperMentorCommunicationTab';
import { MeetingsTab } from './tech-lead/MeetingsTab';
import { AIAssistantTab } from './tech-lead/AIAssistantTab';
import { PerformanceOverview } from './tech-lead/PerformanceOverview';
import { TeamActivity } from './tech-lead/TeamActivity';
import { TechLeadManagementTab } from './tech-lead/MentorManagementTab';
import { CohortManagementTab } from './tech-lead/CohortManagementTab';
import TeamActivityDashboard from './dashboard/TeamActivity';
import { CollegeBadge } from './CollegeLogo';
import GitLabIntegrationDashboard from './dashboard/GitLabIntegration';
import EnhancedChat from './EnhancedChat';

export function TechLeadDashboard() {
  const { user, refreshUserData, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [activeGroup, setActiveGroup] = useState('management');
  const [interns, setAIDeveloperInterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  console.log('TechLeadDashboard component initialized with user:', user?.name, 'role:', user?.role);

  // Grouped tabs structure similar to admin dashboard
  const getTabGroups = (role) => {
    const baseGroups = {
      management: {
        name: 'Management',
        icon: '👥',
        color: 'blue',
        tabs: [
          { id: 'overview', name: 'Overview', icon: '📊', description: 'Dashboard overview and key metrics' },
          { id: 'intern-management', name: 'AI Developer Intern Management', icon: '👨‍🎓', description: 'Manage assigned interns' },
          { id: 'performance', name: 'Performance', icon: '📈', description: 'Monitor intern performance' },
          { id: 'attendance', name: 'Attendance', icon: '📍', description: 'Track attendance records' }
        ]
      },
      collaboration: {
        name: 'Collaboration',
        icon: '🤝',
        color: 'green',
        tabs: [
          { id: 'team-activity', name: 'Team Activity', icon: '🔄', description: 'Monitor team activities' },
          { id: 'team-chat', name: 'Team Chat', icon: '💬', description: 'Communicate with team' },
          { id: 'meetings', name: 'Meetings', icon: '📹', description: 'Schedule and manage meetings' },
          { id: 'leaderboard', name: 'Leaderboard', icon: '🏆', description: 'View team rankings' }
        ]
      },
      tools: {
        name: 'Tools',
        icon: '🛠️',
        color: 'purple',
        tabs: [
          { id: 'ai-assistant', name: 'AI Assistant', icon: '🤖', description: 'AI-powered assistance' },
          { id: 'analytics', name: 'Analytics', icon: '📊', description: 'Detailed analytics dashboard' }
        ]
      }
    };

    if (role === 'POC') {
      // Add POC specific groups
      return {
        ...baseGroups,
        administration: {
          name: 'Administration',
          icon: '⚙️',
          color: 'orange',
          tabs: [
            { id: 'mentor-management', name: 'Tech Lead Management', icon: '👨‍🏫', description: 'Manage mentors' },
            { id: 'cohort-management', name: 'Cohort Management', icon: '🎓', description: 'Manage cohorts' },
            { id: 'task-management', name: 'Task Management', icon: '📝', description: 'Advanced task management' },
            { id: 'system-overview', name: 'System Overview', icon: '🏢', description: 'System-wide overview' }
          ]
        },
        integration: {
          name: 'Integration',
          icon: '🔗',
          color: 'indigo',
          tabs: [
            { id: 'gitlab-integration', name: 'GitLab Integration', icon: '🦊', description: 'GitLab integration dashboard' },
            { id: 'communication', name: 'Communication', icon: '📢', description: 'System-wide communication' }
          ]
        }
      };
    }

    return baseGroups;
  };

  const tabGroups = getTabGroups(user?.role || 'Tech Lead');
  const currentGroup = tabGroups[activeGroup];

  useEffect(() => {
    if (user) {
      setActiveTab('overview');
      setActiveGroup('management');
      fetchAIDeveloperInterns();
    }
  }, [user]);


  
  // Use SWR for fetching interns data
  const fetchAIDeveloperInterns = async () => {
    setLoading(true);
    try {
      // Different API endpoints based on role
      let endpoint = '/api/admin/users?role=AI%20Developer%20Intern';
      
      console.log('Fetching interns for user role:', user?.role);
      
      if (user?.role === 'Tech Lead') {
        endpoint = '/api/tech-lead/assigned-interns';
      } else if (user?.role === 'POC') {
        endpoint = '/api/poc/college-interns';
        console.log('Using POC endpoint for college interns');
      }
      
      // Use fetch with improved error handling
      const response = await fetch(endpoint);
      console.log('Fetch response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched interns data:', data);
        setAIDeveloperInterns(data.users || data.interns || []);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to fetch interns:', response.status, errorData.error || 'Unknown error');
        
        // If unauthorized, try refreshing user data
        if (response.status === 401 || response.status === 403) {
          console.log('Unauthorized, refreshing user data...');
          await refreshUserData();
        }
        
        setAIDeveloperInterns([]);
      }
    } catch (error) {
      console.error('Error fetching interns:', error);
      setAIDeveloperInterns([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshSession = async () => {
    setRefreshing(true);
    try {
      await refreshUserData();
      // Also refresh the interns data since role might have changed
      await fetchAIDeveloperInterns();
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
    const totalAIDeveloperInterns = interns.length;
    const activeAIDeveloperInterns = interns.filter(i => i.status === 'active').length;
    const totalTasks = interns.reduce((sum, intern) => sum + (intern.total_tasks || 0), 0);
    const completedTasks = interns.reduce((sum, intern) => sum + (intern.completed_tasks || 0), 0);
    const overallCompletion = totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(1) : 0;
    const avgPerformance = interns.length > 0 ? (interns.reduce((sum, intern) => sum + (intern.performance_score || 0), 0) / interns.length).toFixed(1) : 0;

    return (
      <div className="space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-xl text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total AI Developer Interns</p>
                <p className="text-3xl font-bold">{totalAIDeveloperInterns}</p>
              </div>
              <div className="text-3xl opacity-80">👥</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-xl text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Active AI Developer Interns</p>
                <p className="text-3xl font-bold">{activeAIDeveloperInterns}</p>
              </div>
              <div className="text-3xl opacity-80">✅</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-xl text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Total Tasks</p>
                <p className="text-3xl font-bold">{totalTasks}</p>
              </div>
              <div className="text-3xl opacity-80">📝</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-xl text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Completion Rate</p>
                <p className="text-3xl font-bold">{overallCompletion}%</p>
              </div>
              <div className="text-3xl opacity-80">📊</div>
            </div>
          </div>
        </div>

        {/* Recent Activity & Top Performers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Performers */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <span className="mr-2">🏆</span>
                Top Performers
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {interns
                  .sort((a, b) => (b.performance_score || 0) - (a.performance_score || 0))
                  .slice(0, 5)
                  .map((intern, index) => (
                    <div key={intern.id} className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                        index === 0 ? 'bg-yellow-500' : 
                        index === 1 ? 'bg-gray-400' : 
                        index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                        {intern.name?.charAt(0) || 'U'}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{intern.name}</p>
                        <p className="text-sm text-gray-500">Score: {intern.performance_score || 0}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <span className="mr-2">🔄</span>
                Recent Activity
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {[
                  { type: 'task_completed', intern: 'John Doe', action: 'completed task "React Component"', time: '2 hours ago', color: 'green' },
                  { type: 'task_assigned', intern: 'Jane Smith', action: 'was assigned new task', time: '4 hours ago', color: 'blue' },
                  { type: 'attendance', intern: 'Mike Johnson', action: 'marked attendance', time: '1 day ago', color: 'purple' },
                  { type: 'performance', intern: 'Sarah Wilson', action: 'received performance feedback', time: '2 days ago', color: 'orange' }
                ].map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className={`w-2 h-2 rounded-full mt-2 bg-${activity.color}-500`}></div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">{activity.intern}</span> {activity.action}
                      </p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* AI Developer Interns Performance Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">AI Developer Intern Performance Overview</h3>
              <span className="text-sm text-gray-500">{interns.length} interns</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    AI Developer Intern
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
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                          {intern.name?.charAt(0) || 'U'}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{intern.name}</div>
                          <div className="text-sm text-gray-500">{intern.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {intern.college_name ? (
                        <CollegeBadge college={{ name: intern.college_name }} />
                      ) : (
                        <span className="text-sm text-gray-500">No college</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {intern.completed_tasks || 0}/{intern.total_tasks || 0}
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
    const commonProps = { 
      user: user || null, 
      interns: interns || [], 
      loading: loading || false,
      userRole: user?.role
    };

    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'intern-management':
        return <AIDeveloperInternManagementTab {...commonProps} />;
      case 'mentor-management':
        return user?.role === 'POC' ? <TechLeadManagementTab {...commonProps} /> : renderAccessDenied();
      case 'cohort-management':
        return user?.role === 'POC' ? <CohortManagementTab {...commonProps} /> : renderAccessDenied();
      case 'task-management':
        return user?.role === 'POC' ? <AdvancedTaskManagement {...commonProps} /> : renderAccessDenied();
      case 'performance':
        return <PerformanceOverview {...commonProps} />;
      case 'team-activity':
        return <TeamActivity {...commonProps} />;
      case 'system-overview':
        return user?.role === 'POC' ? <TeamActivityDashboard {...commonProps} /> : renderAccessDenied();
      case 'gitlab-integration':
        return user?.role === 'POC' ? <GitLabIntegrationDashboard {...commonProps} /> : renderAccessDenied();
      case 'attendance':
        return <AttendanceTab {...commonProps} />;
      case 'leaderboard':
        return <LeaderboardTab {...commonProps} />;
      case 'communication':
        return user?.role === 'POC' ? <POCCommunicationTab {...commonProps} /> : renderAccessDenied();
      case 'team-chat':
        return <EnhancedChat userRole={user?.role} />;
      case 'meetings':
        return <MeetingsTab {...commonProps} />;
      case 'ai-assistant':
        return <AIAssistantTab {...commonProps} />;
      case 'analytics':
        return renderAnalyticsDashboard();
      default:
        return renderOverview();
    }
  };

  const renderAnalyticsDashboard = () => (
    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Advanced Analytics</h3>
        <p className="text-gray-600 max-w-md mx-auto">
          Detailed analytics dashboard with comprehensive insights is coming soon!
        </p>
      </div>
    </div>
  );

  const renderAccessDenied = () => (
    <div className="bg-white p-8 rounded-xl shadow-sm border border-red-200">
      <div className="text-center py-12">
        <div className="text-red-400 text-6xl mb-4">🚫</div>
        <h3 className="text-xl font-semibold text-red-900 mb-2">Access Denied</h3>
        <p className="text-red-600 max-w-md mx-auto">
          You don't have permission to access this feature. Contact your administrator if you believe this is an error.
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
    <div className="bg-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="mb-4 sm:mb-0">
                <h1 className="text-3xl font-bold text-gray-900">
                  Welcome back, {user?.name}!
                </h1>
                <p className="mt-2 text-sm text-gray-600">
                  <span className="inline-flex items-center">
                    <span className="mr-2">{user?.role === 'POC' ? '👨‍💼' : '👨‍🏫'}</span>
                    {user?.role === 'POC' 
                      ? 'Manage Tech Leads, AI developer interns, and college operations'
                      : 'Manage and monitor your assigned interns'
                    }
                  </span>
                </p>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleRefreshSession}
                  disabled={refreshing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
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
                  <span className="text-sm">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
                </button>

                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
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
                  <span className="text-sm">Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Groups Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 overflow-x-auto scrollbar-hide py-2">
            {Object.entries(tabGroups).map(([groupId, group]) => (
              <button
                key={groupId}
                onClick={() => {
                  setActiveGroup(groupId);
                  setActiveTab(group.tabs[0].id);
                }}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                  activeGroup === groupId
                    ? `bg-${group.color}-100 text-${group.color}-700 border border-${group.color}-200`
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <span>{group.icon}</span>
                <span>{group.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sub-tabs Navigation */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 overflow-x-auto scrollbar-hide py-3">
            {currentGroup?.tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white hover:shadow-sm'
                }`}
                title={tab.description}
              >
                <span className="text-base">{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {renderTabContent()}
      </div>
    </div>
  );
}