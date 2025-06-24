/**
 * Comprehensive Attendance Logic Validator
 * Provides centralized validation logic for all attendance operations
 */

export class AttendanceValidator {
  constructor() {
    this.rules = {
      // Time-based rules
      MIN_WORK_SESSION: 15 * 60 * 1000, // 15 minutes minimum
      MAX_WORK_SESSION: 16 * 60 * 60 * 1000, // 16 hours maximum
      DAILY_COOLDOWN: 24 * 60 * 60 * 1000, // 24 hours between same actions
      
      // Business rules
      ALLOW_SAME_DAY_MULTIPLE_SESSIONS: false,
      REQUIRE_SEQUENTIAL_ACTIONS: true, // checkin before checkout
      VALIDATE_WORKING_HOURS: false, // validate against business hours
      
      // Data validation
      REQUIRED_FIELDS: ['userId', 'action', 'timestamp'],
      VALID_ACTIONS: ['checkin', 'checkout'],
      VALID_STATUSES: ['none', 'partial', 'complete']
    };
  }

  /**
   * Validate a new attendance action
   * @param {Object} params - Validation parameters
   * @returns {Object} Validation result
   */
  validateAction(params) {
    const {
      action,
      todayAttendance,
      userIP,
      timestamp = new Date(),
      authorizedIPs = []
    } = params;

    const result = {
      valid: false,
      errors: [],
      warnings: [],
      data: {}
    };

    try {
      // Basic parameter validation
      const basicValidation = this._validateBasicParams(action, userIP);
      if (!basicValidation.valid) {
        result.errors = [...result.errors, ...basicValidation.errors];
        return result;
      }

      // IP validation
      const ipValidation = this._validateIP(userIP, authorizedIPs);
      if (!ipValidation.valid) {
        result.errors = [...result.errors, ...ipValidation.errors];
        return result;
      }

      // Action sequence validation
      const sequenceValidation = this._validateActionSequence(action, todayAttendance);
      if (!sequenceValidation.valid) {
        result.errors = [...result.errors, ...sequenceValidation.errors];
        return result;
      }

      // Time validation
      const timeValidation = this._validateTiming(action, todayAttendance, timestamp);
      if (!timeValidation.valid) {
        result.errors = [...result.errors, ...timeValidation.errors];
        result.warnings = [...result.warnings, ...timeValidation.warnings];
      }

      // If we get here, validation passed
      result.valid = result.errors.length === 0;
      result.data = {
        action,
        timestamp,
        expectedStatus: this._calculateExpectedStatus(action, todayAttendance),
        workingHours: this._calculateWorkingHours(action, todayAttendance, timestamp)
      };

      return result;

    } catch (error) {
      result.errors.push(`Validation error: ${error.message}`);
      return result;
    }
  }

  /**
   * Validate attendance data integrity
   * @param {Array} attendanceRecords - All attendance records for validation
   * @returns {Object} Data integrity report
   */
  validateDataIntegrity(attendanceRecords) {
    const report = {
      valid: true,
      issues: [],
      statistics: {},
      recommendations: []
    };

    try {
      // Group records by date
      const recordsByDate = this._groupRecordsByDate(attendanceRecords);
      
      // Check each day for issues
      Object.entries(recordsByDate).forEach(([date, records]) => {
        const dayValidation = this._validateDayRecords(date, records);
        if (!dayValidation.valid) {
          report.issues.push(...dayValidation.issues);
          report.valid = false;
        }
      });

      // Calculate statistics
      report.statistics = this._calculateStatistics(recordsByDate);

      // Generate recommendations
      report.recommendations = this._generateRecommendations(report.statistics, report.issues);

      return report;

    } catch (error) {
      report.valid = false;
      report.issues.push(`Data integrity check failed: ${error.message}`);
      return report;
    }
  }

  /**
   * Validate IP address against authorized list
   * @private
   */
  _validateIP(userIP, authorizedIPs) {
    const result = { valid: true, errors: [] };

    if (!userIP || userIP === 'Unable to detect') {
      result.valid = false;
      result.errors.push('IP_DETECTION_FAILED: Unable to detect your IP address');
      return result;
    }

    // Skip IP validation in development
    if (process.env.NODE_ENV === 'development') {
      return result;
    }

    if (authorizedIPs.length > 0 && !authorizedIPs.includes(userIP)) {
      result.valid = false;
      result.errors.push(`UNAUTHORIZED_IP: IP ${userIP} is not authorized for attendance`);
      return result;
    }

    return result;
  }

  /**
   * Validate basic parameters
   * @private
   */
  _validateBasicParams(action, userIP) {
    const result = { valid: true, errors: [] };

    if (!action) {
      result.errors.push('MISSING_ACTION: Action is required');
    } else if (!this.rules.VALID_ACTIONS.includes(action)) {
      result.errors.push(`INVALID_ACTION: Action must be one of ${this.rules.VALID_ACTIONS.join(', ')}`);
    }

    if (!userIP) {
      result.errors.push('MISSING_IP: User IP is required');
    }

    result.valid = result.errors.length === 0;
    return result;
  }

  /**
   * Validate action sequence (checkin before checkout)
   * @private
   */
  _validateActionSequence(action, todayAttendance) {
    const result = { valid: true, errors: [] };

    const hasCheckedIn = todayAttendance?.checkinTime;
    const hasCheckedOut = todayAttendance?.checkoutTime;

    if (action === 'checkin') {
      if (hasCheckedIn) {
        result.valid = false;
        result.errors.push('ALREADY_CHECKED_IN: You have already checked in today');
      }
    } else if (action === 'checkout') {
      if (!hasCheckedIn) {
        result.valid = false;
        result.errors.push('NO_CHECKIN_FOUND: You must check in before checking out');
      } else if (hasCheckedOut) {
        result.valid = false;
        result.errors.push('ALREADY_CHECKED_OUT: You have already checked out today');
      }
    }

    return result;
  }

  /**
   * Validate timing constraints
   * @private
   */
  _validateTiming(action, todayAttendance, timestamp) {
    const result = { valid: true, errors: [], warnings: [] };

    if (action === 'checkout' && todayAttendance?.checkinTime) {
      const checkinTime = new Date(todayAttendance.checkinTime);
      const checkoutTime = new Date(timestamp);
      const sessionDuration = checkoutTime - checkinTime;

      // Check minimum work session
      if (sessionDuration < this.rules.MIN_WORK_SESSION) {
        result.warnings.push(`SHORT_SESSION: Work session is less than ${this.rules.MIN_WORK_SESSION / 60000} minutes`);
      }

      // Check maximum work session
      if (sessionDuration > this.rules.MAX_WORK_SESSION) {
        result.warnings.push(`LONG_SESSION: Work session exceeds ${this.rules.MAX_WORK_SESSION / 3600000} hours`);
      }

      // Check for negative duration (shouldn't happen, but good to check)
      if (sessionDuration < 0) {
        result.valid = false;
        result.errors.push('INVALID_TIMING: Checkout time cannot be before checkin time');
      }
    }

    return result;
  }

  /**
   * Calculate expected status after action
   * @private
   */
  _calculateExpectedStatus(action, todayAttendance) {
    const hasCheckedIn = todayAttendance?.checkinTime;
    const hasCheckedOut = todayAttendance?.checkoutTime;

    if (action === 'checkin') {
      return hasCheckedOut ? 'complete' : 'partial';
    } else if (action === 'checkout') {
      return hasCheckedIn ? 'complete' : 'none';
    }

    return 'none';
  }

  /**
   * Calculate working hours
   * @private
   */
  _calculateWorkingHours(action, todayAttendance, timestamp) {
    if (action === 'checkout' && todayAttendance?.checkinTime) {
      const checkinTime = new Date(todayAttendance.checkinTime);
      const checkoutTime = new Date(timestamp);
      const diffMs = checkoutTime - checkinTime;
      return Math.max(0, diffMs / (1000 * 60 * 60)); // Convert to hours
    }
    return 0;
  }

  /**
   * Group records by date
   * @private
   */
  _groupRecordsByDate(records) {
    const grouped = {};
    records.forEach(record => {
      const date = record.date || new Date(record.timestamp).toISOString().split('T')[0];
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(record);
    });
    return grouped;
  }

  /**
   * Validate day records for inconsistencies
   * @private
   */
  _validateDayRecords(date, records) {
    const result = { valid: true, issues: [] };

    // Sort records by timestamp
    const sortedRecords = records.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    let expectingCheckout = false;
    let checkinCount = 0;
    let checkoutCount = 0;

    for (const record of sortedRecords) {
      if (record.action === 'checkin') {
        checkinCount++;
        if (expectingCheckout) {
          result.issues.push({
            date,
            type: 'SEQUENCE_ERROR',
            message: 'Multiple check-ins without checkout',
            recordId: record._id
          });
          result.valid = false;
        }
        expectingCheckout = true;
      } else if (record.action === 'checkout') {
        checkoutCount++;
        if (!expectingCheckout) {
          result.issues.push({
            date,
            type: 'SEQUENCE_ERROR', 
            message: 'Checkout without prior checkin',
            recordId: record._id
          });
          result.valid = false;
        }
        expectingCheckout = false;
      }
    }

    // Check for unmatched actions
    if (checkinCount > checkoutCount + 1) {
      result.issues.push({
        date,
        type: 'UNMATCHED_CHECKIN',
        message: `Too many checkins (${checkinCount}) vs checkouts (${checkoutCount})`
      });
    }

    if (checkoutCount > checkinCount) {
      result.issues.push({
        date,
        type: 'UNMATCHED_CHECKOUT',
        message: `More checkouts (${checkoutCount}) than checkins (${checkinCount})`
      });
      result.valid = false;
    }

    return result;
  }

  /**
   * Calculate comprehensive statistics
   * @private
   */
  _calculateStatistics(recordsByDate) {
    const dates = Object.keys(recordsByDate);
    let totalHours = 0;
    let completeDays = 0;
    let partialDays = 0;

    dates.forEach(date => {
      const records = recordsByDate[date];
      const checkinRecord = records.find(r => r.action === 'checkin');
      const checkoutRecord = records.find(r => r.action === 'checkout');

      if (checkinRecord && checkoutRecord) {
        completeDays++;
        const hours = (new Date(checkoutRecord.timestamp) - new Date(checkinRecord.timestamp)) / (1000 * 60 * 60);
        totalHours += Math.max(0, hours);
      } else if (checkinRecord) {
        partialDays++;
      }
    });

    return {
      totalDays: dates.length,
      completeDays,
      partialDays,
      totalHours: Math.round(totalHours * 10) / 10,
      averageHours: completeDays > 0 ? Math.round((totalHours / completeDays) * 10) / 10 : 0,
      attendanceRate: dates.length > 0 ? Math.round(((completeDays + partialDays) / dates.length) * 100) : 0
    };
  }

  /**
   * Generate recommendations based on data analysis
   * @private
   */
  _generateRecommendations(statistics, issues) {
    const recommendations = [];

    if (statistics.averageHours < 4) {
      recommendations.push({
        type: 'LOW_HOURS',
        message: 'Consider increasing daily work hours for better productivity',
        priority: 'medium'
      });
    }

    if (statistics.attendanceRate < 80) {
      recommendations.push({
        type: 'LOW_ATTENDANCE',
        message: 'Attendance rate is below 80%. Try to maintain consistent attendance',
        priority: 'high'
      });
    }

    if (issues.filter(i => i.type === 'SEQUENCE_ERROR').length > 0) {
      recommendations.push({
        type: 'SEQUENCE_ISSUES',
        message: 'Multiple sequence errors detected. Ensure proper check-in/check-out flow',
        priority: 'high'
      });
    }

    return recommendations;
  }

  /**
   * Get validation summary for display
   */
  getValidationSummary(attendanceRecords) {
    const integrity = this.validateDataIntegrity(attendanceRecords);
    const statistics = integrity.statistics;

    return {
      status: integrity.valid ? 'healthy' : 'issues-detected',
      summary: {
        totalRecords: attendanceRecords.length,
        dataQuality: integrity.valid ? 'Good' : 'Needs Attention',
        attendanceRate: `${statistics.attendanceRate}%`,
        totalHours: `${statistics.totalHours}h`,
        avgHours: `${statistics.averageHours}h/day`
      },
      issues: integrity.issues,
      recommendations: integrity.recommendations
    };
  }
}

// Export singleton instance
export const attendanceValidator = new AttendanceValidator();