'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dashboardCache from '../../utils/cache';
import { PERFORMANCE_CONFIG } from '../../config/cacheConfig';

/**
 * Cache monitoring component for development and debugging
 */
const CacheMonitor = ({ enabled = process.env.NODE_ENV === 'development' }) => {
  const [cacheStats, setCacheStats] = useState({});
  const [performanceMetrics, setPerformanceMetrics] = useState({});
  const [isVisible, setIsVisible] = useState(false);

  // Update cache statistics
  const updateStats = useCallback(() => {
    const stats = dashboardCache.getStats();
    const performance = {
      hitRate: stats.hits / (stats.hits + stats.misses) * 100 || 0,
      memoryUsage: (stats.memoryUsage / 1024 / 1024).toFixed(2), // MB
      avgResponseTime: stats.avgResponseTime || 0,
      totalRequests: stats.hits + stats.misses,
    };

    setCacheStats(stats);
    setPerformanceMetrics(performance);
  }, []);

  // Auto-update stats
  useEffect(() => {
    if (!enabled) return;

    updateStats();
    const interval = setInterval(updateStats, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [enabled, updateStats]);

  // Clear cache function
  const clearCache = useCallback(() => {
    dashboardCache.clear();
    updateStats();
  }, [updateStats]);

  // Get cache health status
  const getCacheHealth = useCallback(() => {
    const { hitRate, memoryUsage } = performanceMetrics;
    
    if (hitRate > 80 && memoryUsage < 50) return 'excellent';
    if (hitRate > 60 && memoryUsage < 100) return 'good';
    if (hitRate > 40 && memoryUsage < 200) return 'fair';
    return 'poor';
  }, [performanceMetrics]);

  if (!enabled) return null;

  const health = getCacheHealth();
  const healthColors = {
    excellent: 'text-green-500',
    good: 'text-blue-500',
    fair: 'text-yellow-500',
    poor: 'text-red-500'
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className={`
          w-12 h-12 rounded-full shadow-lg transition-all duration-200
          ${health === 'excellent' ? 'bg-green-500' : 
            health === 'good' ? 'bg-blue-500' :
            health === 'fair' ? 'bg-yellow-500' : 'bg-red-500'}
          text-white hover:scale-110 flex items-center justify-center
        `}
        title="Cache Monitor"
      >
        📊
      </button>

      {/* Stats Panel */}
      {isVisible && (
        <div className="absolute bottom-16 right-0 w-80 bg-white rounded-lg shadow-xl border border-gray-200 p-4 text-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Cache Monitor</h3>
            <div className="flex space-x-2">
              <button
                onClick={updateStats}
                className="text-blue-500 hover:text-blue-700"
                title="Refresh"
              >
                🔄
              </button>
              <button
                onClick={clearCache}
                className="text-red-500 hover:text-red-700"
                title="Clear Cache"
              >
                🗑️
              </button>
              <button
                onClick={() => setIsVisible(false)}
                className="text-gray-500 hover:text-gray-700"
                title="Close"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Health Status */}
          <div className="mb-3 p-2 bg-gray-50 rounded">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Health:</span>
              <span className={`font-medium ${healthColors[health]}`}>
                {health.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="space-y-2 mb-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Hit Rate:</span>
              <span className="font-medium">
                {performanceMetrics.hitRate?.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Memory:</span>
              <span className="font-medium">
                {performanceMetrics.memoryUsage} MB
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Avg Response:</span>
              <span className="font-medium">
                {performanceMetrics.avgResponseTime?.toFixed(0)}ms
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Requests:</span>
              <span className="font-medium">
                {performanceMetrics.totalRequests}
              </span>
            </div>
          </div>

          {/* Cache Statistics */}
          <div className="border-t pt-3 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Entries:</span>
              <span>{cacheStats.total}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Valid:</span>
              <span className="text-green-600">{cacheStats.valid}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Expired:</span>
              <span className="text-red-600">{cacheStats.expired}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Hits:</span>
              <span className="text-blue-600">{cacheStats.hits}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Misses:</span>
              <span className="text-orange-600">{cacheStats.misses}</span>
            </div>
          </div>

          {/* Cache Entries Preview */}
          <div className="border-t pt-3 mt-3">
            <div className="text-xs text-gray-500 mb-2">Recent Entries:</div>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {Object.keys(cacheStats.entries || {}).slice(0, 5).map(key => (
                <div key={key} className="text-xs text-gray-600 truncate">
                  {key.replace('admin:', '').replace(/:/g, ' › ')}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CacheMonitor;