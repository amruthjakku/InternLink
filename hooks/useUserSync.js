'use client';

import { useState, useCallback, useRef } from 'react';

/**
 * Custom hook for managing user synchronization
 * Ensures frontend state stays in sync with backend changes
 */
export function useUserSync() {
  const [syncStatus, setSyncStatus] = useState({
    isLoading: false,
    lastSync: null,
    error: null,
    queueSize: 0
  });
  
  const [optimisticUpdates, setOptimisticUpdates] = useState(new Map());
  const syncTimeoutRef = useRef(null);

  /**
   * Apply optimistic update to local state
   */
  const applyOptimisticUpdate = useCallback((userId, updates) => {
    setOptimisticUpdates(prev => {
      const newMap = new Map(prev);
      newMap.set(userId, {
        ...newMap.get(userId),
        ...updates,
        timestamp: new Date()
      });
      return newMap;
    });

    // Clear optimistic update after 10 seconds
    setTimeout(() => {
      setOptimisticUpdates(prev => {
        const newMap = new Map(prev);
        newMap.delete(userId);
        return newMap;
      });
    }, 10000);
  }, []);

  /**
   * Sync user update
   */
  const syncUserUpdate = useCallback(async (userId, data, options = {}) => {
    const { optimistic = true, onSuccess, onError } = options;
    
    setSyncStatus(prev => ({ ...prev, isLoading: true, error: null }));

    // Apply optimistic update if enabled
    if (optimistic) {
      applyOptimisticUpdate(userId, data);
    }

    try {
      const response = await fetch('/api/admin/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_user',
          userId,
          data
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Sync failed');
      }

      setSyncStatus(prev => ({
        ...prev,
        isLoading: false,
        lastSync: new Date(),
        error: null
      }));

      if (onSuccess) {
        onSuccess(result);
      }

      return result;

    } catch (error) {
      console.error('User sync error:', error);
      
      setSyncStatus(prev => ({
        ...prev,
        isLoading: false,
        error: error.message
      }));

      // Remove optimistic update on error
      if (optimistic) {
        setOptimisticUpdates(prev => {
          const newMap = new Map(prev);
          newMap.delete(userId);
          return newMap;
        });
      }

      if (onError) {
        onError(error);
      }

      throw error;
    }
  }, [applyOptimisticUpdate]);

  /**
   * Sync user activation
   */
  const syncUserActivation = useCallback(async (userId, isActive, reason = '', options = {}) => {
    const { optimistic = true, onSuccess, onError } = options;
    
    setSyncStatus(prev => ({ ...prev, isLoading: true, error: null }));

    // Apply optimistic update
    if (optimistic) {
      applyOptimisticUpdate(userId, { 
        isActive,
        [isActive ? 'reactivatedAt' : 'deactivatedAt']: new Date(),
        [isActive ? 'reactivationReason' : 'deactivationReason']: reason
      });
    }

    try {
      const response = await fetch('/api/admin/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: isActive ? 'activate_user' : 'deactivate_user',
          userId,
          data: { reason }
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Activation sync failed');
      }

      setSyncStatus(prev => ({
        ...prev,
        isLoading: false,
        lastSync: new Date(),
        error: null
      }));

      if (onSuccess) {
        onSuccess(result);
      }

      return result;

    } catch (error) {
      console.error('User activation sync error:', error);
      
      setSyncStatus(prev => ({
        ...prev,
        isLoading: false,
        error: error.message
      }));

      // Remove optimistic update on error
      if (optimistic) {
        setOptimisticUpdates(prev => {
          const newMap = new Map(prev);
          newMap.delete(userId);
          return newMap;
        });
      }

      if (onError) {
        onError(error);
      }

      throw error;
    }
  }, [applyOptimisticUpdate]);

  /**
   * Sync cohort assignment
   */
  const syncCohortAssignment = useCallback(async (userId, cohortId, options = {}) => {
    const { optimistic = true, onSuccess, onError, originalCohortId } = options;
    
    setSyncStatus(prev => ({ ...prev, isLoading: true, error: null }));

    // Apply optimistic update
    if (optimistic) {
      applyOptimisticUpdate(userId, { 
        cohortId: cohortId || null,
        cohortAssignedAt: cohortId ? new Date() : null
      });
    }

    try {
      const response = await fetch('/api/admin/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: cohortId ? 'assign_cohort' : 'remove_cohort',
          userId,
          data: { 
            cohortId,
            originalCohortId
          }
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Cohort assignment sync failed');
      }

      setSyncStatus(prev => ({
        ...prev,
        isLoading: false,
        lastSync: new Date(),
        error: null
      }));

      if (onSuccess) {
        onSuccess(result);
      }

      return result;

    } catch (error) {
      console.error('Cohort assignment sync error:', error);
      
      setSyncStatus(prev => ({
        ...prev,
        isLoading: false,
        error: error.message
      }));

      // Remove optimistic update on error
      if (optimistic) {
        setOptimisticUpdates(prev => {
          const newMap = new Map(prev);
          newMap.delete(userId);
          return newMap;
        });
      }

      if (onError) {
        onError(error);
      }

      throw error;
    }
  }, [applyOptimisticUpdate]);

  /**
   * Sync bulk operations
   */
  const syncBulkUpdate = useCallback(async (userIds, updateData, options = {}) => {
    const { optimistic = true, onSuccess, onError, onProgress } = options;
    
    setSyncStatus(prev => ({ ...prev, isLoading: true, error: null }));

    // Apply optimistic updates
    if (optimistic) {
      userIds.forEach(userId => {
        applyOptimisticUpdate(userId, updateData);
      });
    }

    try {
      const response = await fetch('/api/admin/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bulk_update',
          data: {
            userIds,
            updateData
          }
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Bulk sync failed');
      }

      setSyncStatus(prev => ({
        ...prev,
        isLoading: false,
        lastSync: new Date(),
        error: null
      }));

      if (onSuccess) {
        onSuccess(result);
      }

      return result;

    } catch (error) {
      console.error('Bulk sync error:', error);
      
      setSyncStatus(prev => ({
        ...prev,
        isLoading: false,
        error: error.message
      }));

      // Remove optimistic updates on error
      if (optimistic) {
        userIds.forEach(userId => {
          setOptimisticUpdates(prev => {
            const newMap = new Map(prev);
            newMap.delete(userId);
            return newMap;
          });
        });
      }

      if (onError) {
        onError(error);
      }

      throw error;
    }
  }, [applyOptimisticUpdate]);

  /**
   * Get sync status
   */
  const getSyncStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/users/sync');
      const result = await response.json();

      if (response.ok) {
        setSyncStatus(prev => ({
          ...prev,
          queueSize: result.syncStatus.queueSize,
          lastSync: new Date()
        }));
      }

      return result;
    } catch (error) {
      console.error('Error fetching sync status:', error);
      return null;
    }
  }, []);

  /**
   * Apply optimistic updates to user data
   */
  const applyOptimisticUpdatesToUser = useCallback((user) => {
    const updates = optimisticUpdates.get(user._id);
    if (!updates) return user;

    return {
      ...user,
      ...updates,
      _optimistic: true,
      _optimisticTimestamp: updates.timestamp
    };
  }, [optimisticUpdates]);

  /**
   * Apply optimistic updates to user list
   */
  const applyOptimisticUpdatesToUsers = useCallback((users) => {
    return users.map(applyOptimisticUpdatesToUser);
  }, [applyOptimisticUpdatesToUser]);

  /**
   * Clear all optimistic updates
   */
  const clearOptimisticUpdates = useCallback(() => {
    setOptimisticUpdates(new Map());
  }, []);

  /**
   * Auto-refresh sync status
   */
  const startAutoRefresh = useCallback((interval = 30000) => {
    if (syncTimeoutRef.current) {
      clearInterval(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setInterval(() => {
      getSyncStatus();
    }, interval);

    return () => {
      if (syncTimeoutRef.current) {
        clearInterval(syncTimeoutRef.current);
        syncTimeoutRef.current = null;
      }
    };
  }, [getSyncStatus]);

  return {
    // State
    syncStatus,
    optimisticUpdates,
    
    // Actions
    syncUserUpdate,
    syncUserActivation,
    syncCohortAssignment,
    syncBulkUpdate,
    getSyncStatus,
    
    // Utilities
    applyOptimisticUpdatesToUser,
    applyOptimisticUpdatesToUsers,
    clearOptimisticUpdates,
    startAutoRefresh
  };
}