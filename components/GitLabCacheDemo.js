'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { gitlabUserCache } from '../utils/gitlab-cache';
import { useGitLabAnalytics } from '../hooks/useGitLabData';
import { GitLabOverviewSkeleton } from './skeletons/GitLabSkeleton';

/**
 * Demonstration component showing GitLab caching improvements
 */
export function GitLabCacheDemo() {
  const { user } = useAuth();
  const [cacheStats, setCacheStats] = useState(null);
  const [overallStats, setOverallStats] = useState(null);
  const [demoMode, setDemoMode] = useState('cached'); // 'cached', 'fresh', 'skeleton'

  // Use the enhanced hook
  const {
    data: analytics,
    loading,
    error,
    fromCache,
    lastUpdated,
    showSkeleton,
    refresh,
    invalidateCache,
    cacheStats: hookCacheStats
  } = useGitLabAnalytics({
    skipCache: demoMode === 'fresh',
    enableSkeleton: demoMode === 'skeleton'
  });

  // Update cache stats periodically
  useEffect(() => {
    const updateStats = () => {
      if (user?.id) {
        const userStats = gitlabUserCache.getUserCacheStats(user.id);
        setCacheStats(userStats);
      }
      const globalStats = gitlabUserCache.getOverallStats();
      setOverallStats(globalStats);
    };

    updateStats();
    const interval = setInterval(updateStats, 2000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const handleInvalidateCache = async () => {
    if (user?.id) {
      await invalidateCache();
      setCacheStats(gitlabUserCache.getUserCacheStats(user.id));
    }
  };

  const handleClearAllCache = async () => {
    if (user?.id && confirm('Clear all cache for this user?')) {
      await gitlabUserCache.invalidateUserCache(user.id);
      setCacheStats(gitlabUserCache.getUserCacheStats(user.id));
      refresh();
    }
  };

  if (!user) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600 dark:text-gray-400">Please log in to see GitLab cache demo</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          GitLab Cache & Skeleton Loading Demo
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Experience smooth loading with intelligent caching
        </p>
      </div>

      {/* Demo Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Demo Controls</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <button
            onClick={() => setDemoMode('cached')}
            className={`p-3 rounded-lg border transition-colors ${
              demoMode === 'cached'
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
            }`}
          >
            <div className="text-center">
              <div className="text-2xl mb-1">📦</div>
              <div className="font-medium">Cached Mode</div>
              <div className="text-xs opacity-75">Uses cache when available</div>
            </div>
          </button>

          <button
            onClick={() => setDemoMode('fresh')}
            className={`p-3 rounded-lg border transition-colors ${
              demoMode === 'fresh'
                ? 'bg-green-500 text-white border-green-500'
                : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
            }`}
          >
            <div className="text-center">
              <div className="text-2xl mb-1">🔄</div>
              <div className="font-medium">Fresh Mode</div>
              <div className="text-xs opacity-75">Always fetches fresh data</div>
            </div>
          </button>

          <button
            onClick={() => setDemoMode('skeleton')}
            className={`p-3 rounded-lg border transition-colors ${
              demoMode === 'skeleton'
                ? 'bg-purple-500 text-white border-purple-500'
                : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
            }`}
          >
            <div className="text-center">
              <div className="text-2xl mb-1">💀</div>
              <div className="font-medium">Skeleton Mode</div>
              <div className="text-xs opacity-75">Shows skeleton loading</div>
            </div>
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={refresh}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg transition-colors"
          >
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </button>
          
          <button
            onClick={handleInvalidateCache}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Invalidate Analytics Cache
          </button>
          
          <button
            onClick={handleClearAllCache}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Clear All User Cache
          </button>
        </div>
      </div>

      {/* Cache Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Cache Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <span className="mr-2">👤</span>
            Your Cache Stats
          </h3>
          
          {cacheStats ? (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Hit Rate:</span>
                <span className="font-medium text-green-600">{cacheStats.hitRate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Cache Hits:</span>
                <span className="font-medium">{cacheStats.hits}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Cache Misses:</span>
                <span className="font-medium">{cacheStats.misses}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Cache Sets:</span>
                <span className="font-medium">{cacheStats.sets}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Errors:</span>
                <span className="font-medium text-red-600">{cacheStats.errors}</span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No cache stats available</p>
          )}
        </div>

        {/* System Cache Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <span className="mr-2">🌐</span>
            System Cache Stats
          </h3>
          
          {overallStats ? (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total Users:</span>
                <span className="font-medium">{overallStats.totalUsers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Average Hit Rate:</span>
                <span className="font-medium text-green-600">{overallStats.averageHitRate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total Hits:</span>
                <span className="font-medium">{overallStats.hits}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total Misses:</span>
                <span className="font-medium">{overallStats.misses}</span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No system stats available</p>
          )}
        </div>
      </div>

      {/* Data Status */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Current Data Status</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl mb-2">
              {loading ? '⏳' : fromCache ? '📦' : '🔄'}
            </div>
            <div className="font-medium">
              {loading ? 'Loading' : fromCache ? 'From Cache' : 'Fresh Data'}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {demoMode} mode
            </div>
          </div>

          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl mb-2">
              {error ? '❌' : analytics ? '✅' : '❓'}
            </div>
            <div className="font-medium">
              {error ? 'Error' : analytics ? 'Data Available' : 'No Data'}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {analytics?.summary?.totalCommits || 0} commits
            </div>
          </div>

          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl mb-2">⏰</div>
            <div className="font-medium">Last Updated</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : 'Never'}
            </div>
          </div>
        </div>
      </div>

      {/* Demo Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          GitLab Analytics Preview
        </h3>
        
        {showSkeleton ? (
          <GitLabOverviewSkeleton />
        ) : error ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">⚠️</div>
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        ) : analytics ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
              <h4 className="text-sm opacity-90">Total Commits</h4>
              <p className="text-2xl font-bold">{analytics.summary?.totalCommits || 0}</p>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
              <h4 className="text-sm opacity-90">Active Repos</h4>
              <p className="text-2xl font-bold">{analytics.summary?.activeRepositories || 0}</p>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
              <h4 className="text-sm opacity-90">Current Streak</h4>
              <p className="text-2xl font-bold">{analytics.summary?.currentStreak || 0}</p>
            </div>
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white">
              <h4 className="text-sm opacity-90">Total Projects</h4>
              <p className="text-2xl font-bold">{analytics.summary?.totalProjects || 0}</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">📊</div>
            <p className="text-gray-500 dark:text-gray-400">No analytics data available</p>
          </div>
        )}
      </div>

      {/* Performance Metrics */}
      {analytics?.performance && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <span className="mr-2">⚡</span>
            Performance Metrics
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                {analytics.performance.requestTime}ms
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Request Time</div>
            </div>
            
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {analytics.performance.dataSource}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Data Source</div>
            </div>
            
            {analytics.performance.activitiesProcessed && (
              <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                  {analytics.performance.activitiesProcessed}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Activities Processed</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Benefits Info */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg p-6 border border-green-200 dark:border-green-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
          <span className="mr-2">🚀</span>
          Performance Benefits
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">✨ User Experience</h4>
            <ul className="space-y-1 text-gray-600 dark:text-gray-300">
              <li>• Instant loading with skeleton placeholders</li>
              <li>• Smooth transitions between loading states</li>
              <li>• No frustrating blank screens</li>
              <li>• Cached data shown immediately</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">⚡ Performance</h4>
            <ul className="space-y-1 text-gray-600 dark:text-gray-300">
              <li>• 90%+ faster load times with cache</li>
              <li>• Reduced GitLab API calls</li>
              <li>• Intelligent cache invalidation</li>
              <li>• Background data refresh</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}