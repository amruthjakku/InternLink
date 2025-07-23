'use client';

import React, { memo, useMemo, useCallback, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useFocusManager, useStableFocus } from '../../hooks/useFocusManager';
import { useAdminData } from '../../hooks/useAdminData';
import { DashboardSkeleton, StatsSkeleton, TableSkeleton, GridSkeleton } from '../ui/Skeleton';
import dashboardCache from '../../utils/cache';
import CacheMonitor from './CacheMonitor';

// Memoized tab content components to prevent unnecessary re-renders
const TabContent = memo(({ 
  tabName, 
  children, 
  loading = false, 
  error = null,
  fallback = null 
}) => {
  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Data</h3>
          <p className="text-gray-600 mb-4">{error.message || 'Something went wrong'}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return fallback || <DashboardSkeleton />;
  }

  return <div className="tab-content">{children}</div>;
});

TabContent.displayName = 'TabContent';

// Memoized data display components
const DataSection = memo(({ 
  title, 
  data, 
  loading, 
  error, 
  skeleton: SkeletonComponent = TableSkeleton,
  children 
}) => {
  if (loading) {
    return <SkeletonComponent />;
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          <div className="text-red-500 text-3xl mb-2">⚠️</div>
          <p className="text-gray-600">Failed to load {title}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="data-section">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      {children}
    </div>
  );
});

DataSection.displayName = 'DataSection';

// Main admin dashboard wrapper with caching and focus management
const AdminDashboardWrapper = ({ children }) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const stableFocus = useStableFocus();
  
  // Focus management to prevent unnecessary reloads
  const { isFocused } = useFocusManager({
    refreshOnFocus: false, // Disable automatic refresh on focus
    refreshThrottle: 60000, // 1 minute throttle
    trackFocus: true
  });

  // Admin data management with caching
  const {
    activeTab,
    globalLoading,
    globalError,
    switchTab,
    preloadTab,
    isTabLoaded,
    isTabLoading,
    getTabData,
    refreshCurrentTab,
    clearTabCache,
    getCacheStats
  } = useAdminData();

  // Memoized session check to prevent re-renders
  const isAuthorized = useMemo(() => {
    return status === 'authenticated' && session?.user?.role === 'admin';
  }, [status, session?.user?.role]);

  // Memoized cache stats for debugging
  const cacheStats = useMemo(() => {
    return getCacheStats();
  }, [getCacheStats]);

  // Preload commonly used tabs
  useEffect(() => {
    const tabsToPreload = ['users', 'colleges', 'tasks'];
    tabsToPreload.forEach(tab => {
      setTimeout(() => preloadTab(tab), 1000 + Math.random() * 2000);
    });
  }, [preloadTab]);

  // Handle authentication
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!isAuthorized) {
      router.push('/auth/signin');
      return;
    }
  }, [status, isAuthorized, router]);

  // Memoized tab navigation to prevent re-renders
  const handleTabSwitch = useCallback((newTab) => {
    switchTab(newTab);
  }, [switchTab]);

  // Memoized refresh handler
  const handleRefresh = useCallback(() => {
    refreshCurrentTab();
  }, [refreshCurrentTab]);

  // Show loading state during authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show unauthorized message
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
          <button 
            onClick={() => router.push('/')}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-wrapper min-h-screen bg-gray-50">
      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-4 right-4 z-50 bg-black text-white text-xs p-2 rounded opacity-75">
          <div>Focus: {isFocused ? '✅' : '❌'}</div>
          <div>Cache: {cacheStats.valid}/{cacheStats.total}</div>
          <div>Tab: {activeTab}</div>
          <div>Loaded: {isTabLoaded(activeTab) ? '✅' : '❌'}</div>
        </div>
      )}

      {/* Main content */}
      <div className="dashboard-content">
        {React.cloneElement(children, {
          // Pass down cached data and handlers
          activeTab,
          onTabSwitch: handleTabSwitch,
          onRefresh: handleRefresh,
          isTabLoading: isTabLoading(activeTab),
          globalLoading,
          globalError,
          getTabData,
          TabContent,
          DataSection,
          // Prevent prop drilling by providing context
          adminContext: {
            activeTab,
            switchTab: handleTabSwitch,
            refresh: handleRefresh,
            isLoading: isTabLoading(activeTab),
            isLoaded: isTabLoaded(activeTab),
            getData: getTabData,
            clearCache: clearTabCache,
            cacheStats
          }
        })}
      </div>

      {/* Cache Monitor for development */}
      <CacheMonitor />
    </div>
  );
};

// Higher-order component to wrap admin components with caching
export const withAdminCache = (WrappedComponent, options = {}) => {
  const {
    tabName,
    dataKeys = [],
    refreshOnFocus = false,
    skeleton: SkeletonComponent = DashboardSkeleton
  } = options;

  return memo((props) => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({});
    const [error, setError] = useState(null);

    // Load data with caching
    useEffect(() => {
      const loadData = async () => {
        try {
          setLoading(true);
          setError(null);

          const results = {};
          for (const dataKey of dataKeys) {
            const cacheKey = `admin:${tabName}:${dataKey}`;
            let cachedData = dashboardCache.get(cacheKey);
            
            if (!cachedData) {
              // Fetch data if not in cache
              const response = await fetch(`/api/admin/${tabName}/${dataKey}`);
              if (!response.ok) throw new Error(`Failed to fetch ${dataKey}`);
              cachedData = await response.json();
              dashboardCache.set(cacheKey, cachedData);
            }
            
            results[dataKey] = cachedData;
          }

          setData(results);
        } catch (err) {
          setError(err);
        } finally {
          setLoading(false);
        }
      };

      if (dataKeys.length > 0) {
        loadData();
      } else {
        setLoading(false);
      }
    }, [tabName, dataKeys.join(',')]);

    if (loading) {
      return <SkeletonComponent />;
    }

    if (error) {
      return (
        <div className="text-center py-12">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <p className="text-gray-600">Error loading data: {error.message}</p>
        </div>
      );
    }

    return <WrappedComponent {...props} data={data} />;
  });
};

export { TabContent, DataSection };
export default memo(AdminDashboardWrapper);