'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar, Clock, MapPin, Wifi, WifiOff, CheckCircle, XCircle, AlertTriangle, BarChart3, TrendingUp, Download, Filter, Search } from 'lucide-react';

// Mock AttendanceMarker component for demo
const AttendanceMarker = ({ onAttendanceMarked }) => (
  <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-lg text-white">
    <h3 className="font-semibold mb-2">Quick Actions</h3>
    <button 
      onClick={onAttendanceMarked}
      className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg hover:bg-white/30 transition-all"
    >
      Refresh Data
    </button>
  </div>
);

export function AttendanceTab({ user, loading }) {
  const [attendanceData, setAttendanceData] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isOnAllowedNetwork, setIsOnAllowedNetwork] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [networkStatus, setNetworkStatus] = useState('checking');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showNetworkDetails, setShowNetworkDetails] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch real attendance data and network status
  useEffect(() => {
    fetchAttendanceData();
    detectLocationAndNetwork();
  }, []);

  const addNotification = useCallback((type, message) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, type, message, timestamp: new Date() }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  }, []);

  const fetchAttendanceData = useCallback(async () => {
    try {
      const response = await fetch('/api/attendance/my-records');
      if (response.ok) {
        const data = await response.json();
        setAttendanceData(data.records || []);
        // Set today's attendance
        const today = new Date().toISOString().split('T')[0];
        const todayRecord = (data.records || []).find(record => record.date === today);
        setTodayAttendance(todayRecord);
      } else {
        setAttendanceData([]);
        setTodayAttendance(null);
        addNotification('error', 'Failed to fetch attendance data');
      }
    } catch (error) {
      setAttendanceData([]);
      setTodayAttendance(null);
      addNotification('error', 'Failed to fetch attendance data');
    }
  }, [addNotification]);

  const detectLocationAndNetwork = useCallback(async () => {
    setNetworkStatus('checking');
    try {
      // Fetch allowed IPs and current IP from backend
      const ipRes = await fetch('/api/attendance/summary');
      if (ipRes.ok) {
        const data = await ipRes.json();
        setCurrentLocation(data.location || null);
        setIsOnAllowedNetwork(data.isAllowed || false);
        setNetworkStatus(data.isAllowed ? 'connected' : 'not-allowed');
        if (!data.isAllowed) {
          addNotification('warning', 'You are not on an approved network. Attendance marking is disabled.');
        }
      } else {
        setNetworkStatus('error');
        addNotification('error', 'Failed to detect network location.');
      }
    } catch (error) {
      setNetworkStatus('error');
      addNotification('error', 'Failed to detect network location.');
    }
  }, [addNotification]);

  const handleCheckIn = async () => {
    if (!isOnAllowedNetwork) {
      addNotification('error', 'Check-in only allowed from approved networks');
      return;
    }
    try {
      const response = await fetch('/api/attendance/checkin-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'checkin' })
      });
      if (response.ok) {
        addNotification('success', 'Successfully checked in!');
        fetchAttendanceData();
      } else {
        addNotification('error', 'Failed to check in. Please try again.');
      }
    } catch (error) {
      addNotification('error', 'Failed to check in. Please try again.');
    }
  };

  const handleCheckOut = async () => {
    if (!isOnAllowedNetwork) {
      addNotification('error', 'Check-out only allowed from approved networks');
      return;
    }
    try {
      const response = await fetch('/api/attendance/checkin-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'checkout' })
      });
      if (response.ok) {
        addNotification('success', 'Successfully checked out!');
        fetchAttendanceData();
      } else {
        addNotification('error', 'Failed to check out. Please try again.');
      }
    } catch (error) {
      addNotification('error', 'Failed to check out. Please try again.');
    }
  };

  // Enhanced filtering and search
  const filteredAttendanceData = useMemo(() => {
    return attendanceData.filter(record => {
      const matchesSearch = !searchTerm || 
        record.date.includes(searchTerm) ||
        record.location?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [attendanceData, searchTerm, statusFilter]);

  // Enhanced statistics
  const statistics = useMemo(() => {
    const totalDays = attendanceData.length;
    const presentDays = attendanceData.filter(record => record.status === 'present').length;
    const lateDays = attendanceData.filter(record => record.status === 'late').length;
    const absentDays = attendanceData.filter(record => record.status === 'absent').length;
    const halfDays = attendanceData.filter(record => record.status === 'half-day').length;
    return { totalDays, presentDays, lateDays, absentDays, halfDays };
  }, [attendanceData]);

  const getStatusConfig = (status) => {
    const configs = {
      present: { 
        color: 'bg-green-100 text-green-800 border-green-200', 
        icon: CheckCircle, 
        bgColor: 'bg-green-500' 
      },
      absent: { 
        color: 'bg-red-100 text-red-800 border-red-200', 
        icon: XCircle, 
        bgColor: 'bg-red-500' 
      },
      'half-day': { 
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
        icon: AlertTriangle, 
        bgColor: 'bg-yellow-500' 
      },
      late: { 
        color: 'bg-orange-100 text-orange-800 border-orange-200', 
        icon: Clock, 
        bgColor: 'bg-orange-500' 
      }
    };
    return configs[status] || configs.present;
  };

  if (loading) {
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
      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {notifications.map(notification => (
            <div
              key={notification.id}
              className={`p-4 rounded-lg shadow-lg border-l-4 bg-white ${
                notification.type === 'success' ? 'border-green-500' :
                notification.type === 'warning' ? 'border-yellow-500' :
                'border-red-500'
              } animate-slide-in`}
            >
              <p className="text-sm font-medium">{notification.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* Attendance Marker */}
      <AttendanceMarker onAttendanceMarked={fetchAttendanceData} />

      {/* Real-time Check In/Out Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Today's Attendance
          </h3>
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
        
        {/* Enhanced Network Status */}
        <div className="mb-6 p-4 bg-gray-50 rounded-xl border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {networkStatus === 'connected' ? (
                <Wifi className="w-5 h-5 text-green-600" />
              ) : (
                <WifiOff className="w-5 h-5 text-red-600" />
              )}
              <div>
                <p className="font-medium text-gray-900">Network Status</p>
                <p className="text-sm text-gray-600">
                  {currentLocation?.networkName} | {currentLocation?.location}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`px-3 py-1 rounded-full text-sm font-medium border ${
                isOnAllowedNetwork 
                  ? 'bg-green-100 text-green-800 border-green-200' 
                  : 'bg-red-100 text-red-800 border-red-200'
              }`}>
                {isOnAllowedNetwork ? '✅ Approved Network' : '❌ Restricted Network'}
              </div>
              <button
                onClick={() => setShowNetworkDetails(!showNetworkDetails)}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <MapPin className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {showNetworkDetails && (
            <div className="mt-3 pt-3 border-t border-gray-200 text-sm text-gray-600 grid grid-cols-2 gap-4">
              <div>IP Address: {currentLocation?.ip}</div>
              <div>Signal: {currentLocation?.signal}</div>
              <div>Security: {currentLocation?.security}</div>
              <div>Coordinates: {currentLocation?.coordinates?.lat}, {currentLocation?.coordinates?.lng}</div>
            </div>
          )}
        </div>

        {/* Enhanced Check In/Out Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 transition-colors">
            <div className="text-3xl mb-3">🕐</div>
            <h4 className="font-semibold text-gray-900 mb-3">Check In</h4>
            {todayAttendance?.checkIn ? (
              <div className="space-y-2">
                <p className="text-xl font-bold text-green-600">{todayAttendance.checkIn}</p>
                <p className="text-sm text-gray-500">✓ Already checked in</p>
                {todayAttendance.status === 'late' && (
                  <p className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                    Late arrival noted
                  </p>
                )}
              </div>
            ) : (
              <button
                onClick={handleCheckIn}
                disabled={!isOnAllowedNetwork || networkStatus !== 'connected'}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95"
              >
                Check In Now
              </button>
            )}
          </div>

          <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-red-400 transition-colors">
            <div className="text-3xl mb-3">🕕</div>
            <h4 className="font-semibold text-gray-900 mb-3">Check Out</h4>
            {todayAttendance?.checkOut ? (
              <div className="space-y-2">
                <p className="text-xl font-bold text-red-600">{todayAttendance.checkOut}</p>
                <p className="text-sm text-gray-500">✓ Already checked out</p>
              </div>
            ) : todayAttendance?.checkIn ? (
              <button
                onClick={handleCheckOut}
                disabled={!isOnAllowedNetwork || networkStatus !== 'connected'}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95"
              >
                Check Out Now
              </button>
            ) : (
              <p className="text-sm text-gray-500">Please check in first</p>
            )}
          </div>
        </div>

        {/* Enhanced Today's Summary */}
        {todayAttendance && (
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
            <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Today's Summary
            </h5>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              <div className="bg-white p-3 rounded-lg">
                <span className="text-gray-600 block">Check In</span>
                <span className="font-semibold">{todayAttendance.checkIn || 'Not yet'}</span>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <span className="text-gray-600 block">Check Out</span>
                <span className="font-semibold">{todayAttendance.checkOut || 'Not yet'}</span>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <span className="text-gray-600 block">Hours</span>
                <span className="font-semibold">{todayAttendance.totalHours?.toFixed(1) || 0}h</span>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <span className="text-gray-600 block">Status</span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusConfig(todayAttendance.status).color}`}>
                  {todayAttendance.status}
                </span>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <span className="text-gray-600 block">Tasks</span>
                <span className="font-semibold">{todayAttendance.tasksCompleted || 0}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Statistics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          {
            title: 'Attendance Rate',
            value: `${statistics.presentDays} / ${statistics.totalDays}`,
            icon: TrendingUp,
            color: 'bg-green-500',
            change: '+2.3%',
            description: 'vs last month'
          },
          {
            title: 'Present Days',
            value: statistics.presentDays,
            icon: CheckCircle,
            color: 'bg-blue-500',
            change: `+${statistics.lateDays} late`,
            description: 'this month'
          },
          {
            title: 'Total Hours',
            value: `${statistics.totalDays}h`,
            icon: Clock,
            color: 'bg-purple-500',
            change: `${statistics.presentDays}h avg`,
            description: 'per day'
          },
          {
            title: 'Productivity',
            value: `${statistics.presentDays}h / ${statistics.totalDays}h`,
            icon: BarChart3,
            color: 'bg-orange-500',
            change: '+5.2%',
            description: 'vs last month'
          }
        ].map((stat, index) => (
          <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <div className="text-right">
                <div className="text-xs text-green-600 font-medium">{stat.change}</div>
                <div className="text-xs text-gray-500">{stat.description}</div>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">{stat.title}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Enhanced Attendance History with Search and Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h3 className="text-lg font-semibold text-gray-900">Attendance History</h3>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by date or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
                <option value="half-day">Half Day</option>
              </select>
              
              <button className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {[
                  'Date',
                  'Status', 
                  'Check In',
                  'Check Out',
                  'Total Hours',
                  'Tasks',
                  'Productivity',
                  'Location'
                ].map(header => (
                  <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAttendanceData.map((record) => {
                const statusConfig = getStatusConfig(record.status);
                const StatusIcon = statusConfig.icon;
                
                return (
                  <tr key={record.date} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {new Date(record.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: '2-digit',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusConfig.color}`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                      {record.checkIn || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                      {record.checkOut || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.totalHours ? `${record.totalHours.toFixed(1)}h` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                        {record.tasksCompleted}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ width: `${record.productivity}%` }}
                          ></div>
                        </div>
                        <span className="text-xs">{record.productivity}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.location || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enhanced Network Information */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Wifi className="w-5 h-5 text-blue-600" />
          Network & Security Information
        </h3>
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-700 mb-3 font-medium">
                🔒 Security Features:
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Geo-location based attendance tracking</li>
                <li>• Network IP verification for security</li>
                <li>• Real-time location monitoring</li>
                <li>• Encrypted data transmission</li>
              </ul>
            </div>
            <div>
              <p className="text-sm text-gray-700 mb-3 font-medium">
                📋 Policies:
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Check-in/out only from approved networks</li>
                <li>• Location data logged for audit purposes</li>
                <li>• Remote work requires prior approval</li>
                <li>• Contact mentor for location changes</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}