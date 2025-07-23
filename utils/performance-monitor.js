/**
 * Performance monitoring and optimization utilities
 */

import { logger } from './logger.js';

// Performance thresholds
const THRESHOLDS = {
  API_RESPONSE: 1000,      // 1 second for API responses
  DATABASE_QUERY: 500,     // 500ms for database queries
  RENDER_TIME: 100,        // 100ms for component renders
  MEMORY_USAGE: 0.8,       // 80% memory usage warning
};

// Performance metrics storage
class PerformanceMetrics {
  constructor() {
    this.metrics = new Map();
    this.alerts = [];
    this.startTime = Date.now();
  }

  record(operation, duration, metadata = {}) {
    const timestamp = Date.now();
    const key = metadata.category || 'general';
    
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }
    
    this.metrics.get(key).push({
      operation,
      duration,
      timestamp,
      metadata
    });

    // Check against thresholds
    this.checkThresholds(operation, duration, metadata);
    
    // Keep only last 1000 metrics per category
    const categoryMetrics = this.metrics.get(key);
    if (categoryMetrics.length > 1000) {
      categoryMetrics.shift();
    }
  }

  checkThresholds(operation, duration, metadata) {
    const category = metadata.category || 'general';
    let threshold = THRESHOLDS.API_RESPONSE;
    
    switch (category) {
      case 'database':
        threshold = THRESHOLDS.DATABASE_QUERY;
        break;
      case 'render':
        threshold = THRESHOLDS.RENDER_TIME;
        break;
      case 'api':
        threshold = THRESHOLDS.API_RESPONSE;
        break;
    }

    if (duration > threshold) {
      const alert = {
        timestamp: Date.now(),
        operation,
        duration,
        threshold,
        category,
        metadata
      };
      
      this.alerts.push(alert);
      logger.warn(`Performance alert: ${operation} took ${duration}ms (threshold: ${threshold}ms)`, metadata);
      
      // Keep only last 100 alerts
      if (this.alerts.length > 100) {
        this.alerts.shift();
      }
    }
  }

  getStats(category = null) {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    
    let allMetrics = [];
    
    if (category) {
      allMetrics = this.metrics.get(category) || [];
    } else {
      for (const metrics of this.metrics.values()) {
        allMetrics.push(...metrics);
      }
    }

    // Filter to last hour
    const recentMetrics = allMetrics.filter(m => now - m.timestamp < oneHour);
    
    if (recentMetrics.length === 0) {
      return null;
    }

    const durations = recentMetrics.map(m => m.duration);
    const sorted = durations.sort((a, b) => a - b);
    
    return {
      count: recentMetrics.length,
      average: durations.reduce((a, b) => a + b, 0) / durations.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
      min: Math.min(...durations),
      max: Math.max(...durations),
      recentAlerts: this.alerts.filter(a => now - a.timestamp < oneHour).length
    };
  }

  reset() {
    this.metrics.clear();
    this.alerts = [];
  }
}

// Global performance monitor instance
const performanceMonitor = new PerformanceMetrics();

/**
 * Performance timing decorator for functions
 */
export function withTiming(operation, category = 'general') {
  return function(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function(...args) {
      const start = Date.now();
      try {
        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - start;
        
        performanceMonitor.record(operation, duration, {
          category,
          method: propertyKey,
          success: true
        });
        
        return result;
      } catch (error) {
        const duration = Date.now() - start;
        
        performanceMonitor.record(operation, duration, {
          category,
          method: propertyKey,
          success: false,
          error: error.message
        });
        
        throw error;
      }
    };
    
    return descriptor;
  };
}

/**
 * Manual performance timing
 */
export function startTiming(operation) {
  return {
    operation,
    start: Date.now(),
    end: function(metadata = {}) {
      const duration = Date.now() - this.start;
      performanceMonitor.record(this.operation, duration, metadata);
      return duration;
    }
  };
}

/**
 * Database query performance wrapper
 */
export function measureQuery(model, operation) {
  return async function(query, options = {}) {
    const timer = startTiming(`${model}.${operation}`);
    
    try {
      const result = await model[operation](query, options);
      timer.end({ 
        category: 'database',
        model: model.modelName,
        operation,
        resultCount: Array.isArray(result) ? result.length : result ? 1 : 0
      });
      
      return result;
    } catch (error) {
      timer.end({ 
        category: 'database',
        model: model.modelName,
        operation,
        error: error.message
      });
      throw error;
    }
  };
}

/**
 * API route performance middleware
 */
export function performanceMiddleware(req, res, next) {
  const timer = startTiming(`${req.method} ${req.url}`);
  
  const originalSend = res.send;
  res.send = function(data) {
    const duration = timer.end({
      category: 'api',
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      userAgent: req.headers['user-agent'],
      responseSize: data ? JSON.stringify(data).length : 0
    });
    
    return originalSend.call(this, data);
  };
  
  if (next) next();
}

/**
 * React component performance monitoring
 */
export function withComponentTiming(ComponentName) {
  return function(WrappedComponent) {
    return function TimedComponent(props) {
      const timer = startTiming(`render:${ComponentName}`);
      
      React.useEffect(() => {
        timer.end({ category: 'render', component: ComponentName });
      });
      
      return React.createElement(WrappedComponent, props);
    };
  };
}

/**
 * Memory usage monitoring
 */
export function checkMemoryUsage() {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const usage = process.memoryUsage();
    const usageInMB = {
      rss: Math.round(usage.rss / 1024 / 1024),
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
      external: Math.round(usage.external / 1024 / 1024),
    };
    
    const heapUsageRatio = usage.heapUsed / usage.heapTotal;
    
    if (heapUsageRatio > THRESHOLDS.MEMORY_USAGE) {
      logger.warn('High memory usage detected', {
        usage: usageInMB,
        heapUsageRatio: Math.round(heapUsageRatio * 100) + '%'
      });
    }
    
    return usageInMB;
  }
  
  return null;
}

/**
 * Performance summary report
 */
export function getPerformanceReport() {
  const report = {
    timestamp: new Date().toISOString(),
    uptime: Date.now() - performanceMonitor.startTime,
    memory: checkMemoryUsage(),
    metrics: {}
  };
  
  // Get stats for each category
  const categories = ['api', 'database', 'render'];
  for (const category of categories) {
    const stats = performanceMonitor.getStats(category);
    if (stats) {
      report.metrics[category] = stats;
    }
  }
  
  // Overall stats
  report.metrics.overall = performanceMonitor.getStats();
  
  // Recent alerts
  report.recentAlerts = performanceMonitor.alerts.slice(-10);
  
  return report;
}

/**
 * Performance optimization recommendations
 */
export function getOptimizationRecommendations() {
  const recommendations = [];
  const stats = performanceMonitor.getStats();
  
  if (!stats) {
    return ['No performance data available yet'];
  }
  
  if (stats.average > THRESHOLDS.API_RESPONSE) {
    recommendations.push('API responses are slow. Consider caching, database optimization, or code review.');
  }
  
  if (stats.p95 > THRESHOLDS.API_RESPONSE * 2) {
    recommendations.push('95th percentile response time is very high. Check for outliers and bottlenecks.');
  }
  
  const dbStats = performanceMonitor.getStats('database');
  if (dbStats && dbStats.average > THRESHOLDS.DATABASE_QUERY) {
    recommendations.push('Database queries are slow. Consider adding indexes or optimizing queries.');
  }
  
  const memoryUsage = checkMemoryUsage();
  if (memoryUsage && memoryUsage.heapUsed > 500) {
    recommendations.push('High memory usage detected. Check for memory leaks or consider scaling.');
  }
  
  if (performanceMonitor.alerts.length > 50) {
    recommendations.push('High number of performance alerts. Review and optimize frequently slow operations.');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Performance looks good! Keep monitoring for any degradation.');
  }
  
  return recommendations;
}

/**
 * Start continuous performance monitoring
 */
export function startPerformanceMonitoring(interval = 60000) {
  if (typeof process !== 'undefined') {
    const monitoringInterval = setInterval(() => {
      const report = getPerformanceReport();
      const recommendations = getOptimizationRecommendations();
      
      logger.info('Performance monitoring report', {
        uptime: report.uptime,
        memory: report.memory,
        metrics: report.metrics.overall,
        recommendations: recommendations.slice(0, 3)
      });
    }, interval);
    
    // Cleanup on process exit
    process.on('SIGINT', () => {
      clearInterval(monitoringInterval);
    });
    
    process.on('SIGTERM', () => {
      clearInterval(monitoringInterval);
    });
  }
}

export {
  performanceMonitor,
  PerformanceMetrics,
  THRESHOLDS
};

export default {
  withTiming,
  startTiming,
  measureQuery,
  performanceMiddleware,
  withComponentTiming,
  checkMemoryUsage,
  getPerformanceReport,
  getOptimizationRecommendations,
  startPerformanceMonitoring,
  performanceMonitor
};