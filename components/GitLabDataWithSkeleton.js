'use client';

import React from 'react';
import { useGitLabAnalytics, useGitLabRepositories, useGitLabCommits } from '../hooks/useGitLabData';
import { 
  GitLabOverviewSkeleton, 
  GitLabRepositoriesSkeleton, 
  GitLabCommitsSkeleton,
  GitLabAnalyticsSkeleton 
} from './skeletons/GitLabSkeleton';

/**
 * GitLab Analytics Component with intelligent caching and skeleton loading
 * Shows smooth loading states instead of blank screens
 */
export function GitLabAnalyticsWithSkeleton({ className = "" }) {
  const {
    data: analytics,
    loading,
    error,
    fromCache,
    showSkeleton,
    lastUpdated,
    refresh,
    cacheStats,
    performance
  } = useGitLabAnalytics({
    enableSkeleton: true,
    skeletonDuration: 1000,
    onSuccess: (data, cached) => {
      console.log(`📊 Analytics loaded ${cached ? 'from cache' : 'fresh'}:`, data?.summary);
    },
    onError: (err) => {
      console.error('Analytics error:', err);
    }
  });

  // Show skeleton when loading and no data
  if (showSkeleton) {
    return (
      <div className={`${className}`}>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Loading analytics...</span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-500">
            Preparing your data
          </div>
        </div>
        <GitLabAnalyticsSkeleton />
      </div>
    );
  }

  // Show error state
  if (error && !analytics) {
    return (
      <div className={`${className} text-center py-8`}>
        <div className="text-4xl mb-4">⚠️</div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Failed to load analytics
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
        <button
          onClick={refresh}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Show analytics data
  return (
    <div className={`${className}`}>
      {/* Status Bar */}
      <div className="mb-4 flex items-center justify-between text-sm">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${fromCache ? 'bg-green-500' : 'bg-blue-500'}`}></div>
            <span className="text-gray-600 dark:text-gray-400">
              {fromCache ? 'From cache' : 'Fresh data'}
            </span>
          </div>
          {lastUpdated && (
            <span className="text-gray-500 dark:text-gray-500">
              Updated {new Date(lastUpdated).toLocaleTimeString()}
            </span>
          )}
          {performance && (
            <span className="text-gray-500 dark:text-gray-500">
              {performance.requestTime}ms
            </span>
          )}
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="text-blue-500 hover:text-blue-600 disabled:text-blue-300 transition-colors"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Analytics Content */}
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
            <h3 className="text-sm opacity-90">Total Commits</h3>
            <p className="text-2xl font-bold">{analytics?.summary?.totalCommits || 0}</p>
            <div className="text-xs opacity-75 mt-1">
              {analytics?.summary?.commitsThisWeek || 0} this week
            </div>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
            <h3 className="text-sm opacity-90">Active Repos</h3>
            <p className="text-2xl font-bold">{analytics?.summary?.activeRepositories || 0}</p>
            <div className="text-xs opacity-75 mt-1">
              {analytics?.summary?.totalProjects || 0} total
            </div>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
            <h3 className="text-sm opacity-90">Current Streak</h3>
            <p className="text-2xl font-bold">{analytics?.summary?.currentStreak || 0}</p>
            <div className="text-xs opacity-75 mt-1">
              days
            </div>
          </div>
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
            <h3 className="text-sm opacity-90">Lines Changed</h3>
            <p className="text-2xl font-bold">
              {((analytics?.summary?.totalAdditions || 0) + (analytics?.summary?.totalDeletions || 0)).toLocaleString()}
            </p>
            <div className="text-xs opacity-75 mt-1">
              +{analytics?.summary?.totalAdditions || 0} -{analytics?.summary?.totalDeletions || 0}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        {analytics?.recentActivity?.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Recent Activity
            </h3>
            <div className="space-y-3">
              {analytics.recentActivity.slice(0, 5).map((activity, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 dark:text-white">
                      {activity.action} in <span className="font-medium">{activity.projectName}</span>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(activity.createdAt).toRelativeString?.() || new Date(activity.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cache Stats for Demo */}
        {cacheStats && (
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Cache Performance
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Hit Rate:</span>
                <span className="ml-2 font-medium text-green-600">{cacheStats.hitRate}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Cache Hits:</span>
                <span className="ml-2 font-medium">{cacheStats.hits}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Cache Misses:</span>
                <span className="ml-2 font-medium">{cacheStats.misses}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Errors:</span>
                <span className="ml-2 font-medium text-red-600">{cacheStats.errors}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * GitLab Repositories Component with skeleton loading
 */
export function GitLabRepositoriesWithSkeleton({ className = "" }) {
  const {
    data: repositories,
    loading,
    error,
    showSkeleton,
    refresh,
    fromCache
  } = useGitLabRepositories({
    enableSkeleton: true,
    skeletonDuration: 800
  });

  if (showSkeleton) {
    return (
      <div className={`${className}`}>
        <div className="mb-4 flex items-center space-x-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">Loading repositories...</span>
        </div>
        <GitLabRepositoriesSkeleton />
      </div>
    );
  }

  if (error && !repositories) {
    return (
      <div className={`${className} text-center py-8`}>
        <div className="text-4xl mb-4">📁</div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No repositories found
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
        <button
          onClick={refresh}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Repositories ({repositories?.length || 0})
        </h2>
        <div className="flex items-center space-x-2 text-sm">
          <div className={`w-2 h-2 rounded-full ${fromCache ? 'bg-green-500' : 'bg-blue-500'}`}></div>
          <span className="text-gray-600 dark:text-gray-400">
            {fromCache ? 'Cached' : 'Fresh'}
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {repositories?.map((repo, index) => (
          <div 
            key={repo.id || index}
            className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
          >
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
              {repo.name}
            </h3>
            {repo.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                {repo.description}
              </p>
            )}
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>{repo.visibility}</span>
              <span>{repo.defaultBranch || 'main'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * GitLab Commits Component with skeleton loading
 */
export function GitLabCommitsWithSkeleton({ className = "", days = 30 }) {
  const {
    data: commits,
    loading,
    error,
    showSkeleton,
    refresh,
    fromCache
  } = useGitLabCommits(days, {
    enableSkeleton: true,
    skeletonDuration: 600
  });

  if (showSkeleton) {
    return (
      <div className={`${className}`}>
        <div className="mb-4 flex items-center space-x-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">Loading commits...</span>
        </div>
        <GitLabCommitsSkeleton />
      </div>
    );
  }

  if (error && !commits) {
    return (
      <div className={`${className} text-center py-8`}>
        <div className="text-4xl mb-4">💻</div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No commits found
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
        <button
          onClick={refresh}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Recent Commits ({commits?.length || 0})
        </h2>
        <div className="flex items-center space-x-2 text-sm">
          <div className={`w-2 h-2 rounded-full ${fromCache ? 'bg-green-500' : 'bg-blue-500'}`}></div>
          <span className="text-gray-600 dark:text-gray-400">
            {fromCache ? 'Cached' : 'Fresh'}
          </span>
        </div>
      </div>
      
      <div className="space-y-3">
        {commits?.slice(0, 10).map((commit, index) => (
          <div 
            key={commit.id || index}
            className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  {commit.title || commit.message}
                </p>
                <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                  <span>{commit.author?.name || 'Unknown'}</span>
                  <span>{commit.projectName}</span>
                  <span>{new Date(commit.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}