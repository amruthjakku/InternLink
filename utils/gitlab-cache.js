/**
 * Enhanced GitLab Cache Service
 * Provides user-specific caching for GitLab data with intelligent invalidation
 */

import { GitLabCache } from './GitLabCache.js';

class GitLabUserCacheService {
  constructor() {
    // Initialize cache with optimized settings for GitLab data
    this.cache = new GitLabCache({
      type: 'memory',
      ttl: 300, // 5 minutes default TTL
      maxSize: 2000, // Increased for user-specific data
      keyPrefix: 'gitlab:user:',
      enableCompression: true
    });

    // User-specific cache configurations
    this.cacheConfigs = {
      userProfile: { ttl: 900 }, // 15 minutes - user profile data
      commits: { ttl: 300 }, // 5 minutes - commit data
      analytics: { ttl: 600 }, // 10 minutes - analytics data
      repositories: { ttl: 1800 }, // 30 minutes - repository list
      mergeRequests: { ttl: 180 }, // 3 minutes - MR data (more dynamic)
      activity: { ttl: 120 }, // 2 minutes - recent activity
      insights: { ttl: 900 }, // 15 minutes - insights data
      connectionStatus: { ttl: 60 } // 1 minute - connection status
    };

    // Track cache performance per user
    this.userStats = new Map();
  }

  /**
   * Get cache key for specific user and data type
   */
  getUserCacheKey(userId, dataType, params = {}) {
    const paramString = Object.keys(params).length > 0 
      ? ':' + Object.entries(params)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([k, v]) => `${k}=${v}`)
          .join('&')
      : '';
    
    return `${userId}:${dataType}${paramString}`;
  }

  /**
   * Set cached data for a user
   */
  async setUserData(userId, dataType, data, customTtl = null) {
    try {
      const key = this.getUserCacheKey(userId, dataType);
      const config = this.cacheConfigs[dataType] || { ttl: 300 };
      const ttl = customTtl || config.ttl;

      // Add metadata to cached data
      const cacheData = {
        data,
        cachedAt: Date.now(),
        expiresAt: Date.now() + (ttl * 1000),
        dataType,
        userId
      };

      await this.cache.set(key, cacheData, ttl);
      
      // Update user stats
      this.updateUserStats(userId, 'set');
      
      return true;
    } catch (error) {
      console.error(`Failed to cache ${dataType} for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * Get cached data for a user
   */
  async getUserData(userId, dataType, params = {}) {
    try {
      const key = this.getUserCacheKey(userId, dataType, params);
      const cacheData = await this.cache.get(key);

      if (cacheData) {
        // Update user stats
        this.updateUserStats(userId, 'hit');
        
        // Check if data is still fresh (additional validation)
        if (Date.now() < cacheData.expiresAt) {
          return {
            data: cacheData.data,
            fromCache: true,
            cachedAt: cacheData.cachedAt,
            age: Date.now() - cacheData.cachedAt
          };
        } else {
          // Data expired, remove it
          await this.cache.delete(key);
          this.updateUserStats(userId, 'expired');
        }
      }

      this.updateUserStats(userId, 'miss');
      return null;
    } catch (error) {
      console.error(`Failed to get cached ${dataType} for user ${userId}:`, error);
      this.updateUserStats(userId, 'error');
      return null;
    }
  }

  /**
   * Cache user profile data
   */
  async cacheUserProfile(userId, profileData) {
    return await this.setUserData(userId, 'userProfile', profileData);
  }

  /**
   * Get cached user profile
   */
  async getCachedUserProfile(userId) {
    return await this.getUserData(userId, 'userProfile');
  }

  /**
   * Cache user commits with date range
   */
  async cacheUserCommits(userId, commits, days = 30) {
    const params = { days };
    const key = this.getUserCacheKey(userId, 'commits', params);
    const config = this.cacheConfigs.commits;
    
    const cacheData = {
      data: commits,
      cachedAt: Date.now(),
      expiresAt: Date.now() + (config.ttl * 1000),
      dataType: 'commits',
      userId,
      params
    };

    await this.cache.set(key, cacheData, config.ttl);
    this.updateUserStats(userId, 'set');
    return true;
  }

  /**
   * Get cached user commits
   */
  async getCachedUserCommits(userId, days = 30) {
    const params = { days };
    return await this.getUserData(userId, 'commits', params);
  }

  /**
   * Cache user analytics data
   */
  async cacheUserAnalytics(userId, analyticsData) {
    return await this.setUserData(userId, 'analytics', analyticsData);
  }

  /**
   * Get cached user analytics
   */
  async getCachedUserAnalytics(userId) {
    return await this.getUserData(userId, 'analytics');
  }

  /**
   * Cache user repositories
   */
  async cacheUserRepositories(userId, repositories) {
    return await this.setUserData(userId, 'repositories', repositories);
  }

  /**
   * Get cached user repositories
   */
  async getCachedUserRepositories(userId) {
    return await this.getUserData(userId, 'repositories');
  }

  /**
   * Cache user merge requests
   */
  async cacheUserMergeRequests(userId, mergeRequests, state = 'all') {
    const params = { state };
    const key = this.getUserCacheKey(userId, 'mergeRequests', params);
    const config = this.cacheConfigs.mergeRequests;
    
    const cacheData = {
      data: mergeRequests,
      cachedAt: Date.now(),
      expiresAt: Date.now() + (config.ttl * 1000),
      dataType: 'mergeRequests',
      userId,
      params
    };

    await this.cache.set(key, cacheData, config.ttl);
    this.updateUserStats(userId, 'set');
    return true;
  }

  /**
   * Get cached user merge requests
   */
  async getCachedUserMergeRequests(userId, state = 'all') {
    const params = { state };
    return await this.getUserData(userId, 'mergeRequests', params);
  }

  /**
   * Cache user activity data
   */
  async cacheUserActivity(userId, activityData) {
    return await this.setUserData(userId, 'activity', activityData);
  }

  /**
   * Get cached user activity
   */
  async getCachedUserActivity(userId) {
    return await this.getUserData(userId, 'activity');
  }

  /**
   * Cache user insights
   */
  async cacheUserInsights(userId, insightsData) {
    return await this.setUserData(userId, 'insights', insightsData);
  }

  /**
   * Get cached user insights
   */
  async getCachedUserInsights(userId) {
    return await this.getUserData(userId, 'insights');
  }

  /**
   * Cache connection status
   */
  async cacheConnectionStatus(userId, statusData) {
    return await this.setUserData(userId, 'connectionStatus', statusData);
  }

  /**
   * Get cached connection status
   */
  async getCachedConnectionStatus(userId) {
    return await this.getUserData(userId, 'connectionStatus');
  }

  /**
   * Invalidate all cache data for a specific user
   */
  async invalidateUserCache(userId) {
    try {
      const patterns = Object.keys(this.cacheConfigs);
      let invalidatedCount = 0;

      for (const dataType of patterns) {
        const key = this.getUserCacheKey(userId, dataType);
        const deleted = await this.cache.delete(key);
        if (deleted) invalidatedCount++;

        // Also check for parameterized versions
        const allKeys = await this.cache.getKeys();
        const userKeys = allKeys.filter(k => k.startsWith(`${userId}:${dataType}`));
        
        for (const userKey of userKeys) {
          await this.cache.delete(userKey);
          invalidatedCount++;
        }
      }

      console.log(`Invalidated ${invalidatedCount} cache entries for user ${userId}`);
      return invalidatedCount;
    } catch (error) {
      console.error(`Failed to invalidate cache for user ${userId}:`, error);
      return 0;
    }
  }

  /**
   * Invalidate specific data type for a user
   */
  async invalidateUserDataType(userId, dataType) {
    try {
      const key = this.getUserCacheKey(userId, dataType);
      await this.cache.delete(key);
      
      // Also check for parameterized versions
      const allKeys = await this.cache.getKeys();
      const userKeys = allKeys.filter(k => k.startsWith(`${userId}:${dataType}`));
      
      let invalidatedCount = 1;
      for (const userKey of userKeys) {
        await this.cache.delete(userKey);
        invalidatedCount++;
      }

      return invalidatedCount;
    } catch (error) {
      console.error(`Failed to invalidate ${dataType} cache for user ${userId}:`, error);
      return 0;
    }
  }

  /**
   * Update user-specific cache statistics
   */
  updateUserStats(userId, operation) {
    if (!this.userStats.has(userId)) {
      this.userStats.set(userId, {
        hits: 0,
        misses: 0,
        sets: 0,
        errors: 0,
        expired: 0
      });
    }

    const stats = this.userStats.get(userId);
    stats[operation] = (stats[operation] || 0) + 1;
    stats.lastActivity = Date.now();
  }

  /**
   * Get cache statistics for a specific user
   */
  getUserCacheStats(userId) {
    const userStats = this.userStats.get(userId) || {
      hits: 0,
      misses: 0,
      sets: 0,
      errors: 0,
      expired: 0
    };

    const total = userStats.hits + userStats.misses;
    const hitRate = total > 0 ? (userStats.hits / total * 100).toFixed(2) : '0.00';

    return {
      ...userStats,
      total,
      hitRate: `${hitRate}%`
    };
  }

  /**
   * Get overall cache statistics
   */
  getOverallStats() {
    const globalStats = this.cache.getStats();
    const userCount = this.userStats.size;
    
    return {
      ...globalStats,
      totalUsers: userCount,
      averageHitRate: globalStats.total > 0 
        ? (globalStats.hits / globalStats.total * 100).toFixed(2) + '%'
        : '0.00%'
    };
  }

  /**
   * Clean up expired user statistics
   */
  cleanupUserStats(maxAge = 24 * 60 * 60 * 1000) { // 24 hours
    const now = Date.now();
    const toDelete = [];

    for (const [userId, stats] of this.userStats.entries()) {
      if (stats.lastActivity && (now - stats.lastActivity) > maxAge) {
        toDelete.push(userId);
      }
    }

    toDelete.forEach(userId => this.userStats.delete(userId));
    
    if (toDelete.length > 0) {
      console.log(`Cleaned up cache stats for ${toDelete.length} inactive users`);
    }

    return toDelete.length;
  }

  /**
   * Clear all cache data (system-wide)
   */
  async clearAllCache() {
    try {
      await this.cache.clear();
      this.userStats.clear();
      console.log('All cache data cleared');
      return true;
    } catch (error) {
      console.error('Failed to clear all cache:', error);
      return false;
    }
  }

  /**
   * Preload common data for a user
   */
  async preloadUserData(userId, accessToken, gitlabApi) {
    try {
      console.log(`Preloading cache data for user ${userId}`);
      
      // This would be called after successful authentication
      // to populate the cache with essential data
      
      const preloadTasks = [];

      // Preload user profile if not cached
      const cachedProfile = await this.getCachedUserProfile(userId);
      if (!cachedProfile) {
        preloadTasks.push(
          gitlabApi.getCurrentUser(accessToken)
            .then(profile => this.cacheUserProfile(userId, profile))
            .catch(err => console.warn('Failed to preload user profile:', err))
        );
      }

      // Preload repositories if not cached
      const cachedRepos = await this.getCachedUserRepositories(userId);
      if (!cachedRepos) {
        preloadTasks.push(
          gitlabApi.getUserRepositories(accessToken)
            .then(repos => this.cacheUserRepositories(userId, repos))
            .catch(err => console.warn('Failed to preload repositories:', err))
        );
      }

      await Promise.allSettled(preloadTasks);
      console.log(`Completed preloading for user ${userId}`);
      
    } catch (error) {
      console.error(`Failed to preload data for user ${userId}:`, error);
    }
  }
}

// Create and export singleton instance
export const gitlabUserCache = new GitLabUserCacheService();

// Export the class for testing or multiple instances
export { GitLabUserCacheService };