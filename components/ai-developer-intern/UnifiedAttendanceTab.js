'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, MapPin, CheckCircle, XCircle, AlertTriangle, BarChart3, 
  Wifi, User, RefreshCw, Filter, Download, Search, TrendingUp, 
  Calendar as CalendarIcon, Activity, Timer, Target 
} from 'lucide-react';

export function UnifiedAttendanceTab({ user, loading }) {
  // State Management
  const [attendanceData, setAttendanceData] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [userIP, setUserIP] = useState('');
  
  // History & Filter State
  const [historyFilter, setHistoryFilter] = useState('all'); // all, this-week, this-month, custom
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('combined'); // combined, today-only, history-only

  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-clear messages
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
    if (error) {
      const timer = setTimeout(() => setError(''), 8000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  // Fetch data on component mount
  useEffect(() => {
    fetchUserIP();
    fetchAttendanceData();
  }, []);

  // Re-fetch when date range changes
  useEffect(() => {
    if (historyFilter === 'custom') {
      fetchAttendanceData();
    }
  }, [dateRange]);

  const fetchUserIP = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      setUserIP(data.ip);
    } catch (error) {
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
        
        // Only update if we don't have current data, or if the new data is more complete
        setTodayAttendance(prev => {
          if (!prev) {
            // No previous data, use the new data
            return todayRecord;
          }
          
          if (!todayRecord) {
            // No new data, keep existing
            return prev;
          }
          
          // Merge data, preserving existing state for consistency
          const merged = {
            date: today,
            checkinTime: prev.checkinTime || todayRecord.checkinTime,
            checkoutTime: prev.checkoutTime || todayRecord.checkoutTime,
            totalHours: prev.totalHours || todayRecord.totalHours || 0,
            status: prev.status || todayRecord.status || 'none'
          };
          

          
          return merged;
        });
        

      } else {
        const errorData = await response.json();
        setError(`Failed to load data: ${errorData.error || 'Unknown error'}`);
        setAttendanceData([]);
        setTodayAttendance(null);
      }
    } catch (err) {
      setError(`Network error: ${err.message}`);
      setAttendanceData([]);
      setTodayAttendance(null);
    } finally {
      setDataLoading(false);
    }
  };

  const refreshData = async () => {
    await fetchAttendanceData();
  };

  const handleAttendanceAction = async (action) => {
    // Pre-flight checks
    if (actionLoading) {
      return;
    }

    if (!userIP || userIP === 'Unable to detect') {
      setError('❌ Unable to detect your IP address. Please check your internet connection.');
      return;
    }

    // Logic validation
    const hasCheckedIn = todayAttendance?.checkinTime;
    const hasCheckedOut = todayAttendance?.checkoutTime;



    if (action === 'checkin' && hasCheckedIn) {
      setError('⚠️ You have already checked in today');
      return;
    }

    if (action === 'checkout' && hasCheckedOut) {
      setError('⚠️ You have already checked out today');
      return;
    }

    if (action === 'checkout' && !hasCheckedIn) {
      setError('⚠️ Please check in first before checking out');
      return;
    }

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
        
        // Immediate state update with comprehensive logic
        const todayDate = new Date().toISOString().split('T')[0];
        
        if (action === 'checkin') {
          // Check-in logic
          setTodayAttendance(prev => {
            const updated = {
              date: todayDate,
              checkinTime: data.timestamp,
              checkoutTime: prev?.checkoutTime || null,
              totalHours: prev?.totalHours || 0,
              status: 'partial'
            };

            return updated;
          });
        } else if (action === 'checkout') {
          // Check-out logic - immediate state update
          setTodayAttendance(prev => {
            const checkinTime = prev?.checkinTime || null;
            const checkoutTime = data.timestamp;
            
            // Calculate hours if both times exist
            let totalHours = 0;
            if (checkinTime && checkoutTime) {
              const diffMs = new Date(checkoutTime) - new Date(checkinTime);
              totalHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
            }
            
            const updated = {
              date: todayDate,
              checkinTime: checkinTime,
              checkoutTime: checkoutTime,
              totalHours: data.todayStatus?.totalHours ? parseFloat(data.todayStatus.totalHours) : totalHours,
              status: 'complete'
            };

            return updated;
          });
          

        }
        
        // Also update with API response data if available
        if (data.todayStatus) {
          setTodayAttendance(prev => {
            const apiUpdated = {
              date: todayDate,
              checkinTime: data.todayStatus.checkinTime || prev?.checkinTime,
              checkoutTime: data.todayStatus.checkoutTime || prev?.checkoutTime,
              totalHours: data.todayStatus.totalHours ? parseFloat(data.todayStatus.totalHours) : prev?.totalHours || 0,
              status: data.todayStatus.status || prev?.status
            };

            return apiUpdated;
          });
          

        }
        
        // Don't automatically refresh - let the immediate state update persist

      } else {
        // Handle specific error codes
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
      setError(`Network error: Failed to ${action}. Please check your connection.`);
    } finally {
      setActionLoading(false);
    }
  };

  // Filter and process attendance data
  const getFilteredAttendanceData = () => {
    let filtered = attendanceData;

    // Apply date filter
    if (historyFilter === 'this-week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      filtered = filtered.filter(record => new Date(record.date) >= weekAgo);
    } else if (historyFilter === 'this-month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      filtered = filtered.filter(record => new Date(record.date) >= monthAgo);
    } else if (historyFilter === 'custom') {
      filtered = filtered.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate >= new Date(dateRange.start) && recordDate <= new Date(dateRange.end);
      });
    }

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(record => 
        record.date.includes(searchQuery) ||
        record.status?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  // Calculate comprehensive statistics
  const calculateStats = () => {
    const data = getFilteredAttendanceData();
    
    const totalDays = data.length;
    const completeDays = data.filter(r => r.status === 'complete').length;
    const partialDays = data.filter(r => r.status === 'partial').length;
    const presentDays = completeDays + partialDays;
    const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
    
    const totalHours = data.reduce((sum, record) => sum + (record.totalHours || 0), 0);
    const avgHours = presentDays > 0 ? totalHours / presentDays : 0;
    
    const currentStreak = calculateCurrentStreak(data);
    const longestStreak = calculateLongestStreak(data);

    return {
      totalDays,
      presentDays,
      completeDays,
      partialDays,
      attendanceRate,
      totalHours: Math.round(totalHours * 10) / 10,
      avgHours: Math.round(avgHours * 10) / 10,
      currentStreak,
      longestStreak
    };
  };

  const calculateCurrentStreak = (data) => {
    let streak = 0;
    const sortedData = data.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    for (const record of sortedData) {
      if (record.status === 'complete' || record.status === 'partial') {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  const calculateLongestStreak = (data) => {
    let longest = 0;
    let current = 0;
    const sortedData = data.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    for (const record of sortedData) {
      if (record.status === 'complete' || record.status === 'partial') {
        current++;
        longest = Math.max(longest, current);
      } else {
        current = 0;
      }
    }
    return longest;
  };

  const getStatusConfig = (status) => {
    const configs = {
      complete: { 
        color: 'bg-green-100 text-green-800 border-green-200', 
        icon: CheckCircle, 
        bgColor: 'bg-green-500',
        label: 'Complete'
      },
      partial: { 
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
        icon: Clock, 
        bgColor: 'bg-yellow-500',
        label: 'Partial'
      },
      none: { 
        color: 'bg-gray-100 text-gray-800 border-gray-200', 
        icon: XCircle, 
        bgColor: 'bg-gray-500',
        label: 'None'
      }
    };
    return configs[status] || configs.none;
  };

  const exportAttendanceData = () => {
    const data = getFilteredAttendanceData();
    const csvContent = [
      ['Date', 'Check In', 'Check Out', 'Total Hours', 'Status'],
      ...data.map(record => [
        record.date,
        record.checkinTime ? new Date(record.checkinTime).toLocaleTimeString() : 'N/A',
        record.checkoutTime ? new Date(record.checkoutTime).toLocaleTimeString() : 'N/A',
        record.totalHours || 0,
        record.status || 'N/A'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `attendance-${user?.name || 'data'}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    
    setSuccess('📄 Attendance data exported successfully!');
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

  const stats = calculateStats();
  const filteredData = getFilteredAttendanceData();

  return (
    <div className="space-y-6">
      {/* Header with View Mode Toggle */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl shadow-sm border border-blue-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <CalendarIcon className="w-6 h-6 text-blue-600" />
            Unified Attendance System
          </h2>
          <div className="flex items-center gap-4">
            {/* View Mode Toggle */}
            <div className="flex bg-white rounded-lg p-1 shadow-sm">
              {[
                { id: 'combined', label: 'All', icon: Activity },
                { id: 'today-only', label: 'Today', icon: Clock },
                { id: 'history-only', label: 'History', icon: BarChart3 }
              ].map(mode => (
                <button
                  key={mode.id}
                  onClick={() => setViewMode(mode.id)}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === mode.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <mode.icon className="w-4 h-4 mr-1" />
                  {mode.label}
                </button>
              ))}
            </div>
            
            {/* Current Time */}
            <div className="text-right">
              <div className="text-2xl font-mono font-bold text-gray-900">
                {currentTime.toLocaleTimeString('en-US', { hour12: false })}
              </div>
              <div className="text-sm text-gray-500">
                {currentTime.toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          </div>
        </div>

        {/* System Status & User Info */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="flex items-center p-3 bg-white rounded-lg border">
            <Wifi className="w-5 h-5 text-blue-600 mr-3" />
            <div>
              <div className="text-xs text-gray-600">Your IP</div>
              <div className="font-mono text-sm font-medium truncate">{userIP}</div>
            </div>
          </div>
          <div className="flex items-center p-3 bg-white rounded-lg border">
            <User className="w-5 h-5 text-green-600 mr-3" />
            <div>
              <div className="text-xs text-gray-600">User</div>
              <div className="font-medium text-sm truncate">{user?.name || 'Unknown'}</div>
            </div>
          </div>
          <div className="flex items-center p-3 bg-white rounded-lg border">
            <Target className="w-5 h-5 text-purple-600 mr-3" />
            <div>
              <div className="text-xs text-gray-600">Attendance Rate</div>
              <div className="font-bold text-lg">{stats.attendanceRate}%</div>
            </div>
          </div>
          <div className="flex items-center p-3 bg-white rounded-lg border">
            <TrendingUp className="w-5 h-5 text-orange-600 mr-3" />
            <div>
              <div className="text-xs text-gray-600">Current Streak</div>
              <div className="font-bold text-lg">{stats.currentStreak} days</div>
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

      {/* Today's Attendance Section - Show if combined or today-only mode */}
      {(viewMode === 'combined' || viewMode === 'today-only') && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Today's Attendance
            </h3>
            <button
              onClick={refreshData}
              disabled={dataLoading}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Refresh attendance data"
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
      )}

      {/* Statistics Cards - Show if combined or history-only mode */}
      {(viewMode === 'combined' || viewMode === 'history-only') && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CalendarIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Days</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalDays}</p>
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
                <p className="text-2xl font-semibold text-gray-900">{stats.completeDays}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Timer className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Hours</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalHours}h</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Hours/Day</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.avgHours}h</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attendance History - Show if combined or history-only mode */}
      {(viewMode === 'combined' || viewMode === 'history-only') && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          {/* History Header with Filters */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Attendance History ({filteredData.length} records)
              </h3>
              
              <div className="flex items-center gap-3">
                {/* Time Range Filter */}
                <select
                  value={historyFilter}
                  onChange={(e) => setHistoryFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Time</option>
                  <option value="this-week">This Week</option>
                  <option value="this-month">This Month</option>
                  <option value="custom">Custom Range</option>
                </select>

                {/* Search */}
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Export Button */}
                <button
                  onClick={exportAttendanceData}
                  className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </button>
              </div>
            </div>

            {/* Custom Date Range */}
            {historyFilter === 'custom' && (
              <div className="mt-4 flex items-center gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* History Content */}
          <div className="p-6">
            {filteredData.length === 0 ? (
              <div className="text-center py-8">
                <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Records Found</h3>
                <p className="text-gray-500">
                  {searchQuery 
                    ? `No attendance records match "${searchQuery}"`
                    : "Your attendance history will appear here once you start marking attendance."
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredData.map((record, index) => (
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
      )}
    </div>
  );
}