'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, CheckCircle, XCircle, AlertTriangle, BarChart3, Wifi, User, RefreshCw } from 'lucide-react';

export function EnhancedAttendanceTab({ user, loading }) {
  const [attendanceData, setAttendanceData] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [userIP, setUserIP] = useState('');

  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch user IP and data on component mount
  useEffect(() => {
    fetchUserIP();
    fetchAttendanceData();
  }, []);

  const fetchUserIP = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      setUserIP(data.ip);
    } catch (error) {
      console.error('Error fetching IP:', error);
      setUserIP('Unable to detect');
    }
  };

  const fetchAttendanceData = async () => {
    try {
      setDataLoading(true);
      setError(null);
      
      const response = await fetch('/api/attendance/my-records');
      if (response.ok) {
        const data = await response.json();
        setAttendanceData(data.records || []);
        
        // Find today's attendance
        const today = new Date().toISOString().split('T')[0];
        const todayRecord = (data.records || []).find(record => record.date === today);
        setTodayAttendance(todayRecord);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch attendance data');
        setAttendanceData([]);
        setTodayAttendance(null);
      }
    } catch (err) {
      setError('Network error: ' + err.message);
      setAttendanceData([]);
      setTodayAttendance(null);
    } finally {
      setDataLoading(false);
    }
  };

  const handleAttendanceAction = async (action) => {
    try {
      setActionLoading(true);
      setError(null);
      setSuccess('');
      
      // Get location if available
      let location = null;
      if (navigator.geolocation) {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 5000,
              enableHighAccuracy: false
            });
          });
          location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          };
        } catch (geoError) {
          console.log('Location access denied or unavailable');
        }
      }

      // Get device info
      const deviceInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        screenResolution: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timestamp: new Date().toISOString()
      };

      const response = await fetch('/api/attendance/checkin-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action,
          clientIP: userIP,
          location,
          deviceInfo
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        const actionText = action === 'checkin' ? 'checked in' : 'checked out';
        setSuccess(`✅ Successfully ${actionText}! Time: ${new Date(data.timestamp).toLocaleTimeString()}`);
        
        // Immediately update today's attendance state
        const todayDate = new Date().toISOString().split('T')[0];
        
        if (action === 'checkin') {
          // Update with checkin info
          setTodayAttendance(prev => ({
            date: todayDate,
            checkinTime: data.timestamp,
            checkoutTime: prev?.checkoutTime || null,
            totalHours: prev?.totalHours || 0,
            status: 'partial'
          }));
        } else if (action === 'checkout') {
          // Update with checkout info
          setTodayAttendance(prev => ({
            date: todayDate,
            checkinTime: prev?.checkinTime || null,
            checkoutTime: data.timestamp,
            totalHours: data.todayStatus?.totalHours ? parseFloat(data.todayStatus.totalHours) : prev?.totalHours || 0,
            status: 'complete'
          }));
        }
        
        // Also update with API response data if available
        if (data.todayStatus) {
          setTodayAttendance(prev => ({
            date: todayDate,
            checkinTime: data.todayStatus.checkinTime || prev?.checkinTime,
            checkoutTime: data.todayStatus.checkoutTime || prev?.checkoutTime,
            totalHours: data.todayStatus.totalHours ? parseFloat(data.todayStatus.totalHours) : prev?.totalHours || 0,
            status: data.todayStatus.status || prev?.status
          }));
          
          // Debug logging
          console.log(`${action.toUpperCase()} Success:`, {
            action,
            hasCheckedIn: !!data.todayStatus.checkinTime,
            hasCheckedOut: !!data.todayStatus.checkoutTime,
            status: data.todayStatus.status,
            totalHours: data.todayStatus.totalHours
          });
        }
        
        // Clear success message after 5 seconds
        setTimeout(() => {
          setSuccess('');
        }, 5000);
        
        // Refresh the full data after a short delay
        setTimeout(() => {
          fetchAttendanceData();
        }, 1500);
      } else {
        if (data.code === 'ALREADY_CHECKED_IN') {
          setError('⚠️ You have already checked in today');
        } else if (data.code === 'ALREADY_CHECKED_OUT') {
          setError('⚠️ You have already checked out today');
          // Refresh data to ensure UI is in sync
          setTimeout(() => {
            fetchAttendanceData();
          }, 500);
        } else if (data.code === 'NO_CHECKIN_FOUND') {
          setError('⚠️ Please check in first before checking out');
        } else {
          setError(data.error || `Failed to ${action}. Please try again.`);
        }
      }
    } catch (err) {
      setError(`Network error: Failed to ${action}`);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      complete: { 
        color: 'bg-green-100 text-green-800 border-green-200', 
        icon: CheckCircle, 
        bgColor: 'bg-green-500',
        label: 'Complete Day'
      },
      partial: { 
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
        icon: Clock, 
        bgColor: 'bg-yellow-500',
        label: 'Partial Day'
      },
      none: { 
        color: 'bg-gray-100 text-gray-800 border-gray-200', 
        icon: XCircle, 
        bgColor: 'bg-gray-500',
        label: 'No Records'
      },
      present: { 
        color: 'bg-green-100 text-green-800 border-green-200', 
        icon: CheckCircle, 
        bgColor: 'bg-green-500',
        label: 'Present'
      },
      absent: { 
        color: 'bg-red-100 text-red-800 border-red-200', 
        icon: XCircle, 
        bgColor: 'bg-red-500',
        label: 'Absent'
      }
    };
    return configs[status] || configs.none;
  };

  if (loading || dataLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded-lg"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-6 rounded-xl shadow-sm">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl shadow-sm border border-blue-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Calendar className="w-6 h-6 text-blue-600" />
            Enhanced Attendance System
          </h2>
          <div className="text-right">
            <div className="text-2xl font-mono font-bold text-gray-900">
              {currentTime.toLocaleTimeString('en-US', { hour12: false })}
            </div>
            <div className="text-sm text-gray-500">
              {currentTime.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="flex items-center p-3 bg-white rounded-lg border">
            <Wifi className="w-5 h-5 text-blue-600 mr-3" />
            <div>
              <div className="text-xs text-gray-600">Your IP</div>
              <div className="font-mono text-sm font-medium">{userIP}</div>
            </div>
          </div>
          <div className="flex items-center p-3 bg-white rounded-lg border">
            <User className="w-5 h-5 text-green-600 mr-3" />
            <div>
              <div className="text-xs text-gray-600">User</div>
              <div className="font-medium text-sm">{user?.name || 'Unknown'}</div>
            </div>
          </div>
          <div className="flex items-center p-3 bg-white rounded-lg border">
            <BarChart3 className="w-5 h-5 text-purple-600 mr-3" />
            <div>
              <div className="text-xs text-gray-600">Total Records</div>
              <div className="font-bold text-lg">{attendanceData.length}</div>
            </div>
          </div>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <XCircle className="w-5 h-5 text-red-400 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-green-800">Success</h3>
                <p className="text-sm text-green-700 mt-1">{success}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Check-in/Check-out Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Today's Attendance
          </h3>
          <button
            onClick={fetchAttendanceData}
            disabled={dataLoading}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${dataLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Check In */}
          <div className={`text-center p-6 border-2 border-dashed rounded-xl transition-colors ${
            todayAttendance?.checkinTime 
              ? 'border-blue-300 bg-blue-50' 
              : 'border-gray-300 hover:border-blue-400'
          }`}>
            <div className="text-4xl mb-4">
              {todayAttendance?.checkinTime ? '✅' : '🕐'}
            </div>
            <h4 className="font-semibold text-gray-900 mb-4">Check In</h4>
            {todayAttendance?.checkinTime ? (
              <div className="space-y-3">
                <p className="text-xl font-bold text-blue-600">
                  {new Date(todayAttendance.checkinTime).toLocaleTimeString()}
                </p>
                <p className="text-sm text-blue-700 font-medium">✓ Checked in successfully</p>
                <div className="text-xs text-blue-600 bg-blue-100 px-3 py-2 rounded-full">
                  {new Date(todayAttendance.checkinTime).toLocaleDateString()}
                </div>
                {todayAttendance?.checkoutTime ? (
                  <div className="mt-3 p-3 bg-white rounded-lg border border-blue-200">
                    <div className="text-xs text-gray-600 mb-1">Work session completed</div>
                    <div className="font-semibold text-blue-800">
                      Duration: {todayAttendance.totalHours || 0}h
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 p-3 bg-white rounded-lg border border-blue-200">
                    <div className="text-xs text-gray-600 mb-1">Currently working</div>
                    <div className="font-semibold text-blue-800">
                      Remember to check out when leaving
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => handleAttendanceAction('checkin')}
                disabled={actionLoading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all transform hover:scale-105 active:scale-95 font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {actionLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  'Check In Now'
                )}
              </button>
            )}
          </div>

          {/* Check Out */}
          <div className={`text-center p-6 border-2 border-dashed rounded-xl transition-colors ${
            todayAttendance?.checkoutTime 
              ? 'border-green-300 bg-green-50' 
              : todayAttendance?.checkinTime 
                ? 'border-gray-300 hover:border-red-400' 
                : 'border-gray-200 bg-gray-50'
          }`}>
            <div className="text-4xl mb-4">
              {todayAttendance?.checkoutTime ? '✅' : '🕕'}
            </div>
            <h4 className="font-semibold text-gray-900 mb-4">Check Out</h4>
            {todayAttendance?.checkoutTime ? (
              <div className="space-y-3">
                <p className="text-xl font-bold text-green-600">
                  {new Date(todayAttendance.checkoutTime).toLocaleTimeString()}
                </p>
                <p className="text-sm text-green-700 font-medium">✓ Checked out successfully</p>
                <div className="text-xs text-green-600 bg-green-100 px-3 py-2 rounded-full">
                  {new Date(todayAttendance.checkoutTime).toLocaleDateString()}
                </div>
                <div className="mt-3 p-3 bg-white rounded-lg border border-green-200">
                  <div className="text-xs text-gray-600 mb-1">Work completed for today</div>
                  <div className="font-semibold text-green-800">
                    Total Hours: {todayAttendance.totalHours || 0}h
                  </div>
                </div>
              </div>
            ) : todayAttendance?.checkinTime ? (
              <button
                onClick={() => handleAttendanceAction('checkout')}
                disabled={actionLoading}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all transform hover:scale-105 active:scale-95 font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {actionLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  'Check Out Now'
                )}
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-gray-500">Please check in first</p>
                <div className="text-xs text-gray-400">You need to check in before you can check out</div>
              </div>
            )}
          </div>
        </div>

        {/* Today's Summary */}
        {todayAttendance && (
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
            <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Today's Summary
            </h5>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-white p-3 rounded-lg">
                <span className="text-gray-600 block">Check In</span>
                <span className="font-semibold">
                  {todayAttendance.checkinTime ? 
                    new Date(todayAttendance.checkinTime).toLocaleTimeString() : 
                    'Not yet'
                  }
                </span>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <span className="text-gray-600 block">Check Out</span>
                <span className="font-semibold">
                  {todayAttendance.checkoutTime ? 
                    new Date(todayAttendance.checkoutTime).toLocaleTimeString() : 
                    'Not yet'
                  }
                </span>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <span className="text-gray-600 block">Hours</span>
                <span className="font-semibold">{todayAttendance.totalHours || 0}h</span>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <span className="text-gray-600 block">Status</span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusConfig(todayAttendance.status).color}`}>
                  {getStatusConfig(todayAttendance.status).label}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Days</p>
              <p className="text-2xl font-semibold text-gray-900">{attendanceData.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Complete Days</p>
              <p className="text-2xl font-semibold text-gray-900">
                {attendanceData.filter(record => record.status === 'complete').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Partial Days</p>
              <p className="text-2xl font-semibold text-gray-900">
                {attendanceData.filter(record => record.status === 'partial').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Hours</p>
              <p className="text-2xl font-semibold text-gray-900">
                {attendanceData.reduce((total, record) => total + (record.totalHours || 0), 0).toFixed(1)}h
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Attendance History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Recent Attendance History
          </h3>
        </div>
        <div className="p-6">
          {attendanceData.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Attendance Records</h3>
              <p className="text-gray-500">Your attendance history will appear here once you start marking attendance.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {attendanceData.slice(0, 10).map((record, index) => (
                <div key={record._id || index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-lg ${getStatusConfig(record.status).bgColor}`}>
                      {React.createElement(getStatusConfig(record.status).icon, {
                        className: "w-4 h-4 text-white"
                      })}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {new Date(record.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                      <div className="text-sm text-gray-500">
                        {record.checkinTime && `In: ${new Date(record.checkinTime).toLocaleTimeString()}`}
                        {record.checkinTime && record.checkoutTime && ' • '}
                        {record.checkoutTime && `Out: ${new Date(record.checkoutTime).toLocaleTimeString()}`}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusConfig(record.status).color}`}>
                      {getStatusConfig(record.status).label}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {record.totalHours > 0 ? `${record.totalHours}h` : 'No hours'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}