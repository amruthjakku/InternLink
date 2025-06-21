'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { TasksTab } from './intern/TasksTab';
import { ProgressTab } from './intern/ProgressTab';
import { PerformanceTab } from './intern/PerformanceTab';
import { LeaderboardTab } from './intern/LeaderboardTab';
import { AttendanceTab } from './intern/AttendanceTab';
import { ChatTab } from './intern/ChatTab';
import { AIAssistantTab } from './intern/AIAssistantTab';
import { ProfileTab } from './intern/ProfileTab';

export function InternDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('progress');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const tabs = [
    { id: 'progress', name: 'Progress', icon: '📊' },
    { id: 'tasks', name: 'Tasks', icon: '📝' },
    { id: 'performance', name: 'Performance', icon: '📈' },
    { id: 'profile', name: 'Profile', icon: '👤' },
    { id: 'leaderboard', name: 'Leaderboard', icon: '🏆' },
    { id: 'attendance', name: 'Attendance', icon: '📍' },
    { id: 'chat', name: 'Chat', icon: '💬' },
    { id: 'ai-assistant', name: 'AI Assistant', icon: '🤖' },
  ];

  useEffect(() => {
    // Simulate loading user data and tasks
    setTimeout(() => {
      setTasks([
        {
          id: 1,
          title: 'Complete React Tutorial',
          description: 'Learn React fundamentals including components, state, and props',
          status: 'in_progress',
          progress: 75,
          category: 'Frontend Development',
          priority: 'high',
          due_date: '2024-01-20',
          time_spent: 8,
          submission_link: '',
          dependencies: [],
          created_at: '2024-01-10',
          updated_at: '2024-01-15'
        },
        {
          id: 2,
          title: 'Build Todo App',
          description: 'Create a full-stack todo application with CRUD operations',
          status: 'done',
          progress: 100,
          category: 'Full Stack Development',
          priority: 'medium',
          due_date: '2024-01-15',
          time_spent: 12,
          submission_link: 'https://github.com/user/todo-app',
          dependencies: [1],
          created_at: '2024-01-08',
          updated_at: '2024-01-14'
        },
        {
          id: 3,
          title: 'Learn Next.js',
          description: 'Understand Next.js framework, routing, and server-side rendering',
          status: 'not_started',
          progress: 0,
          category: 'Frontend Development',
          priority: 'medium',
          due_date: '2024-01-25',
          time_spent: 0,
          submission_link: '',
          dependencies: [1],
          created_at: '2024-01-12',
          updated_at: '2024-01-12'
        },
        {
          id: 4,
          title: 'Database Design Project',
          description: 'Design and implement a database schema for an e-commerce application',
          status: 'in_progress',
          progress: 30,
          category: 'Backend Development',
          priority: 'high',
          due_date: '2024-01-30',
          time_spent: 5,
          submission_link: '',
          dependencies: [],
          created_at: '2024-01-13',
          updated_at: '2024-01-16'
        },
        {
          id: 5,
          title: 'API Integration',
          description: 'Integrate third-party APIs and handle authentication',
          status: 'not_started',
          progress: 0,
          category: 'Backend Development',
          priority: 'low',
          due_date: '2024-02-05',
          time_spent: 0,
          submission_link: '',
          dependencies: [4],
          created_at: '2024-01-14',
          updated_at: '2024-01-14'
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

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
      case 'profile':
        return <ProfileTab />;
      case 'leaderboard':
        return <LeaderboardTab {...commonProps} />;
      case 'attendance':
        return <AttendanceTab {...commonProps} />;
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
                      {user.college}
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