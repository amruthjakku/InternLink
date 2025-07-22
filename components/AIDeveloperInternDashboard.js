'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthProvider';
import { getCollegeName, getCohortName } from '../utils/helpers';
import { TasksTab } from './ai-developer-intern/TasksTab';
import { ProgressTab } from './ai-developer-intern/ProgressTab';
import { PerformanceTab } from './ai-developer-intern/PerformanceTab';
import { LeaderboardTab } from './ai-developer-intern/LeaderboardTab';
import { UnifiedAttendanceTab } from './ai-developer-intern/UnifiedAttendanceTab';
import { ChatTab } from './ai-developer-intern/ChatTab';
import EnhancedChat from './EnhancedChat';
import { AIAssistantTab } from './ai-developer-intern/AIAssistantTab';
import { ProfileTab } from './ai-developer-intern/ProfileTab';
import { GitLabTab } from './ai-developer-intern/GitLabTab';
import { EnhancedGitLabTab } from './ai-developer-intern/EnhancedGitLabTab';
import { AnnouncementsTab } from './ai-developer-intern/AnnouncementsTab';
import { Meetings } from './Meetings';
import { GitLabCommitTracker } from './GitLabCommitTracker';
import { ProfileCard } from './ProfileCard';
import { CollegeLogo } from './CollegeLogo';
import { useTabData, useDashboardData } from '../hooks/useTabData';
import { cachedFetch, CacheKeys, CacheTTL, invalidateTaskCache } from '../utils/cache';

export function AIDeveloperInternDashboard() {
  const { user, refreshUserData, logout } = useAuth();
  
  const [tabOrder, setTabOrder] = useState(['progress', 'tasks', 'performance', 'gitlab', 'meetings', 'profile', 'leaderboard', 'attendance', 'chat', 'announcements', 'ai-assistant']);
  const [draggedTab, setDraggedTab] = useState(null);
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Initialize dashboard data management with caching
  const { globalData, globalLoading, dataFetchers } = useDashboardData(
    user?.gitlabUsername || user?.email, 
    'AI Developer Intern'
  );

  // Tab-specific data fetchers with caching
  const tabDataFetchers = useMemo(() => ({
    tasks: () => cachedFetch('/api/tasks', {}, CacheKeys.USER_TASKS(user?.gitlabUsername), CacheTTL.TASKS),
    performance: () => cachedFetch('/api/user/performance', {}, CacheKeys.USER_PERFORMANCE(user?.gitlabUsername), CacheTTL.PERFORMANCE),
    attendance: () => cachedFetch('/api/attendance/user', {}, CacheKeys.USER_ATTENDANCE(user?.gitlabUsername), CacheTTL.PERFORMANCE),
    gitlab: () => cachedFetch('/api/gitlab/user-data', {}, CacheKeys.USER_GITLAB_DATA(user?.gitlabUsername), CacheTTL.PERFORMANCE),
    announcements: () => cachedFetch('/api/announcements', {}, CacheKeys.USER_ANNOUNCEMENTS(user?.gitlabUsername), CacheTTL.ANNOUNCEMENTS),
    chatRooms: () => cachedFetch('/api/chat-rooms', {}, CacheKeys.USER_CHAT_ROOMS(user?.gitlabUsername), CacheTTL.CHAT_ROOMS),
    leaderboard: () => cachedFetch('/api/leaderboard', {}, CacheKeys.LEADERBOARD_DATA('college'), CacheTTL.LEADERBOARD),
  }), [user?.gitlabUsername]);

  // Use tab data management with smart loading
  const {
    activeTab,
    switchTab,
    tabData,
    loading: tabLoading,
    errors: tabErrors,
    getData,
    isLoading,
    refresh: refreshCurrentTab,
    refreshData,
    preloadTab
  } = useTabData('progress', tabDataFetchers, {
    autoLoad: true,
    refreshOnTabSwitch: false, // Don't refresh on tab switch
    cacheTimeout: CacheTTL.MEDIUM
  });

  // All available tabs with their configurations
  const allTabs = {
    progress: { id: 'progress', name: 'Progress', icon: '📊' },
    tasks: { id: 'tasks', name: 'Tasks', icon: '📝' },
    performance: { id: 'performance', name: 'Performance', icon: '📈' },
    gitlab: { id: 'gitlab', name: 'GitLab', icon: '🦊' },
    meetings: { id: 'meetings', name: 'Meetings', icon: '📹' },
    profile: { id: 'profile', name: 'Profile', icon: '👤' },
    leaderboard: { id: 'leaderboard', name: 'Leaderboard', icon: '🏆' },
    attendance: { id: 'attendance', name: 'Attendance', icon: '📍' },
    chat: { id: 'chat', name: 'Chat', icon: '💬' },
    announcements: { id: 'announcements', name: 'Announcements', icon: '📢' },
    'ai-assistant': { id: 'ai-assistant', name: 'AI Assistant', icon: '🤖' }
  };

  // Get tabs in user's preferred order
  const getOrderedTabs = () => {
    return tabOrder
      .filter(tabId => allTabs[tabId])
      .map(tabId => allTabs[tabId]);
  };

  // Load user preferences with caching
  const loadUserPreferences = useCallback(async () => {
    try {
      const cacheKey = CacheKeys.USER_PREFERENCES(user?.gitlabUsername);
      const data = await cachedFetch('/api/user/preferences', {}, cacheKey, CacheTTL.USER_PROFILE);
      
      if (data?.preferences?.tabOrder) {
        setTabOrder(data.preferences.tabOrder);
        return;
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
    }
    
    // Fallback: try to load from localStorage
    try {
      const savedOrder = localStorage.getItem('dashboardTabOrder');
      if (savedOrder) {
        const parsedOrder = JSON.parse(savedOrder);
        setTabOrder(parsedOrder);
        console.log('Loaded preferences from localStorage fallback');
      }
    } catch (storageError) {
      console.error('Failed to load from localStorage:', storageError);
    }
  }, [user?.gitlabUsername]);

  useEffect(() => {
    if (user?.gitlabUsername) {
      loadUserPreferences();
      // Preload tasks data for the top navigation stats
      preloadTab('tasks');
    }
  }, [user?.gitlabUsername, loadUserPreferences, preloadTab]);

  // Save user preferences
  const saveUserPreferences = async (newTabOrder) => {
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ preferences: { tabOrder: newTabOrder } }),
      });

      if (response.ok) {
        const data = await response.json();
        setTabOrder(data.preferences.tabOrder);
        return true;
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        console.error('Failed to save preferences:', errorMessage);
        return false;
      }
    } catch (error) {
      console.error('Error saving user preferences:', error);
      // Fallback: save to localStorage if API fails
      try {
        localStorage.setItem('dashboardTabOrder', JSON.stringify(newTabOrder));
        console.log('Preferences saved to localStorage as fallback');
      } catch (storageError) {
        console.error('Failed to save to localStorage:', storageError);
      }
      return false;
    }
  };

  // Handle long press start (mouse and touch)
  const handlePressStart = (e, tabId) => {
    if (isDragging) return;
    
    e.preventDefault();
    
    const timer = setTimeout(() => {
      setDraggedTab(tabId);
      setIsDragging(true);
      e.target.style.opacity = '0.5';
      
      // Add haptic feedback on mobile
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 500); // 500ms long press
    
    setLongPressTimer(timer);
  };

  // Handle press end (mouse and touch)
  const handlePressEnd = (e, tabId) => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    
    if (!isDragging && !draggedTab) {
      // Normal click/tap - switch tab with caching
      switchTab(tabId);
    }
  };

  // Handle press leave
  const handlePressLeave = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  // Handle drag over
  const handleDragOver = (e, targetTabId) => {
    if (!isDragging || !draggedTab) return;
    
    e.preventDefault();
    
    if (draggedTab !== targetTabId) {
      const newOrder = [...tabOrder];
      const draggedIndex = newOrder.indexOf(draggedTab);
      const targetIndex = newOrder.indexOf(targetTabId);
      
      // Remove dragged item and insert at target position
      newOrder.splice(draggedIndex, 1);
      newOrder.splice(targetIndex, 0, draggedTab);
      
      setTabOrder(newOrder);
    }
  };

  // Handle drag end
  const handleDragEnd = async () => {
    if (draggedTab) {
      // Save the new order
      const success = await saveUserPreferences(tabOrder);
      if (!success) {
        console.warn('Failed to save tab order preferences, but continuing with local changes');
      }
      
      // Reset drag state
      setDraggedTab(null);
      setIsDragging(false);
      
      // Reset opacity
      const tabs = document.querySelectorAll('[data-tab-id]');
      tabs.forEach(tab => {
        tab.style.opacity = '1';
      });
    }
  };

  const handleRefreshSession = useCallback(async () => {
    if (refreshing) return; // Prevent multiple simultaneous refreshes
    
    setRefreshing(true);
    try {
      await refreshUserData();
      // Refresh current tab data since role might have changed
      await refreshCurrentTab();
      // Also refresh tasks data for the top navigation stats
      await refreshData('tasks');
      alert('✅ Session refreshed! Your dashboard has been updated with the latest permissions.');
    } catch (error) {
      console.error('Error refreshing session:', error);
      alert('❌ Failed to refresh session. Please try logging out and back in.');
    } finally {
      setRefreshing(false);
    }
  }, [refreshUserData, refreshCurrentTab, refreshData, refreshing]);

  // Preload next tabs for better UX
  const preloadNextTabs = useCallback(() => {
    const currentIndex = tabOrder.indexOf(activeTab);
    const nextTabs = [
      tabOrder[currentIndex + 1],
      tabOrder[currentIndex - 1]
    ].filter(Boolean);
    
    nextTabs.forEach(tab => {
      if (tab && tabDataFetchers[tab]) {
        preloadTab(tab);
      }
    });
  }, [activeTab, tabOrder, tabDataFetchers, preloadTab]);

  // Preload adjacent tabs when switching
  useEffect(() => {
    const timer = setTimeout(preloadNextTabs, 1000); // Preload after 1 second
    return () => clearTimeout(timer);
  }, [activeTab, preloadNextTabs]);

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

  // Update task status with cache invalidation
  const updateTask = useCallback(async (taskId, updates) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const updatedTask = await response.json();
        
        // Invalidate task cache to force refresh
        invalidateTaskCache(user?.gitlabUsername);
        
        // Refresh task data
        await refreshData('tasks');
        
        return updatedTask;
      } else {
        throw new Error('Failed to update task');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  }, [user?.gitlabUsername, refreshData]);

  // Get cached data with fallbacks
  const tasks = getData('tasks')?.tasks || [];
  const performance = getData('performance') || {};
  const announcements = getData('announcements')?.announcements || [];

  const renderTabContent = () => {
    const commonProps = { 
      user: user || null, 
      tasks: getData('tasks')?.tasks || [], 
      updateTask: updateTask || (() => {}), 
      loading: isLoading('tasks') || false,
      tabData: tabData,
      refreshData: refreshData,
      isLoading: isLoading
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
        return <EnhancedChat userRole="AI Developer Intern" />;
      case 'announcements':
        return <AnnouncementsTab {...commonProps} />;
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
                  <div className="mt-2">
                    <CollegeLogo 
                      college={user.college} 
                      size="sm" 
                      showName={true}
                    />
                  </div>
                )}
                {user?.cohortId && (
                  <p className="mt-1 text-sm text-gray-600">
                    <span className="inline-flex items-center">
                      <span className="mr-1">👥</span>
                      Cohort: {getCohortName(user.cohortName || user.cohortId)}
                    </span>
                  </p>
                )}
              </div>
              
              {/* Quick Stats and Actions */}
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className="text-lg font-semibold text-blue-600">
                    {isLoading('tasks') ? '...' : tasks.filter(t => t.status === 'done').length}
                  </div>
                  <div className="text-xs text-gray-500">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-orange-600">
                    {isLoading('tasks') ? '...' : tasks.filter(t => t.status === 'in_progress').length}
                  </div>
                  <div className="text-xs text-gray-500">In Progress</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-600">
                    {isLoading('tasks') ? '...' : tasks.length}
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
          <div className="flex justify-between items-center">
            <nav className="flex space-x-6 overflow-x-auto scrollbar-hide">
              {getOrderedTabs().map((tab) => (
                <button
                  key={tab.id}
                  data-tab-id={tab.id}
                  onMouseDown={(e) => handlePressStart(e, tab.id)}
                  onMouseUp={(e) => handlePressEnd(e, tab.id)}
                  onMouseLeave={handlePressLeave}
                  onMouseEnter={(e) => handleDragOver(e, tab.id)}
                  onMouseMove={(e) => handleDragOver(e, tab.id)}
                  onTouchStart={(e) => handlePressStart(e, tab.id)}
                  onTouchEnd={(e) => handlePressEnd(e, tab.id)}
                  onTouchMove={(e) => {
                    if (isDragging) {
                      e.preventDefault();
                      const touch = e.touches[0];
                      const element = document.elementFromPoint(touch.clientX, touch.clientY);
                      const tabElement = element?.closest('[data-tab-id]');
                      if (tabElement) {
                        const targetTabId = tabElement.getAttribute('data-tab-id');
                        handleDragOver(e, targetTabId);
                      }
                    }
                  }}
                  className={`whitespace-nowrap py-3 px-3 border-b-2 font-medium text-sm flex items-center space-x-2 transition-all duration-200 select-none ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                  } ${
                    draggedTab === tab.id ? 'opacity-50 scale-105 shadow-lg' : ''
                  } ${
                    isDragging ? 'cursor-grabbing' : 'cursor-pointer hover:cursor-grab'
                  } rounded-t-lg`}
                  style={{
                   userSelect: 'none',
                    WebkitUserSelect: 'none',
                    MozUserSelect: 'none',
                    msUserSelect: 'none',
                    WebkitTouchCallout: 'none',
                    touchAction: isDragging ? 'none' : 'auto'
                  }}
                 >
                  <span className="text-base">{tab.icon}</span>
                  <span className="hidden sm:inline">{tab.name}</span>
                </button>
              ))}
            </nav>
            
            {/* Instructions */}
            <div className="text-xs text-gray-500 hidden lg:block">
              Long press and drag to reorder tabs
            </div>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar with Simplified Profile Card */}
          <div className="lg:col-span-1 space-y-6">
            <ProfileCard user={user} showMilestones={false} compact={true} />
            
            {/* Essential Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => switchTab('tasks')}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md flex items-center space-x-2"
                >
                  <span>📝</span>
                  <span>View Tasks</span>
                </button>
                <button
                  onClick={() => switchTab('gitlab')}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md flex items-center space-x-2"
                >
                  <span>🦊</span>
                  <span>GitLab Activity</span>
                </button>
                <button
                  onClick={() => switchTab('attendance')}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md flex items-center space-x-2"
                >
                  <span>📍</span>
                  <span>Mark Attendance</span>
                </button>
                <button
                  onClick={() => switchTab('communication')}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md flex items-center space-x-2"
                >
                  <span>📹</span>
                  <span>Join Meeting</span>
                </button>
              </div>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="lg:col-span-3">
            {renderTabContent()}
          </div>
        </div>
      </div>

      {/* Global mouse/touch up handler for drag end */}
      {isDragging && (
        <div
          className="fixed inset-0 z-50"
          onMouseUp={handleDragEnd}
          onTouchEnd={handleDragEnd}
          style={{ pointerEvents: 'all' }}
        />
      )}
    </div>
  );
}