'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useCachedDataWithFocus } from './useFocusManager';
import dashboardCache, { CacheKeys, CacheTTL } from '../utils/cache';
import { 
  CACHE_TTL, 
  ADMIN_CACHE_KEYS, 
  TAB_CACHE_CONFIG, 
  CACHE_INVALIDATION,
  PERFORMANCE_CONFIG 
} from '../config/cacheConfig';

/**
 * Comprehensive hook for managing admin dashboard data with caching
 */
export const useAdminData = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [globalLoading, setGlobalLoading] = useState(false);
  const [globalError, setGlobalError] = useState(null);
  
  // Track which tabs have been loaded
  const loadedTabs = useRef(new Set());
  const fetchPromises = useRef(new Map());

  // Data fetchers for different admin sections
  const dataFetchers = {
    // Overview data
    overview: {
      stats: () => fetch('/api/admin/stats').then(res => res.json()),
      recentActivity: () => fetch('/api/admin/activity-logs?limit=10').then(res => res.json()),
      systemHealth: () => fetch('/api/admin/system-health').then(res => res.json()),
    },
    
    // User management
    users: {
      allUsers: () => fetch('/api/admin/users').then(res => res.json()),
      userStats: () => fetch('/api/admin/users/stats').then(res => res.json()),
      recentUsers: () => fetch('/api/admin/users?recent=true&limit=20').then(res => res.json()),
    },
    
    // College management
    colleges: {
      allColleges: () => fetch('/api/admin/colleges').then(res => res.json()),
      collegeStats: () => fetch('/api/admin/colleges/stats').then(res => res.json()),
      collegeUsers: () => fetch('/api/admin/colleges/users').then(res => res.json()),
    },
    
    // Cohort management
    cohorts: {
      allCohorts: () => fetch('/api/admin/cohorts').then(res => res.json()),
      cohortStats: () => fetch('/api/admin/cohorts/stats').then(res => res.json()),
      cohortAssignments: () => fetch('/api/admin/cohorts/assignments').then(res => res.json()),
    },
    
    // Task management
    tasks: {
      allTasks: () => fetch('/api/admin/tasks').then(res => res.json()),
      taskStats: () => fetch('/api/admin/tasks/stats').then(res => res.json()),
      taskProgress: () => fetch('/api/admin/task-progress').then(res => res.json()),
    },
    
    // Attendance management
    attendance: {
      attendanceStats: () => fetch('/api/admin/attendance-analytics').then(res => res.json()),
      recentAttendance: () => fetch('/api/admin/attendance?recent=true').then(res => res.json()),
      attendanceIssues: () => fetch('/api/admin/attendance/issues').then(res => res.json()),
    },
    
    // Analytics
    analytics: {
      performanceMetrics: () => fetch('/api/admin/analytics').then(res => res.json()),
      engagementStats: () => fetch('/api/admin/analytics/engagement').then(res => res.json()),
      trendData: () => fetch('/api/admin/analytics/trends').then(res => res.json()),
    },
    
    // System tools
    system: {
      systemLogs: () => fetch('/api/admin/system-logs').then(res => res.json()),
      databaseStats: () => fetch('/api/admin/database-stats').then(res => res.json()),
      cacheStats: () => Promise.resolve(dashboardCache.getStats()),
    },
    
    // Announcements
    announcements: {
      allAnnouncements: () => fetch('/api/announcements?limit=50').then(res => res.json()),
      announcementStats: () => fetch('/api/admin/announcements/stats').then(res => res.json()),
    }
  };

  // Use centralized cache configurations
  const cacheConfigs = TAB_CACHE_CONFIG;

  // Create cached data hooks for each tab
  const createTabDataHook = (tabName, dataKey) => {
    const cacheKey = ADMIN_CACHE_KEYS[dataKey.toUpperCase()] || `admin:${tabName}:${dataKey}`;
    const fetcher = dataFetchers[tabName]?.[dataKey];
    const config = cacheConfigs[tabName] || { 
      ttl: CACHE_TTL.MEDIUM, 
      refreshOnFocus: false,
      staleWhileRevalidate: true 
    };
    
    return useCachedDataWithFocus(
      cacheKey,
      fetcher,
      {
        ttl: config.ttl,
        refreshOnFocus: config.refreshOnFocus,
        staleWhileRevalidate: config.staleWhileRevalidate,
        enabled: !!fetcher,
        dependencies: [tabName, dataKey]
      }
    );
  };

  // Load data for a specific tab
  const loadTabData = useCallback(async (tabName, force = false) => {
    if (!dataFetchers[tabName] || fetchPromises.current.has(tabName)) {
      return;
    }

    const dataKeys = Object.keys(dataFetchers[tabName]);
    const cacheConfig = cacheConfigs[tabName] || { ttl: CacheTTL.MEDIUM };
    
    setGlobalLoading(true);
    setGlobalError(null);

    const loadPromise = Promise.allSettled(
      dataKeys.map(async (dataKey) => {
        const cacheKey = `admin:${tabName}:${dataKey}`;
        const fetcher = dataFetchers[tabName][dataKey];
        
        try {
          // Check cache first unless forced
          if (!force) {
            const cached = dashboardCache.get(cacheKey);
            if (cached) {
              return { dataKey, data: cached, fromCache: true };
            }
          }

          const data = await fetcher();
          dashboardCache.set(cacheKey, data, cacheConfig.ttl);
          return { dataKey, data, fromCache: false };
        } catch (error) {
          console.error(`Error loading ${tabName}.${dataKey}:`, error);
          throw error;
        }
      })
    );

    fetchPromises.current.set(tabName, loadPromise);

    try {
      await loadPromise;
      loadedTabs.current.add(tabName);
    } catch (error) {
      setGlobalError(error);
    } finally {
      setGlobalLoading(false);
      fetchPromises.current.delete(tabName);
    }
  }, []);

  // Switch to a new tab
  const switchTab = useCallback(async (newTab) => {
    setActiveTab(newTab);
    
    // Load data if not already loaded
    if (!loadedTabs.current.has(newTab)) {
      await loadTabData(newTab);
    }
  }, [loadTabData]);

  // Refresh current tab data
  const refreshCurrentTab = useCallback(() => {
    return loadTabData(activeTab, true);
  }, [activeTab, loadTabData]);

  // Preload tab data
  const preloadTab = useCallback((tabName) => {
    if (!loadedTabs.current.has(tabName)) {
      loadTabData(tabName);
    }
  }, [loadTabData]);

  // Get cached data for a specific tab and data key
  const getTabData = useCallback((tabName, dataKey) => {
    const cacheKey = `admin:${tabName}:${dataKey}`;
    return dashboardCache.get(cacheKey);
  }, []);

  // Check if tab data is loading
  const isTabLoading = useCallback((tabName) => {
    return fetchPromises.current.has(tabName);
  }, []);

  // Check if tab has been loaded
  const isTabLoaded = useCallback((tabName) => {
    return loadedTabs.current.has(tabName);
  }, []);

  // Clear cache for specific tab
  const clearTabCache = useCallback((tabName) => {
    if (dataFetchers[tabName]) {
      Object.keys(dataFetchers[tabName]).forEach(dataKey => {
        const cacheKey = `admin:${tabName}:${dataKey}`;
        dashboardCache.delete(cacheKey);
      });
      loadedTabs.current.delete(tabName);
    }
  }, []);

  // Clear all admin cache
  const clearAllCache = useCallback(() => {
    dashboardCache.invalidatePattern('admin:.*');
    loadedTabs.current.clear();
  }, []);

  // Invalidate specific data type across all tabs
  const invalidateDataType = useCallback((dataType) => {
    dashboardCache.invalidatePattern(`admin:.*:.*${dataType}.*`);
  }, []);

  // Smart cache invalidation based on data changes
  const invalidateRelatedCaches = useCallback((changeType) => {
    const keysToInvalidate = CACHE_INVALIDATION[changeType] || [];
    keysToInvalidate.forEach(key => {
      dashboardCache.delete(key);
    });
  }, []);

  // Initialize with overview tab
  useEffect(() => {
    if (!loadedTabs.current.has('overview')) {
      loadTabData('overview');
    }
  }, [loadTabData]);

  return {
    // Current state
    activeTab,
    globalLoading,
    globalError,
    
    // Tab management
    switchTab,
    preloadTab,
    isTabLoaded,
    isTabLoading,
    
    // Data access
    getTabData,
    createTabDataHook,
    
    // Actions
    refreshCurrentTab,
    loadTabData,
    
    // Cache management
    clearTabCache,
    clearAllCache,
    invalidateDataType,
    invalidateRelatedCaches,
    
    // Available tabs and data
    availableTabs: Object.keys(dataFetchers),
    availableData: (tabName) => Object.keys(dataFetchers[tabName] || {}),
    
    // Cache stats
    getCacheStats: () => dashboardCache.getStats(),
  };
};

/**
 * Hook for specific admin data with automatic caching
 */
export const useAdminTabData = (tabName, dataKey, options = {}) => {
  const cacheKey = `admin:${tabName}:${dataKey}`;
  const fetcher = useCallback(async () => {
    const response = await fetch(options.url || `/api/admin/${tabName}/${dataKey}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${tabName}/${dataKey}`);
    }
    return response.json();
  }, [tabName, dataKey, options.url]);

  return useCachedDataWithFocus(cacheKey, fetcher, {
    ttl: options.ttl || CacheTTL.MEDIUM,
    refreshOnFocus: options.refreshOnFocus || false,
    enabled: options.enabled !== false,
    dependencies: options.dependencies || []
  });
};

/**
 * Hook for admin statistics with real-time updates
 */
export const useAdminStats = () => {
  return useCachedDataWithFocus(
    'admin:stats:overview',
    () => fetch('/api/admin/stats').then(res => res.json()),
    {
      ttl: CacheTTL.SHORT,
      refreshOnFocus: true,
      staleWhileRevalidate: true
    }
  );
};

export default useAdminData;