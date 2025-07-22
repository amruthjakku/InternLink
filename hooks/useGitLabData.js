'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../components/AuthProvider';
import { gitlabUserCache } from '../utils/gitlab-cache';

/**
 * Enhanced hook for GitLab data with intelligent caching and skeleton loading
 * Prevents user frustration by showing smooth loading states instead of blank screens
 */
export function useGitLabData(dataType, options = {}) {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fromCache, setFromCache] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [cacheStats, setCacheStats] = useState(null);
  const abortControllerRef = useRef(null);
  const skeletonTimeoutRef = useRef(null);
  const retryCountRef = useRef(0);

  const {
    params = {},
    autoRefresh = true,
    refreshInterval = 5 * 60 * 1000, // 5 minutes
    retryOnError = true,
    maxRetries = 3,
    retryDelay = 1000,
    enableSkeleton = true,
    skeletonDuration = 800, // Minimum skeleton duration for smooth UX
    skipCache = false,
    onSuccess,
    onError
  } = options;

  // API endpoints mapping
  const apiEndpoints = {
    analytics: '/api/gitlab/ai-developer-intern-analytics',
    commits: '/api/gitlab/commits',
    repositories: '/api/gitlab/repositories',
    mergeRequests: '/api/gitlab/merge-requests',
    activity: '/api/gitlab/activity',
    insights: '/api/gitlab/insights',
    connectionStatus: '/api/gitlab/connection-status',
    profile: '/api/gitlab/profile'
  };

  // Build API URL with parameters
  const buildApiUrl = useCallback((endpoint, params) => {
    const url = new URL(endpoint, window.location.origin);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        url.searchParams.append(key, value.toString());
      }
    });
    return url.toString();
  }, []);

  // Fetch data from API with skeleton loading
  const fetchFromAPI = useCallback(async (retryCount = 0, forceRefresh = false) => {
    if (!user?.id) {
      setLoading(false);
      setShowSkeleton(false);
      return null;
    }

    try {
      setError(null);
      
      // Show skeleton for better UX when no data exists
      if (enableSkeleton && !data && retryCount === 0) {
        setShowSkeleton(true);
        setLoading(true);
        
        // Ensure minimum skeleton duration for smooth experience
        skeletonTimeoutRef.current = setTimeout(() => {
          setShowSkeleton(false);
        }, skeletonDuration);
      } else if (!enableSkeleton || data) {
        setLoading(true);
      }

      // Cancel previous request if it exists
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      const endpoint = apiEndpoints[dataType];
      if (!endpoint) {
        throw new Error(`Unknown data type: ${dataType}`);
      }

      const url = buildApiUrl(endpoint, params);
      const response = await fetch(url, {
        signal: abortControllerRef.current.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('GitLab authentication required');
        } else if (response.status === 403) {
          throw new Error('GitLab access forbidden');
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded');
        } else {
          throw new Error(`API request failed: ${response.status}`);
        }
      }

      const result = await response.json();
      const requestTime = Date.now();
      
      // Add performance metrics
      const enhancedResult = {
        ...result,
        performance: {
          ...result.performance,
          requestTime: Date.now() - requestTime,
          dataSource: forceRefresh ? 'api_forced' : 'api',
          cacheStatus: 'fresh'
        }
      };

      // Cache the result if caching is enabled
      if (!skipCache && enhancedResult && !enhancedResult.error) {
        await cacheData(enhancedResult);
        console.log(`📦 Cached fresh ${dataType} data`);
      }

      // Clear skeleton timeout as we have data
      if (skeletonTimeoutRef.current) {
        clearTimeout(skeletonTimeoutRef.current);
        skeletonTimeoutRef.current = null;
      }

      // Reset retry count on success
      retryCountRef.current = 0;

      // Call success callback
      onSuccess?.(enhancedResult, false);

      return enhancedResult;
    } catch (err) {
      if (err.name === 'AbortError') {
        return null; // Request was cancelled
      }

      console.error(`Error fetching ${dataType}:`, err);

      // Retry logic
      if (retryOnError && retryCount < maxRetries) {
        retryCountRef.current = retryCount + 1;
        console.log(`🔄 Retrying ${dataType} fetch (attempt ${retryCount + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, retryCount)));
        return fetchFromAPI(retryCount + 1, forceRefresh);
      }

      // Call error callback
      onError?.(err);

      throw err;
    }
  }, [user?.id, dataType, params, skipCache, retryOnError, maxRetries, retryDelay, buildApiUrl]);

  // Cache data
  const cacheData = useCallback(async (newData) => {
    if (!user?.id || !newData) return;

    try {
      switch (dataType) {
        case 'analytics':
          await gitlabUserCache.cacheUserAnalytics(user.id, newData);
          break;
        case 'commits':
          await gitlabUserCache.cacheUserCommits(user.id, newData, params.days);
          break;
        case 'repositories':
          await gitlabUserCache.cacheUserRepositories(user.id, newData);
          break;
        case 'mergeRequests':
          await gitlabUserCache.cacheUserMergeRequests(user.id, newData, params.state);
          break;
        case 'activity':
          await gitlabUserCache.cacheUserActivity(user.id, newData);
          break;
        case 'insights':
          await gitlabUserCache.cacheUserInsights(user.id, newData);
          break;
        case 'connectionStatus':
          await gitlabUserCache.cacheConnectionStatus(user.id, newData);
          break;
        case 'profile':
          await gitlabUserCache.cacheUserProfile(user.id, newData);
          break;
        default:
          console.warn(`No cache method for data type: ${dataType}`);
      }
    } catch (err) {
      console.error(`Failed to cache ${dataType}:`, err);
    }
  }, [user?.id, dataType, params]);

  // Get cached data
  const getCachedData = useCallback(async () => {
    if (!user?.id || skipCache) return null;

    try {
      let cachedResult = null;

      switch (dataType) {
        case 'analytics':
          cachedResult = await gitlabUserCache.getCachedUserAnalytics(user.id);
          break;
        case 'commits':
          cachedResult = await gitlabUserCache.getCachedUserCommits(user.id, params.days);
          break;
        case 'repositories':
          cachedResult = await gitlabUserCache.getCachedUserRepositories(user.id);
          break;
        case 'mergeRequests':
          cachedResult = await gitlabUserCache.getCachedUserMergeRequests(user.id, params.state);
          break;
        case 'activity':
          cachedResult = await gitlabUserCache.getCachedUserActivity(user.id);
          break;
        case 'insights':
          cachedResult = await gitlabUserCache.getCachedUserInsights(user.id);
          break;
        case 'connectionStatus':
          cachedResult = await gitlabUserCache.getCachedConnectionStatus(user.id);
          break;
        case 'profile':
          cachedResult = await gitlabUserCache.getCachedUserProfile(user.id);
          break;
        default:
          return null;
      }

      return cachedResult;
    } catch (err) {
      console.error(`Failed to get cached ${dataType}:`, err);
      return null;
    }
  }, [user?.id, dataType, params, skipCache]);

  // Main data fetching function with intelligent caching and skeleton loading
  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!user?.id) {
      setLoading(false);
      setShowSkeleton(false);
      return;
    }

    try {
      setError(null);

      // Check cache first unless forced refresh
      if (!forceRefresh) {
        const cachedData = await getCachedData();
        if (cachedData) {
          console.log(`✅ Serving cached ${dataType} data (age: ${cachedData.age}ms)`);
          setData(cachedData.data);
          setFromCache(true);
          setLastUpdated(cachedData.cachedAt);
          setLoading(false);
          setShowSkeleton(false);

          // Clear skeleton timeout if data is from cache
          if (skeletonTimeoutRef.current) {
            clearTimeout(skeletonTimeoutRef.current);
            skeletonTimeoutRef.current = null;
          }

          // Call success callback for cached data
          onSuccess?.(cachedData.data, true);

          // If data is fresh enough, don't fetch from API
          const age = Date.now() - cachedData.cachedAt;
          const maxAge = 2 * 60 * 1000; // 2 minutes
          if (age < maxAge) {
            return;
          }
        }
      }

      // Fetch fresh data from API
      const freshData = await fetchFromAPI(0, forceRefresh);
      if (freshData && !freshData.error) {
        setData(freshData);
        setFromCache(false);
        setLastUpdated(Date.now());
        retryCountRef.current = 0; // Reset retry count on success
      } else if (freshData?.error && !data) {
        // Only set error if we don't have cached data to fall back on
        setError(freshData.error);
      }
    } catch (err) {
      console.error(`Error in fetchData for ${dataType}:`, err);
      setError(err.message);
      onError?.(err);
    } finally {
      setLoading(false);
      
      // Ensure skeleton is hidden after minimum duration
      if (skeletonTimeoutRef.current) {
        setTimeout(() => {
          setShowSkeleton(false);
        }, Math.max(0, skeletonDuration - (Date.now() - Date.now())));
      } else {
        setShowSkeleton(false);
      }
    }
  }, [user?.id, getCachedData, fetchFromAPI, dataType, skeletonDuration, onSuccess, onError, data]);

  // Refresh data (force fresh fetch)
  const refresh = useCallback(async () => {
    if (!user?.id) return;
    
    console.log(`🔄 Force refreshing ${dataType} data`);
    return fetchData(true); // Force refresh
  }, [user?.id, dataType, fetchData]);

  // Update cache stats
  const updateCacheStats = useCallback(() => {
    if (user?.id) {
      const stats = gitlabUserCache.getUserCacheStats(user.id);
      setCacheStats(stats);
    }
  }, [user?.id]);

  // Invalidate cache for this data type
  const invalidateCache = useCallback(async () => {
    if (!user?.id) return;

    try {
      await gitlabUserCache.invalidateUserDataType(user.id, dataType);
      console.log(`Cache invalidated for ${dataType}`);
    } catch (err) {
      console.error(`Failed to invalidate cache for ${dataType}:`, err);
    }
  }, [user?.id, dataType]);

  // Initial data fetch and cache stats update
  useEffect(() => {
    fetchData();
    updateCacheStats();

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (skeletonTimeoutRef.current) {
        clearTimeout(skeletonTimeoutRef.current);
      }
    };
  }, [fetchData, updateCacheStats]);

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefresh || !user?.id) return;

    const intervalId = setInterval(() => {
      // Only refresh if not currently loading
      if (!loading) {
        fetchData();
      }
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [autoRefresh, user?.id, loading, refreshInterval, fetchData]);

  // Update cache stats periodically
  useEffect(() => {
    const statsInterval = setInterval(updateCacheStats, 10000); // Every 10 seconds
    return () => clearInterval(statsInterval);
  }, [updateCacheStats]);

  return {
    data,
    loading,
    error,
    fromCache,
    lastUpdated,
    showSkeleton,
    cacheStats,
    refresh,
    invalidateCache,
    updateCacheStats,
    // Helper computed properties
    isStale: fromCache && lastUpdated && (Date.now() - lastUpdated) > 5 * 60 * 1000, // 5 minutes
    hasData: !!data,
    isEmpty: !loading && !data && !error,
    // Performance metrics
    performance: data?.performance || null
  };
}

/**
 * Specific hooks for different data types
 */
export function useGitLabAnalytics(options = {}) {
  return useGitLabData('analytics', {
    refreshInterval: 10 * 60 * 1000, // 10 minutes
    ...options
  });
}

export function useGitLabCommits(days = 30, options = {}) {
  return useGitLabData('commits', {
    params: { days },
    refreshInterval: 5 * 60 * 1000, // 5 minutes
    ...options
  });
}

export function useGitLabRepositories(options = {}) {
  return useGitLabData('repositories', {
    refreshInterval: 30 * 60 * 1000, // 30 minutes
    ...options
  });
}

export function useGitLabMergeRequests(state = 'opened', options = {}) {
  return useGitLabData('mergeRequests', {
    params: { state },
    refreshInterval: 3 * 60 * 1000, // 3 minutes
    ...options
  });
}

export function useGitLabActivity(options = {}) {
  return useGitLabData('activity', {
    refreshInterval: 2 * 60 * 1000, // 2 minutes
    ...options
  });
}

export function useGitLabInsights(options = {}) {
  return useGitLabData('insights', {
    refreshInterval: 15 * 60 * 1000, // 15 minutes
    ...options
  });
}

export function useGitLabConnectionStatus(options = {}) {
  return useGitLabData('connectionStatus', {
    refreshInterval: 60 * 1000, // 1 minute
    ...options
  });
}

export function useGitLabProfile(options = {}) {
  return useGitLabData('profile', {
    refreshInterval: 15 * 60 * 1000, // 15 minutes
    ...options
  });
}