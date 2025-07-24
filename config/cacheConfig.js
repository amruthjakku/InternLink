'use client';

import { CacheTTL } from '../utils/cache';

/**
 * Centralized cache configuration for the admin dashboard
 * This file defines cache strategies, TTL values, and refresh policies
 */

// Cache TTL configurations for different data types
export const CACHE_TTL = {
  // Real-time data (30 seconds - 2 minutes)
  REAL_TIME: 30000,        // 30 seconds
  STATS: 60000,            // 1 minute
  SYSTEM_HEALTH: 30000,    // 30 seconds
  ACTIVITY_LOGS: 60000,    // 1 minute
  
  // Frequently changing data (5-15 minutes)
  SHORT: 300000,           // 5 minutes
  TASKS: 300000,           // 5 minutes
  ATTENDANCE: 600000,      // 10 minutes
  ANNOUNCEMENTS: 300000,   // 5 minutes
  USER_ACTIVITY: 600000,   // 10 minutes
  
  // Moderately changing data (30 minutes - 1 hour)
  MEDIUM: 1800000,         // 30 minutes
  USERS: 1800000,          // 30 minutes
  COHORTS: 1800000,        // 30 minutes
  PERFORMANCE: 3600000,    // 1 hour
  
  // Rarely changing data (2-24 hours)
  LONG: 7200000,           // 2 hours
  COLLEGES: 7200000,       // 2 hours
  SYSTEM_CONFIG: 86400000, // 24 hours
  USER_ROLES: 86400000,    // 24 hours
  
  // Static or very rarely changing data
  STATIC: 86400000,        // 24 hours
  APP_CONFIG: 86400000,    // 24 hours
};

// Cache refresh policies
export const REFRESH_POLICIES = {
  // Refresh on window focus
  FOCUS_REFRESH: {
    stats: true,
    systemHealth: true,
    activityLogs: true,
    tasks: true,
    attendance: true,
    announcements: true,
    users: false,
    colleges: false,
    cohorts: false,
    systemConfig: false,
  },
  
  // Stale-while-revalidate strategy
  STALE_WHILE_REVALIDATE: {
    stats: true,
    users: true,
    colleges: true,
    cohorts: true,
    tasks: true,
    attendance: true,
    announcements: true,
    systemHealth: true,
    activityLogs: false, // Always fresh
    systemConfig: true,
  },
  
  // Background refresh intervals (in milliseconds)
  BACKGROUND_REFRESH: {
    stats: 30000,           // 30 seconds
    systemHealth: 30000,    // 30 seconds
    activityLogs: 60000,    // 1 minute
    tasks: 300000,          // 5 minutes
    attendance: 600000,     // 10 minutes
    users: 1800000,         // 30 minutes
    colleges: 3600000,      // 1 hour
    cohorts: 1800000,       // 30 minutes
    announcements: 300000,  // 5 minutes
  }
};

// Cache keys for different admin data types
export const ADMIN_CACHE_KEYS = {
  // Overview/Stats
  STATS: 'admin:stats:overview',
  SYSTEM_HEALTH: 'admin:system:health',
  ACTIVITY_LOGS: 'admin:activity:logs',
  
  // User Management
  ALL_USERS: 'admin:users:all',
  USER_STATS: 'admin:users:stats',
  RECENT_USERS: 'admin:users:recent',
  USERS_BY_ROLE: (role) => `admin:users:role:${role}`,
  USER_PERFORMANCE: 'admin:users:performance',
  
  // College Management
  ALL_COLLEGES: 'admin:colleges:all',
  COLLEGE_STATS: 'admin:colleges:stats',
  COLLEGE_USERS: 'admin:colleges:users',
  
  // Cohort Management
  ALL_COHORTS: 'admin:cohorts:all',
  COHORT_STATS: 'admin:cohorts:stats',
  COHORT_ASSIGNMENTS: 'admin:cohorts:assignments',
  
  // Task Management
  ALL_TASKS: 'admin:tasks:all',
  TASK_STATS: 'admin:tasks:stats',
  TASK_PROGRESS: 'admin:tasks:progress',
  
  // Attendance
  ATTENDANCE_STATS: 'admin:attendance:stats',
  RECENT_ATTENDANCE: 'admin:attendance:recent',
  ATTENDANCE_ISSUES: 'admin:attendance:issues',
  
  // Announcements
  ALL_ANNOUNCEMENTS: 'admin:announcements:all',
  ANNOUNCEMENT_STATS: 'admin:announcements:stats',
  
  // Analytics
  PERFORMANCE_METRICS: 'admin:analytics:performance',
  ENGAGEMENT_STATS: 'admin:analytics:engagement',
  TREND_DATA: 'admin:analytics:trends',
  
  // System
  SYSTEM_LOGS: 'admin:system:logs',
  DATABASE_STATS: 'admin:system:database',
  CACHE_STATS: 'admin:system:cache',
};

// Tab-specific cache configurations
export const TAB_CACHE_CONFIG = {
  overview: {
    dataKeys: ['stats', 'systemHealth', 'activityLogs'],
    ttl: CACHE_TTL.REAL_TIME,
    refreshOnFocus: false, // Disabled to prevent auto-refresh
    staleWhileRevalidate: true,
    backgroundRefresh: 30000,
  },
  
  'user-management': {
    dataKeys: ['allUsers', 'userStats', 'recentUsers'],
    ttl: CACHE_TTL.MEDIUM,
    refreshOnFocus: false,
    staleWhileRevalidate: true,
    backgroundRefresh: 1800000,
  },
  
  'college-management': {
    dataKeys: ['allColleges', 'collegeStats', 'collegeUsers'],
    ttl: CACHE_TTL.LONG,
    refreshOnFocus: false,
    staleWhileRevalidate: true,
    backgroundRefresh: 3600000,
  },
  
  'cohort-system': {
    dataKeys: ['allCohorts', 'cohortStats', 'cohortAssignments'],
    ttl: CACHE_TTL.MEDIUM,
    refreshOnFocus: false,
    staleWhileRevalidate: true,
    backgroundRefresh: 1800000,
  },
  
  'task-management': {
    dataKeys: ['allTasks', 'taskStats', 'taskProgress'],
    ttl: CACHE_TTL.SHORT,
    refreshOnFocus: false, // Disabled to prevent auto-refresh
    staleWhileRevalidate: true,
    backgroundRefresh: 300000,
  },
  
  'attendance-ip': {
    dataKeys: ['attendanceStats', 'recentAttendance', 'attendanceIssues'],
    ttl: CACHE_TTL.MEDIUM,
    refreshOnFocus: false, // Disabled to prevent auto-refresh
    staleWhileRevalidate: true,
    backgroundRefresh: 600000,
  },
  
  announcements: {
    dataKeys: ['allAnnouncements', 'announcementStats'],
    ttl: CACHE_TTL.SHORT,
    refreshOnFocus: false, // Disabled to prevent auto-refresh
    staleWhileRevalidate: true,
    backgroundRefresh: 300000,
  },
  
  'system-monitoring': {
    dataKeys: ['systemLogs', 'databaseStats', 'cacheStats'],
    ttl: CACHE_TTL.REAL_TIME,
    refreshOnFocus: false, // Disabled to prevent auto-refresh
    staleWhileRevalidate: false, // Always fresh for monitoring
    backgroundRefresh: 30000,
  },
  
  'analytics-hub': {
    dataKeys: ['performanceMetrics', 'engagementStats', 'trendData'],
    ttl: CACHE_TTL.LONG,
    refreshOnFocus: false,
    staleWhileRevalidate: true,
    backgroundRefresh: 3600000,
  },
  
  'data-integrity': {
    dataKeys: ['integrityChecks', 'dataQuality'],
    ttl: CACHE_TTL.MEDIUM,
    refreshOnFocus: false,
    staleWhileRevalidate: true,
    backgroundRefresh: 1800000,
  },
  
  'bulk-operations': {
    dataKeys: ['importHistory', 'operationStatus'],
    ttl: CACHE_TTL.SHORT,
    refreshOnFocus: false, // Disabled to prevent auto-refresh
    staleWhileRevalidate: true,
    backgroundRefresh: 300000,
  },
};

// Cache invalidation patterns
export const CACHE_INVALIDATION = {
  // When user data changes, invalidate related caches
  USER_CHANGE: [
    ADMIN_CACHE_KEYS.ALL_USERS,
    ADMIN_CACHE_KEYS.USER_STATS,
    ADMIN_CACHE_KEYS.RECENT_USERS,
    ADMIN_CACHE_KEYS.STATS,
  ],
  
  // When college data changes
  COLLEGE_CHANGE: [
    ADMIN_CACHE_KEYS.ALL_COLLEGES,
    ADMIN_CACHE_KEYS.COLLEGE_STATS,
    ADMIN_CACHE_KEYS.COLLEGE_USERS,
    ADMIN_CACHE_KEYS.STATS,
  ],
  
  // When cohort data changes
  COHORT_CHANGE: [
    ADMIN_CACHE_KEYS.ALL_COHORTS,
    ADMIN_CACHE_KEYS.COHORT_STATS,
    ADMIN_CACHE_KEYS.COHORT_ASSIGNMENTS,
    ADMIN_CACHE_KEYS.STATS,
  ],
  
  // When task data changes
  TASK_CHANGE: [
    ADMIN_CACHE_KEYS.ALL_TASKS,
    ADMIN_CACHE_KEYS.TASK_STATS,
    ADMIN_CACHE_KEYS.TASK_PROGRESS,
    ADMIN_CACHE_KEYS.STATS,
  ],
  
  // When attendance data changes
  ATTENDANCE_CHANGE: [
    ADMIN_CACHE_KEYS.ATTENDANCE_STATS,
    ADMIN_CACHE_KEYS.RECENT_ATTENDANCE,
    ADMIN_CACHE_KEYS.ATTENDANCE_ISSUES,
    ADMIN_CACHE_KEYS.STATS,
  ],
  
  // When announcement data changes
  ANNOUNCEMENT_CHANGE: [
    ADMIN_CACHE_KEYS.ALL_ANNOUNCEMENTS,
    ADMIN_CACHE_KEYS.ANNOUNCEMENT_STATS,
  ],
};

// Performance optimization settings
export const PERFORMANCE_CONFIG = {
  // Maximum number of concurrent requests per tab
  MAX_CONCURRENT_REQUESTS: 3,
  
  // Request timeout (in milliseconds)
  REQUEST_TIMEOUT: 30000,
  
  // Retry configuration
  RETRY_CONFIG: {
    maxRetries: 3,
    retryDelay: 1000,
    exponentialBackoff: true,
  },
  
  // Preloading configuration
  PRELOAD_CONFIG: {
    enabled: true,
    preloadTabs: ['user-management', 'college-management', 'task-management'],
    preloadDelay: 2000, // 2 seconds after initial load
  },
  
  // Memory management
  MEMORY_CONFIG: {
    maxCacheSize: 100, // Maximum number of cache entries
    cleanupInterval: 300000, // 5 minutes
    memoryThreshold: 0.8, // 80% memory usage threshold
  },
};

export default {
  CACHE_TTL,
  REFRESH_POLICIES,
  ADMIN_CACHE_KEYS,
  TAB_CACHE_CONFIG,
  CACHE_INVALIDATION,
  PERFORMANCE_CONFIG,
};