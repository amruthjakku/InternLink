/**
 * Comprehensive logging and monitoring utility
 */

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

const currentLogLevel = LOG_LEVELS[process.env.LOG_LEVEL?.toUpperCase()] ?? 
  (process.env.NODE_ENV === 'production' ? LOG_LEVELS.INFO : LOG_LEVELS.DEBUG);

/**
 * Format log message with timestamp and context
 */
function formatMessage(level, message, context = {}) {
  const timestamp = new Date().toISOString();
  const contextStr = Object.keys(context).length > 0 ? 
    `\n  Context: ${JSON.stringify(context, null, 2)}` : '';
  
  return `[${timestamp}] [${level}] ${message}${contextStr}`;
}

/**
 * Log to appropriate output based on environment
 */
function logOutput(level, formattedMessage, error = null) {
  if (typeof window !== 'undefined') {
    // Browser environment
    const consoleMethod = level === 'ERROR' ? 'error' : 
                         level === 'WARN' ? 'warn' : 'log';
    console[consoleMethod](formattedMessage);
    if (error) console.error(error);
  } else {
    // Server environment
    console.log(formattedMessage);
    if (error) console.error(error);
    
    // In production, you might want to send to external logging service
    if (process.env.NODE_ENV === 'production' && level === 'ERROR') {
      // Example: Send to external service
      // sendToLoggingService(formattedMessage, error);
    }
  }
}

class Logger {
  constructor(component = 'App') {
    this.component = component;
  }

  error(message, context = {}, error = null) {
    if (currentLogLevel >= LOG_LEVELS.ERROR) {
      const formatted = formatMessage('ERROR', `[${this.component}] ${message}`, context);
      logOutput('ERROR', formatted, error);
      
      // Track error for analytics
      this.trackError(message, context, error);
    }
  }

  warn(message, context = {}) {
    if (currentLogLevel >= LOG_LEVELS.WARN) {
      const formatted = formatMessage('WARN', `[${this.component}] ${message}`, context);
      logOutput('WARN', formatted);
    }
  }

  info(message, context = {}) {
    if (currentLogLevel >= LOG_LEVELS.INFO) {
      const formatted = formatMessage('INFO', `[${this.component}] ${message}`, context);
      logOutput('INFO', formatted);
    }
  }

  debug(message, context = {}) {
    if (currentLogLevel >= LOG_LEVELS.DEBUG) {
      const formatted = formatMessage('DEBUG', `[${this.component}] ${message}`, context);
      logOutput('DEBUG', formatted);
    }
  }

  /**
   * Log API request/response
   */
  apiCall(method, url, status, duration, context = {}) {
    const message = `${method} ${url} - ${status} (${duration}ms)`;
    const level = status >= 400 ? 'ERROR' : status >= 300 ? 'WARN' : 'INFO';
    
    this[level.toLowerCase()](message, {
      method,
      url,
      status,
      duration,
      ...context
    });
  }

  /**
   * Log database operations
   */
  dbQuery(operation, collection, duration, context = {}) {
    this.debug(`DB ${operation} on ${collection} (${duration}ms)`, context);
  }

  /**
   * Log authentication events
   */
  auth(event, userId, context = {}) {
    this.info(`Auth: ${event}`, {
      userId,
      timestamp: new Date().toISOString(),
      ...context
    });
  }

  /**
   * Log security events
   */
  security(event, context = {}) {
    this.warn(`Security: ${event}`, {
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'server',
      ...context
    });
  }

  /**
   * Track error for monitoring/analytics
   */
  trackError(message, context, error) {
    const errorData = {
      message,
      context,
      stack: error?.stack,
      timestamp: new Date().toISOString(),
      component: this.component,
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'server',
      url: typeof window !== 'undefined' ? window.location.href : context.url,
    };

    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Example integrations:
      // - Sentry: Sentry.captureException(error, { extra: errorData });
      // - LogRocket: LogRocket.captureException(error);
      // - Custom API: sendErrorToAPI(errorData);
    }
  }

  /**
   * Performance monitoring
   */
  performance(operation, duration, context = {}) {
    const level = duration > 5000 ? 'WARN' : duration > 1000 ? 'INFO' : 'DEBUG';
    this[level](`Performance: ${operation} took ${duration}ms`, context);
  }

  /**
   * User action logging
   */
  userAction(action, userId, context = {}) {
    this.info(`User Action: ${action}`, {
      userId,
      timestamp: new Date().toISOString(),
      ...context
    });
  }
}

// Create default logger instances
export const logger = new Logger('Global');
export const apiLogger = new Logger('API');
export const dbLogger = new Logger('Database');
export const authLogger = new Logger('Auth');
export const securityLogger = new Logger('Security');

// Helper function to create component-specific logger
export function createLogger(component) {
  return new Logger(component);
}

// Middleware for API route logging
export function loggerMiddleware(req, res, next) {
  const start = Date.now();
  const originalJson = res.json;
  
  res.json = function(data) {
    const duration = Date.now() - start;
    apiLogger.apiCall(
      req.method,
      req.url,
      res.statusCode,
      duration,
      {
        userAgent: req.headers['user-agent'],
        ip: req.ip || req.connection?.remoteAddress,
        userId: req.user?.id,
      }
    );
    return originalJson.call(this, data);
  };

  if (next) next();
}

// Performance measurement helper
export function measurePerformance(operation, fn) {
  return async (...args) => {
    const start = Date.now();
    try {
      const result = await fn(...args);
      const duration = Date.now() - start;
      logger.performance(operation, duration);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      logger.error(`${operation} failed after ${duration}ms`, {}, error);
      throw error;
    }
  };
}

// Error boundary logging helper
export function logErrorBoundary(error, errorInfo, componentStack) {
  logger.error('React Error Boundary caught error', {
    errorMessage: error.message,
    componentStack,
    errorInfo,
  }, error);
}

export default logger;