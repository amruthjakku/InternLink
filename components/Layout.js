'use client';

import { useState } from 'react';
import { useAuth } from './AuthProvider';

export function Layout({ children }) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) return children;

  const navigation = user.role === 'mentor' 
    ? [
        { name: 'Overview', icon: '📊', id: 'overview' },
        { name: 'Interns', icon: '👥', id: 'interns' },
        { name: 'Tasks', icon: '📝', id: 'tasks' },
        { name: 'Categories', icon: '🎯', id: 'categories' },
        { name: 'Colleges', icon: '🏫', id: 'colleges' },
        { name: 'Attendance', icon: '📍', id: 'attendance' },
        { name: 'Leaderboard', icon: '🏆', id: 'leaderboard' },
        { name: 'Chat', icon: '💬', id: 'chat' },
        { name: 'Meetings', icon: '📹', id: 'meetings' },
        { name: 'AI Settings', icon: '🤖', id: 'ai-settings' },
      ]
    : [
        { name: 'Progress', icon: '📊', id: 'progress' },
        { name: 'Tasks', icon: '📝', id: 'tasks' },
        { name: 'Performance', icon: '📈', id: 'performance' },
        { name: 'Leaderboard', icon: '🏆', id: 'leaderboard' },
        { name: 'Attendance', icon: '📍', id: 'attendance' },
        { name: 'Chat', icon: '💬', id: 'chat' },
        { name: 'AI Assistant', icon: '🤖', id: 'ai-assistant' },
      ];

  return (
    <div className="min-h-screen bg-gray-50">


      {/* Main content */}
      <div className="flex flex-col min-h-screen">
        {/* Top bar */}
        <div className="sticky top-0 z-20 flex-shrink-0 flex h-16 bg-white shadow-sm border-b border-gray-200">
          
          <div className="flex-1 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            {/* Left side - Logo/Title */}
            <div className="flex items-center">
              <h1 className="text-lg font-semibold text-gray-900">Progress Tracker</h1>
              <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {user.role === 'mentor' ? '👨‍🏫 Mentor' : '👨‍🎓 Intern'}
              </span>
            </div>
            
            {/* Right side - User info and controls */}
            <div className="flex items-center space-x-3">
              {user.is_demo && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  <span className="hidden sm:inline">Demo Mode</span>
                  <span className="sm:hidden">Demo</span>
                </span>
              )}
              
              {/* User Avatar and Info */}
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden md:block text-sm">
                  <div className="font-medium text-gray-900">{user.name}</div>
                  <div className="text-gray-500 text-xs">{user.role}</div>
                </div>
              </div>
              
              {/* Logout button */}
              <button
                onClick={logout}
                className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-red-600 hover:bg-red-50 transition-colors"
              >
                <span className="mr-2 text-lg">🚪</span>
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}