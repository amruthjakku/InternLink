'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
// Removed mockData import - using real API calls
import { InternManagementTab } from './mentor/InternManagementTab';
import { AdvancedTaskManagement } from './mentor/AdvancedTaskManagement';
import { CategoriesTab } from './mentor/CategoriesTab';
import { CollegesTab } from './mentor/CollegesTab';
import { AttendanceTab } from './mentor/AttendanceTab';
import { LeaderboardTab } from './mentor/LeaderboardTab';
import { CommunicationTab } from './mentor/CommunicationTab';
import { MeetingsTab } from './mentor/MeetingsTab';
import { AIAssistantTab } from './mentor/AIAssistantTab';
import { PerformanceOverview } from './mentor/PerformanceOverview';
import { TeamActivity } from './mentor/TeamActivity';
import TeamActivityDashboard from './dashboard/TeamActivity';
import GitLabIntegrationDashboard from './dashboard/GitLabIntegration';
import { Chat } from './Chat';

export function MentorDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [interns, setInterns] = useState([]);
  const [loading, setLoading] = useState(true);

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'intern-management', name: 'Intern Management', icon: '👥' },
    { id: 'task-management', name: 'Task Management', icon: '📝' },
    { id: 'performance', name: 'Performance', icon: '📈' },
    { id: 'team-activity', name: 'Team Activity', icon: '🔄' },
    { id: 'team-dashboard', name: 'Team Dashboard', icon: '📊' },
    { id: 'gitlab-integration', name: 'GitLab Integration', icon: '🦊' },
    { id: 'categories', name: 'Categories', icon: '🎯' },
    { id: 'colleges', name: 'Colleges', icon: '🏫' },
    { id: 'attendance', name: 'Attendance', icon: '📍' },
    { id: 'leaderboard', name: 'Leaderboard', icon: '🏆' },
    { id: 'communication', name: 'Communication', icon: '💬' },
    { id: 'team-chat', name: 'Team Chat', icon: '💭' },
    { id: 'meetings', name: 'Meetings', icon: '📹' },
    { id: 'ai-settings', name: 'AI Assistant', icon: '🤖' },
  ];

  useEffect(() => {
    fetchInterns();
  }, []);

  const fetchInterns = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/users?role=intern');
      if (response.ok) {
        const data = await response.json();
        setInterns(data.users || []);
      } else {
        setInterns([]);
      }
    } catch (error) {
      console.error('Error fetching interns:', error);
      setInterns([]);
    } finally {
      setLoading(false);
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {intern.college_name}
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
        return <InternManagementTab />;
      case 'task-management':
        return <AdvancedTaskManagement />;
      case 'performance':
        return <PerformanceOverview />;
      case 'team-activity':
        return <TeamActivity />;
      case 'team-dashboard':
        return <TeamActivityDashboard />;
      case 'gitlab-integration':
        return <GitLabIntegrationDashboard />;
      case 'categories':
        return <CategoriesTab />;
      case 'colleges':
        return <CollegesTab />;
      case 'attendance':
        return <AttendanceTab />;
      case 'leaderboard':
        return <LeaderboardTab />;
      case 'communication':
        return <CommunicationTab />;
      case 'team-chat':
        return <Chat />;
      case 'meetings':
        return <MeetingsTab />;
      case 'ai-settings':
        return <AIAssistantTab />;
      default:
        return (
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
    }
  };

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
                    <span className="mr-1">👨‍🏫</span>
                    Manage and monitor intern progress
                  </span>
                </p>
              </div>
              
              {/* Quick Stats */}
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