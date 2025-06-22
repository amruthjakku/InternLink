'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { getCollegeName } from '../utils/helpers';
import { TasksTab } from './intern/TasksTab';
import { ProgressTab } from './intern/ProgressTab';
import { PerformanceTab } from './intern/PerformanceTab';
import { LeaderboardTab } from './intern/LeaderboardTab';
import { AttendanceTab } from './intern/AttendanceTab';
import { ChatTab } from './intern/ChatTab';
import { AIAssistantTab } from './intern/AIAssistantTab';
import { ProfileTab } from './intern/ProfileTab';
import { GitLabTab } from './intern/GitLabTab';
import { Meetings } from './Meetings';
import { GitLabCommitTracker } from './GitLabCommitTracker';
import { AttendanceHistory } from './AttendanceHistory';

export function InternDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('progress');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const tabs = [
    { id: 'progress', name: 'Progress', icon: '📊' },
    { id: 'tasks', name: 'Tasks', icon: '📝' },
    { id: 'performance', name: 'Performance', icon: '📈' },
    { id: 'gitlab', name: 'GitLab', icon: '🦊' },
    { id: 'meetings', name: 'Meetings', icon: '📹' },
    { id: 'profile', name: 'Profile', icon: '👤' },
    { id: 'leaderboard', name: 'Leaderboard', icon: '🏆' },
    { id: 'attendance', name: 'Attendance', icon: '📍' },
    { id: 'attendance-history', name: 'Attendance History', icon: '📅' },
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

  const updateTask = (taskId, updates) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId 
          ? { ...task, ...updates, updated_at: new Date().toISOString() }
          : task
      )
    );
  };

  const renderTabContent = () => {
    const commonProps = { user, tasks, updateTask, loading };

    switch (activeTab) {
      case 'progress':
        return <ProgressTab {...commonProps} />;
      case 'tasks':
        return <TasksTab {...commonProps} />;
      case 'performance':
        return <PerformanceTab {...commonProps} />;
      case 'gitlab':
        return <GitLabTab {...commonProps} />;
      case 'meetings':
        return <Meetings />;
      case 'profile':
        return <ProfileTab />;
      case 'leaderboard':
        return <LeaderboardTab {...commonProps} />;
      case 'attendance':
        return <AttendanceTab {...commonProps} />;
      case 'attendance-history':
        return <AttendanceHistory />;
      case 'chat':
        return <ChatTab {...commonProps} />;
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
              </div>
              
              {/* Quick Stats */}
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