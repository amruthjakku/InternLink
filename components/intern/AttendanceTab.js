'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, CheckCircle, XCircle, AlertTriangle, BarChart3 } from 'lucide-react';
import { AttendanceMarker } from '../AttendanceMarker';

export function AttendanceTab({ user, loading }) {
  const [attendanceData, setAttendanceData] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);

  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch attendance data
  useEffect(() => {
    fetchAttendanceData();
  }, []);

  const fetchAttendanceData = async () => {
    try {
      setDataLoading(true);
      setError(null);
      
      const response = await fetch('/api/attendance/my-records');
      if (response.ok) {
        const data = await response.json();
        setAttendanceData(data.records || []);
        
        // Set today's attendance
        const today = new Date().toISOString().split('T')[0];
        const todayRecord = (data.records || []).find(record => record.date === today);
        setTodayAttendance(todayRecord);
      } else {
        setError('Failed to fetch attendance data');
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

  const handleCheckIn = async () => {
    try {
      setError(null);
      const response = await fetch('/api/attendance/checkin-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'checkin' })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert('✅ Successfully checked in!');
        fetchAttendanceData();
      } else {
        setError(data.error || 'Failed to check in. Please try again.');
      }
    } catch (err) {
      setError('Network error: Failed to check in');
    }
  };

  const handleCheckOut = async () => {
    try {
      setError(null);
      const response = await fetch('/api/attendance/checkin-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'checkout' })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert('✅ Successfully checked out!');
        fetchAttendanceData();
      } else {
        setError(data.error || 'Failed to check out. Please try again.');
      }
    } catch (err) {
      setError('Network error: Failed to check out');
    }
  };

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
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Calendar className="w-6 h-6 text-blue-600" />
            Attendance Tracking
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

        {/* Status Message */}
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <XCircle className="w-5 h-5 text-red-400 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        ) : attendanceData.length === 0 ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <Calendar className="w-12 h-12 text-blue-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-blue-900 mb-2">No Attendance Data</h3>
            <p className="text-blue-700 mb-4">
              Your attendance records will appear here once data is available.
            </p>
            <button
              onClick={fetchAttendanceData}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh Data
            </button>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-green-800">Attendance System Ready</h3>
                <p className="text-sm text-green-700 mt-1">
                  Found {attendanceData.length} attendance records
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Attendance Marker */}
      <AttendanceMarker onAttendanceMarked={fetchAttendanceData} />

      {/* Check-in/Check-out Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          Manual Check-in/Check-out
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Check In */}
          <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 transition-colors">
            <div className="text-3xl mb-3">🕐</div>
            <h4 className="font-semibold text-gray-900 mb-3">Check In</h4>
            {todayAttendance?.checkIn ? (
              <div className="space-y-2">
                <p className="text-xl font-bold text-green-600">{todayAttendance.checkIn}</p>
                <p className="text-sm text-gray-500">✓ Already checked in today</p>
                {todayAttendance.status === 'late' && (
                  <p className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                    Late arrival noted
                  </p>
                )}
              </div>
            ) : (
              <button
                onClick={handleCheckIn}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all transform hover:scale-105 active:scale-95 font-medium"
              >
                Check In Now
              </button>
            )}
          </div>

          {/* Check Out */}
          <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-red-400 transition-colors">
            <div className="text-3xl mb-3">🕕</div>
            <h4 className="font-semibold text-gray-900 mb-3">Check Out</h4>
            {todayAttendance?.checkOut ? (
              <div className="space-y-2">
                <p className="text-xl font-bold text-red-600">{todayAttendance.checkOut}</p>
                <p className="text-sm text-gray-500">✓ Already checked out today</p>
              </div>
            ) : todayAttendance?.checkIn ? (
              <button
                onClick={handleCheckOut}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all transform hover:scale-105 active:scale-95 font-medium"
              >
                Check Out Now
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
              <p className="text-sm font-medium text-gray-600">Total Records</p>
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
              <p className="text-sm font-medium text-gray-600">Present Days</p>
              <p className="text-2xl font-semibold text-gray-900">
                {attendanceData.filter(record => record.status === 'present').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Late Days</p>
              <p className="text-2xl font-semibold text-gray-900">
                {attendanceData.filter(record => record.status === 'late').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Absent Days</p>
              <p className="text-2xl font-semibold text-gray-900">
                {attendanceData.filter(record => record.status === 'absent').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Status */}
      {todayAttendance && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Today's Attendance
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <span className="text-gray-600 block text-sm">Check In</span>
              <span className="font-semibold text-lg">{todayAttendance.checkIn || 'Not recorded'}</span>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <span className="text-gray-600 block text-sm">Check Out</span>
              <span className="font-semibold text-lg">{todayAttendance.checkOut || 'Not recorded'}</span>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <span className="text-gray-600 block text-sm">Total Hours</span>
              <span className="font-semibold text-lg">{todayAttendance.totalHours?.toFixed(1) || 0}h</span>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <span className="text-gray-600 block text-sm">Status</span>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusConfig(todayAttendance.status).color}`}>
                {todayAttendance.status}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Attendance History Table */}
      {attendanceData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Attendance History</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Check In
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Check Out
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Hours
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendanceData.map((record, index) => {
                  const statusConfig = getStatusConfig(record.status);
                  const StatusIcon = statusConfig.icon;
                  
                  return (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Instructions for Data Entry */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Ready for Data Integration
        </h3>
        <div className="text-blue-800 space-y-2">
          <p>• The attendance system is now clean and ready for new data</p>
          <p>• All existing mock data has been removed</p>
          <p>• The interface will automatically display new attendance records</p>
          <p>• Data structure supports: date, status, checkIn, checkOut, totalHours</p>
        </div>
      </div>
    </div>
  );
}
