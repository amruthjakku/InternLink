'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import dashboardCache from '../utils/cache';

/**
 * Hook to manage window focus events and prevent unnecessary data reloading
 * when the user switches between tabs or windows
 */
export const useFocusManager = (options = {}) => {
  const {
    // Minimum time between focus-triggered refreshes (in milliseconds)
    refreshThrottle = 30000, // 30 seconds
    // Whether to refresh data on focus
    refreshOnFocus = false,
    // Callback to execute on focus
    onFocus = null,
    // Callback to execute on blur
    onBlur = null,
    // Whether to track focus state
    trackFocus = true
  } = options;

  const [isFocused, setIsFocused] = useState(true);
  const [lastFocusTime, setLastFocusTime] = useState(Date.now());
  const lastRefreshTime = useRef(0);
  const focusTimeoutRef = useRef(null);

  // Handle window focus
  const handleFocus = useCallback(() => {
    if (!trackFocus) return;

    const now = Date.now();
    setIsFocused(true);
    setLastFocusTime(now);

    // Clear any pending blur timeout
    if (focusTimeoutRef.current) {
      clearTimeout(focusTimeoutRef.current);
      focusTimeoutRef.current = null;
    }

    // Execute custom focus callback
    if (onFocus) {
      onFocus();
    }

    // Throttled refresh on focus
    if (refreshOnFocus && (now - lastRefreshTime.current) > refreshThrottle) {
      lastRefreshTime.current = now;
      
      // Trigger a custom event that components can listen to
      window.dispatchEvent(new CustomEvent('dashboard:refresh', {
        detail: { reason: 'focus', timestamp: now }
      }));
    }
  }, [trackFocus, onFocus, refreshOnFocus, refreshThrottle]);

  // Handle window blur
  const handleBlur = useCallback(() => {
    if (!trackFocus) return;

    // Delay setting blur state to avoid flickering
    focusTimeoutRef.current = setTimeout(() => {
      setIsFocused(false);
      
      // Execute custom blur callback
      if (onBlur) {
        onBlur();
      }
    }, 100);
  }, [trackFocus, onBlur]);

  // Handle visibility change (for mobile/tab switching)
  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      handleBlur();
    } else {
      handleFocus();
    }
  }, [handleFocus, handleBlur]);

  useEffect(() => {
    if (!trackFocus) return;

    // Add event listeners
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Set initial focus state
    setIsFocused(!document.hidden);

    return () => {
      // Cleanup
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current);
      }
    };
  }, [trackFocus, handleFocus, handleBlur, handleVisibilityChange]);

  return {
    isFocused,
    lastFocusTime,
    isRecentlyFocused: (threshold = 5000) => {
      return Date.now() - lastFocusTime < threshold;
    }
  };
};

/**
 * Hook to manage data fetching with smart caching and focus awareness
 */
export const useCachedDataWithFocus = (
  cacheKey, 
  fetcher, 
  options = {}
) => {
  const {
    ttl = 300000, // 5 minutes default
    refreshOnFocus = false,
    staleWhileRevalidate = true,
    dependencies = [],
    enabled = true
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);
  const [isStale, setIsStale] = useState(false);

  const fetchInProgress = useRef(false);
  const mountedRef = useRef(true);

  // Focus manager
  const { isFocused } = useFocusManager({
    refreshOnFocus: false, // We'll handle this manually
    trackFocus: true
  });

  // Fetch data function
  const fetchData = useCallback(async (force = false, background = false) => {
    if (!enabled || fetchInProgress.current) return;

    try {
      // Check cache first unless forced
      if (!force) {
        const cached = dashboardCache.get(cacheKey);
        if (cached) {
          if (mountedRef.current) {
            setData(cached);
            setIsStale(false);
            setLastFetch(Date.now());
          }
          return cached;
        }
      }

      fetchInProgress.current = true;
      
      if (!background && mountedRef.current) {
        setLoading(true);
        setError(null);
      }

      const result = await fetcher();
      
      if (mountedRef.current) {
        // Cache the result
        dashboardCache.set(cacheKey, result, ttl);
        
        setData(result);
        setError(null);
        setIsStale(false);
        setLastFetch(Date.now());
      }

      return result;
    } catch (err) {
      if (mountedRef.current) {
        setError(err);
        console.error(`Error fetching data for ${cacheKey}:`, err);
      }
      throw err;
    } finally {
      fetchInProgress.current = false;
      if (!background && mountedRef.current) {
        setLoading(false);
      }
    }
  }, [cacheKey, fetcher, ttl, enabled]);

  // Background refresh for stale-while-revalidate
  const backgroundRefresh = useCallback(async () => {
    if (!staleWhileRevalidate || !data) return;
    
    try {
      await fetchData(true, true);
    } catch (error) {
      // Silent fail for background refresh
      console.warn('Background refresh failed:', error);
    }
  }, [fetchData, staleWhileRevalidate, data]);

  // Check if data is stale
  const checkStale = useCallback(() => {
    if (!lastFetch) return false;
    return Date.now() - lastFetch > ttl;
  }, [lastFetch, ttl]);

  // Handle focus refresh
  useEffect(() => {
    if (!refreshOnFocus || !isFocused || !data) return;

    const handleFocusRefresh = () => {
      if (checkStale()) {
        setIsStale(true);
        backgroundRefresh();
      }
    };

    // Small delay to avoid immediate refresh on focus
    const timeoutId = setTimeout(handleFocusRefresh, 1000);
    return () => clearTimeout(timeoutId);
  }, [isFocused, refreshOnFocus, data, checkStale, backgroundRefresh]);

  // Initial data fetch
  useEffect(() => {
    if (enabled) {
      fetchData();
    }
  }, [fetchData, enabled, ...dependencies]);

  // Cleanup
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Listen for manual refresh events
  useEffect(() => {
    const handleRefresh = (event) => {
      if (event.detail?.reason === 'focus' && refreshOnFocus) {
        backgroundRefresh();
      }
    };

    window.addEventListener('dashboard:refresh', handleRefresh);
    return () => window.removeEventListener('dashboard:refresh', handleRefresh);
  }, [refreshOnFocus, backgroundRefresh]);

  return {
    data,
    loading,
    error,
    isStale,
    lastFetch,
    isFocused,
    refetch: () => fetchData(true),
    refresh: backgroundRefresh
  };
};

/**
 * Hook to prevent component re-renders on focus changes
 */
export const useStableFocus = () => {
  const stableRef = useRef(true);
  
  useEffect(() => {
    const handleFocus = () => {
      // Don't update the ref, keep it stable
    };
    
    const handleBlur = () => {
      // Don't update the ref, keep it stable
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  return stableRef.current;
};

export default useFocusManager;