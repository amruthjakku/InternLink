import { useState, useEffect, useCallback, useRef } from 'react';
import dashboardCache, { CacheKeys, CacheTTL } from '../utils/cache';

// Hook for managing tab-specific data loading with caching
export const useTabData = (tabId, dataFetchers = {}, options = {}) => {
  const {
    autoLoad = true,
    refreshOnTabSwitch = false,
    cacheTimeout = CacheTTL.MEDIUM,
    dependencies = []
  } = options;

  const [activeTab, setActiveTab] = useState(tabId);
  const [tabData, setTabData] = useState({});
  const [loading, setLoading] = useState({});
  const [errors, setErrors] = useState({});
  const [lastFetch, setLastFetch] = useState({});
  
  const loadedTabs = useRef(new Set());
  const fetchPromises = useRef(new Map());

  // Generate cache key for tab data
  const getCacheKey = useCallback((tab, dataKey) => {
    return `tab:${tab}:${dataKey}`;
  }, []);

  // Load data for a specific tab and data key
  const loadTabData = useCallback(async (tab, dataKey, force = false) => {
    const cacheKey = getCacheKey(tab, dataKey);
    const promiseKey = `${tab}:${dataKey}`;

    // Prevent duplicate requests
    if (fetchPromises.current.has(promiseKey)) {
      return fetchPromises.current.get(promiseKey);
    }

    const fetcher = dataFetchers[dataKey];
    if (!fetcher) {
      console.warn(`No fetcher defined for data key: ${dataKey}`);
      return null;
    }

    // Check cache first unless forced
    if (!force) {
      const cached = dashboardCache.get(cacheKey);
      if (cached) {
        setTabData(prev => ({
          ...prev,
          [tab]: {
            ...prev[tab],
            [dataKey]: cached
          }
        }));
        return cached;
      }
    }

    // Set loading state
    setLoading(prev => ({
      ...prev,
      [tab]: {
        ...prev[tab],
        [dataKey]: true
      }
    }));

    setErrors(prev => ({
      ...prev,
      [tab]: {
        ...prev[tab],
        [dataKey]: null
      }
    }));

    const promise = (async () => {
      try {
        const result = await fetcher();
        
        // Cache the result
        dashboardCache.set(cacheKey, result, cacheTimeout);
        
        // Update state
        setTabData(prev => ({
          ...prev,
          [tab]: {
            ...prev[tab],
            [dataKey]: result
          }
        }));

        setLastFetch(prev => ({
          ...prev,
          [tab]: {
            ...prev[tab],
            [dataKey]: Date.now()
          }
        }));

        return result;
      } catch (error) {
        console.error(`Error loading ${dataKey} for tab ${tab}:`, error);
        setErrors(prev => ({
          ...prev,
          [tab]: {
            ...prev[tab],
            [dataKey]: error
          }
        }));
        throw error;
      } finally {
        setLoading(prev => ({
          ...prev,
          [tab]: {
            ...prev[tab],
            [dataKey]: false
          }
        }));
        fetchPromises.current.delete(promiseKey);
      }
    })();

    fetchPromises.current.set(promiseKey, promise);
    return promise;
  }, [dataFetchers, getCacheKey, cacheTimeout]);

  // Load all data for a tab
  const loadAllTabData = useCallback(async (tab, force = false) => {
    const dataKeys = Object.keys(dataFetchers);
    const promises = dataKeys.map(dataKey => 
      loadTabData(tab, dataKey, force).catch(error => {
        console.error(`Failed to load ${dataKey}:`, error);
        return null;
      })
    );

    try {
      await Promise.allSettled(promises);
      loadedTabs.current.add(tab);
    } catch (error) {
      console.error(`Error loading data for tab ${tab}:`, error);
    }
  }, [dataFetchers, loadTabData]);

  // Switch to a new tab
  const switchTab = useCallback(async (newTab) => {
    setActiveTab(newTab);

    // Load data if not already loaded or if refresh is required
    const shouldLoad = autoLoad && (
      !loadedTabs.current.has(newTab) || 
      refreshOnTabSwitch
    );

    if (shouldLoad) {
      await loadAllTabData(newTab, refreshOnTabSwitch);
    }
  }, [autoLoad, refreshOnTabSwitch, loadAllTabData]);

  // Refresh data for current tab
  const refreshCurrentTab = useCallback(() => {
    return loadAllTabData(activeTab, true);
  }, [activeTab, loadAllTabData]);

  // Refresh specific data key for current tab
  const refreshTabData = useCallback((dataKey) => {
    return loadTabData(activeTab, dataKey, true);
  }, [activeTab, loadTabData]);

  // Get data for current tab
  const getCurrentTabData = useCallback((dataKey) => {
    return tabData[activeTab]?.[dataKey] || null;
  }, [activeTab, tabData]);

  // Check if data is loading for current tab
  const isLoading = useCallback((dataKey = null) => {
    if (dataKey) {
      return loading[activeTab]?.[dataKey] || false;
    }
    return Object.values(loading[activeTab] || {}).some(Boolean);
  }, [activeTab, loading]);

  // Get error for current tab
  const getError = useCallback((dataKey = null) => {
    if (dataKey) {
      return errors[activeTab]?.[dataKey] || null;
    }
    return Object.values(errors[activeTab] || {}).find(Boolean) || null;
  }, [activeTab, errors]);

  // Check if tab has been loaded
  const isTabLoaded = useCallback((tab = activeTab) => {
    return loadedTabs.current.has(tab);
  }, [activeTab]);

  // Preload data for a tab
  const preloadTab = useCallback((tab) => {
    if (!loadedTabs.current.has(tab)) {
      return loadAllTabData(tab, false);
    }
  }, [loadAllTabData]);

  // Clear cache for specific tab
  const clearTabCache = useCallback((tab = activeTab) => {
    Object.keys(dataFetchers).forEach(dataKey => {
      const cacheKey = getCacheKey(tab, dataKey);
      dashboardCache.delete(cacheKey);
    });
    
    // Clear loaded flag
    loadedTabs.current.delete(tab);
    
    // Clear state
    setTabData(prev => ({
      ...prev,
      [tab]: {}
    }));
  }, [activeTab, dataFetchers, getCacheKey]);

  // Initialize data loading
  useEffect(() => {
    if (autoLoad && !loadedTabs.current.has(activeTab)) {
      loadAllTabData(activeTab, false);
    }
  }, [activeTab, autoLoad, loadAllTabData, ...dependencies]);

  return {
    activeTab,
    switchTab,
    tabData: tabData[activeTab] || {},
    loading: loading[activeTab] || {},
    errors: errors[activeTab] || {},
    lastFetch: lastFetch[activeTab] || {},
    
    // Data access helpers
    getData: getCurrentTabData,
    isLoading,
    getError,
    isTabLoaded,
    
    // Actions
    refresh: refreshCurrentTab,
    refreshData: refreshTabData,
    preloadTab,
    clearCache: clearTabCache,
    
    // Load specific data
    loadData: (dataKey, force = false) => loadTabData(activeTab, dataKey, force),
  };
};

// Hook for managing dashboard-wide data with smart caching
export const useDashboardData = (userId, userRole) => {
  const [globalData, setGlobalData] = useState({});
  const [globalLoading, setGlobalLoading] = useState({});
  const [globalErrors, setGlobalErrors] = useState({});

  // Common data fetchers based on user role
  const getDataFetchers = useCallback(() => {
    const common = {
      profile: () => fetch('/api/user/profile').then(res => res.json()),
      preferences: () => fetch('/api/user/preferences').then(res => res.json()),
    };

    switch (userRole) {
      case 'AI Developer Intern':
        return {
          ...common,
          tasks: () => fetch('/api/tasks').then(res => res.json()),
          performance: () => fetch('/api/user/performance').then(res => res.json()),
          attendance: () => fetch('/api/attendance/user').then(res => res.json()),
          announcements: () => fetch('/api/announcements').then(res => res.json()),
          chatRooms: () => fetch('/api/chat-rooms').then(res => res.json()),
          leaderboard: () => fetch('/api/leaderboard').then(res => res.json()),
          gitlab: () => fetch('/api/gitlab/user-data').then(res => res.json()),
        };

      case 'POC':
        return {
          ...common,
          collegeOverview: () => fetch('/api/poc/college-overview').then(res => res.json()),
          announcements: () => fetch('/api/poc/announcements').then(res => res.json()),
          chatRooms: () => fetch('/api/chat-rooms').then(res => res.json()),
          users: () => fetch('/api/poc/users').then(res => res.json()),
          attendance: () => fetch('/api/poc/attendance').then(res => res.json()),
        };

      case 'admin':
        return {
          ...common,
          users: () => fetch('/api/admin/users').then(res => res.json()),
          colleges: () => fetch('/api/colleges').then(res => res.json()),
          announcements: () => fetch('/api/announcements?limit=100').then(res => res.json()),
          systemStats: () => fetch('/api/admin/system-stats').then(res => res.json()),
          attendance: () => fetch('/api/admin/attendance').then(res => res.json()),
        };

      default:
        return common;
    }
  }, [userRole]);

  // Load global data that's needed across tabs
  const loadGlobalData = useCallback(async (dataKeys = [], force = false) => {
    const fetchers = getDataFetchers();
    
    for (const dataKey of dataKeys) {
      const cacheKey = CacheKeys.USER_PROFILE(userId); // Use appropriate cache key
      
      if (!force && dashboardCache.has(cacheKey)) {
        const cached = dashboardCache.get(cacheKey);
        setGlobalData(prev => ({ ...prev, [dataKey]: cached }));
        continue;
      }

      const fetcher = fetchers[dataKey];
      if (!fetcher) continue;

      setGlobalLoading(prev => ({ ...prev, [dataKey]: true }));
      
      try {
        const result = await fetcher();
        dashboardCache.set(cacheKey, result, CacheTTL.LONG);
        setGlobalData(prev => ({ ...prev, [dataKey]: result }));
        setGlobalErrors(prev => ({ ...prev, [dataKey]: null }));
      } catch (error) {
        console.error(`Error loading global ${dataKey}:`, error);
        setGlobalErrors(prev => ({ ...prev, [dataKey]: error }));
      } finally {
        setGlobalLoading(prev => ({ ...prev, [dataKey]: false }));
      }
    }
  }, [userId, getDataFetchers]);

  return {
    globalData,
    globalLoading,
    globalErrors,
    loadGlobalData,
    dataFetchers: getDataFetchers(),
  };
};

export default useTabData;