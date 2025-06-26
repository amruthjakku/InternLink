'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { getCollegeName } from '../utils/helpers';
import { TasksTab } from './intern/TasksTab';
import { ProgressTab } from './intern/ProgressTab';
import { PerformanceTab } from './intern/PerformanceTab';
import { LeaderboardTab } from './intern/LeaderboardTab';
import { UnifiedAttendanceTab } from './intern/UnifiedAttendanceTab';
import { ChatTab } from './intern/ChatTab';
import { EnhancedChat } from './EnhancedChat';
import { AIAssistantTab } from './intern/AIAssistantTab';
import { ProfileTab } from './intern/ProfileTab';
import { GitLabTab } from './intern/GitLabTab';
import { EnhancedGitLabTab } from './intern/EnhancedGitLabTab';
import { Meetings } from './Meetings';
import { GitLabCommitTracker } from './GitLabCommitTracker';
import { ProfileCard } from './ProfileCard';

export function InternDashboard() {
  const { user, refreshUserData, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('progress');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const tabs = [
    { id: 'progress', name: 'Progress', icon: '📊' },
    { id: 'tasks', name: 'Tasks', icon: '📝' },
    { id: 'performance', name: 'Performance', icon: '📈' },
    { id: 'gitlab', name: 'GitLab', icon: '🦊' },
    { id: 'meetings', name: 'Meetings', icon: '📹' },
    { id: 'profile', name: 'Profile', icon: '👤' },
    { id: 'leaderboard', name: 'Leaderboard', icon: '🏆' },
    { id: 'attendance', name: 'Attendance', icon: '📍' },
    { id: 'chat', name: 'Chat', icon: '💬' },
    { id: 'ai-assistant', name: 'AI Assistant', icon: '🤖' },
  ];

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/tasks');
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || []);
      } else {
        setTasks([]);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshSession = async () => {
    setRefreshing(true);
    try {
      await refreshUserData();
      // Also refresh the tasks data since role might have changed
      await fetchTasks();
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

  const updateTask = (taskId, updates) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId 
          ? { ...task, ...(updates || {}), updated_at: new Date().toISOString() }
          : task
      )
    );
  };

  const renderTabContent = () => {
    const commonProps = { 
      user: user || null, 
      tasks: tasks || [], 
      updateTask: updateTask || (() => {}), 
      loading: loading || false 
    };

    switch (activeTab) {
      case 'progress':
        return <ProgressTab {...commonProps} />;
      case 'tasks':
        return <TasksTab {...commonProps} />;
      case 'performance':
        return <PerformanceTab {...commonProps} />;
      case 'gitlab':
        return <EnhancedGitLabTab {...commonProps} />;
      case 'meetings':
        return <Meetings />;
      case 'profile':
        return <ProfileTab />;
      case 'leaderboard':
        return <LeaderboardTab {...commonProps} />;
      case 'attendance':
        return <UnifiedAttendanceTab {...commonProps} />;
      case 'chat':
        return <EnhancedChat userRole="intern" />;
      case 'ai-assistant':
        return <AIAssistantTab {...commonProps} />;
      default:
        return <ProgressTab {...commonProps} />;
    }
  };

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
                {user?.college && (
                  <p className="mt-1 text-sm text-gray-600">
                    <span className="inline-flex items-center">
                      <span className="mr-1">🏫</span>
                      {getCollegeName(user.college)}
                    </span>
                  </p>
                )}
                {user?.cohortId && (
                  <p className="mt-1 text-sm text-gray-600">
                    <span className="inline-flex items-center">
                      <span className="mr-1">👥</span>
                      Cohort: {user.cohortName || user.cohortId}
                    </span>
                  </p>
                )}
              </div>
              
              {/* Quick Stats and Actions */}
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className="text-lg font-semibold text-blue-600">
                    {tasks.filter(t => t.status === 'done').length}
                  </div>
                  <div className="text-xs text-gray-500">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-orange-600">
                    {tasks.filter(t => t.status === 'in_progress').length}
                  </div>
                  <div className="text-xs text-gray-500">In Progress</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-600">
                    {tasks.length}
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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {renderTabContent()}
          </div>
          
          {/* Sidebar with Profile Card */}
          <div className="lg:col-span-1 space-y-6">
            <ProfileCard user={user} showMilestones={true} />
            
            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setActiveTab('tasks')}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md flex items-center space-x-2"
                >
                  <span>📝</span>
                  <span>View Tasks</span>
                </button>
                <button
                  onClick={() => setActiveTab('gitlab')}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md flex items-center space-x-2"
                >
                  <span>🦊</span>
                  <span>GitLab Activity</span>
                </button>
                <button
                  onClick={() => setActiveTab('attendance')}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md flex items-center space-x-2"
                >
                  <span>📍</span>
                  <span>Mark Attendance</span>
                </button>
                <button
                  onClick={() => setActiveTab('meetings')}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md flex items-center space-x-2"
                >
                  <span>📹</span>
                  <span>Join Meeting</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}