// Cache utility for dashboard data management
class DashboardCache {
  constructor() {
    this.cache = new Map();
    this.timestamps = new Map();
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes default TTL
    this.subscribers = new Map(); // For cache invalidation notifications
  }

  // Set cache with TTL
  set(key, data, ttl = this.defaultTTL) {
    this.cache.set(key, data);
    this.timestamps.set(key, Date.now() + ttl);
    this.notifySubscribers(key, 'set', data);
  }

  // Get from cache
  get(key) {
    const timestamp = this.timestamps.get(key);
    if (!timestamp || Date.now() > timestamp) {
      this.delete(key);
      return null;
    }
    return this.cache.get(key);
  }

  // Check if key exists and is valid
  has(key) {
    const timestamp = this.timestamps.get(key);
    if (!timestamp || Date.now() > timestamp) {
      this.delete(key);
      return false;
    }
    return this.cache.has(key);
  }

  // Delete from cache
  delete(key) {
    this.cache.delete(key);
    this.timestamps.delete(key);
    this.notifySubscribers(key, 'delete');
  }

  // Clear all cache
  clear() {
    this.cache.clear();
    this.timestamps.clear();
    this.notifySubscribers('*', 'clear');
  }

  // Subscribe to cache changes
  subscribe(key, callback) {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key).add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(key);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.subscribers.delete(key);
        }
      }
    };
  }

  // Notify subscribers of cache changes
  notifySubscribers(key, action, data = null) {
    const callbacks = this.subscribers.get(key);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback({ key, action, data });
        } catch (error) {
          console.error('Cache subscriber error:', error);
        }
      });
    }

    // Notify wildcard subscribers
    const wildcardCallbacks = this.subscribers.get('*');
    if (wildcardCallbacks) {
      wildcardCallbacks.forEach(callback => {
        try {
          callback({ key, action, data });
        } catch (error) {
          console.error('Cache wildcard subscriber error:', error);
        }
      });
    }
  }

  // Get cache statistics
  getStats() {
    const now = Date.now();
    const valid = Array.from(this.timestamps.entries()).filter(([, timestamp]) => now <= timestamp);
    const expired = this.timestamps.size - valid.length;

    return {
      total: this.cache.size,
      valid: valid.length,
      expired,
      keys: Array.from(this.cache.keys())
    };
  }

  // Invalidate cache by pattern
  invalidatePattern(pattern) {
    const regex = new RegExp(pattern);
    const keysToDelete = Array.from(this.cache.keys()).filter(key => regex.test(key));
    keysToDelete.forEach(key => this.delete(key));
    return keysToDelete.length;
  }

  // Batch operations
  setMany(entries, ttl = this.defaultTTL) {
    entries.forEach(([key, data]) => {
      this.set(key, data, ttl);
    });
  }

  getMany(keys) {
    return keys.map(key => ({ key, data: this.get(key) }));
  }
}

// Create singleton instance
const dashboardCache = new DashboardCache();

// Cache key generators
export const CacheKeys = {
  // User data
  USER_PROFILE: (userId) => `user:profile:${userId}`,
  USER_PREFERENCES: (userId) => `user:preferences:${userId}`,
  
  // Tasks
  USER_TASKS: (userId) => `user:tasks:${userId}`,
  TASK_DETAILS: (taskId) => `task:details:${taskId}`,
  
  // Performance data
  USER_PERFORMANCE: (userId) => `user:performance:${userId}`,
  USER_ATTENDANCE: (userId) => `user:attendance:${userId}`,
  USER_GITLAB_DATA: (userId) => `user:gitlab:${userId}`,
  
  // Announcements
  USER_ANNOUNCEMENTS: (userId) => `user:announcements:${userId}`,
  ANNOUNCEMENT_DETAILS: (announcementId) => `announcement:details:${announcementId}`,
  
  // College data
  COLLEGE_OVERVIEW: (collegeId) => `college:overview:${collegeId}`,
  COLLEGE_USERS: (collegeId) => `college:users:${collegeId}`,
  COLLEGE_STATS: (collegeId) => `college:stats:${collegeId}`,
  
  // Chat rooms
  USER_CHAT_ROOMS: (userId) => `user:chatrooms:${userId}`,
  CHAT_ROOM_DETAILS: (roomId) => `chatroom:details:${roomId}`,
  
  // Leaderboard
  LEADERBOARD_DATA: (scope) => `leaderboard:${scope}`,
  
  // Admin data
  ALL_USERS: () => 'admin:users:all',
  ALL_COLLEGES: () => 'admin:colleges:all',
  SYSTEM_STATS: () => 'admin:system:stats',
  
  // POC data
  POC_COLLEGE_DATA: (pocId) => `poc:college:${pocId}`,
  POC_ANNOUNCEMENTS: (pocId) => `poc:announcements:${pocId}`,
  COLLEGE_TASKS: (collegeId) => `college:tasks:${collegeId}`,
  COLLEGE_TEAMS: (collegeId) => `college:teams:${collegeId}`,
  COLLEGE_PERFORMANCE: (collegeId) => `college:performance:${collegeId}`,
};

// Cache TTL configurations (in milliseconds)
export const CacheTTL = {
  SHORT: 1 * 60 * 1000,      // 1 minute
  MEDIUM: 5 * 60 * 1000,     // 5 minutes
  LONG: 15 * 60 * 1000,      // 15 minutes
  VERY_LONG: 60 * 60 * 1000, // 1 hour
  
  // Specific data types
  USER_PROFILE: 15 * 60 * 1000,     // 15 minutes
  TASKS: 2 * 60 * 1000,             // 2 minutes
  PERFORMANCE: 5 * 60 * 1000,       // 5 minutes
  ANNOUNCEMENTS: 1 * 60 * 1000,     // 1 minute
  CHAT_ROOMS: 30 * 1000,            // 30 seconds
  LEADERBOARD: 5 * 60 * 1000,       // 5 minutes
  SYSTEM_STATS: 10 * 60 * 1000,     // 10 minutes
};

// Cached fetch wrapper
export const cachedFetch = async (url, options = {}, cacheKey = null, ttl = CacheTTL.MEDIUM) => {
  const key = cacheKey || `fetch:${url}:${JSON.stringify(options)}`;
  
  // Check cache first
  const cached = dashboardCache.get(key);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (response.ok) {
      // Cache successful responses
      dashboardCache.set(key, data, ttl);
    }
    
    return data;
  } catch (error) {
    console.error('Cached fetch error:', error);
    throw error;
  }
};

// React hook for cached data
export const useCachedData = (key, fetcher, dependencies = [], ttl = CacheTTL.MEDIUM) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  const fetchData = useCallback(async (force = false) => {
    try {
      setLoading(true);
      setError(null);

      // Check cache first unless forced
      if (!force) {
        const cached = dashboardCache.get(key);
        if (cached) {
          setData(cached);
          setLoading(false);
          return cached;
        }
      }

      const result = await fetcher();
      dashboardCache.set(key, result, ttl);
      setData(result);
      setLastFetch(Date.now());
      return result;
    } catch (err) {
      setError(err);
      console.error('useCachedData error:', err);
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, ttl]);

  useEffect(() => {
    fetchData();
  }, [fetchData, ...dependencies]);

  // Subscribe to cache changes
  useEffect(() => {
    const unsubscribe = dashboardCache.subscribe(key, ({ action, data: newData }) => {
      if (action === 'set' && newData) {
        setData(newData);
      } else if (action === 'delete') {
        setData(null);
      }
    });

    return unsubscribe;
  }, [key]);

  return {
    data,
    loading,
    error,
    refetch: () => fetchData(true),
    lastFetch
  };
};

// Cache invalidation helpers
export const invalidateUserCache = (userId) => {
  dashboardCache.invalidatePattern(`user:.*:${userId}`);
};

export const invalidateCollegeCache = (collegeId) => {
  dashboardCache.invalidatePattern(`college:.*:${collegeId}`);
};

export const invalidateAnnouncementCache = () => {
  dashboardCache.invalidatePattern('.*:announcements:.*');
};

export const invalidateTaskCache = (userId = null) => {
  if (userId) {
    dashboardCache.delete(CacheKeys.USER_TASKS(userId));
  } else {
    dashboardCache.invalidatePattern('.*:tasks:.*');
  }
};

export default dashboardCache;