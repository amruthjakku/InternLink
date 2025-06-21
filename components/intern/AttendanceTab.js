'use client';

import { useState, useEffect } from 'react';

export function AttendanceTab({ user, loading }) {
  const [attendanceData, setAttendanceData] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isOnAllowedNetwork, setIsOnAllowedNetwork] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState(null);

  useEffect(() => {
    // Simulate getting current location and network info
    setCurrentLocation({
      ip: '192.168.1.100',
      location: 'Office Network',
      isAllowed: true
    });
    setIsOnAllowedNetwork(true);

    // Mock attendance data
    const mockAttendance = [
      {
        date: '2024-01-16',
        checkIn: '09:15 AM',
        checkOut: '05:30 PM',
        totalHours: 8.25,
        status: 'present',
        location: 'Office Network',
        tasksCompleted: 3
      },
      {
        date: '2024-01-15',
        checkIn: '09:00 AM',
        checkOut: '05:45 PM',
        totalHours: 8.75,
        status: 'present',
        location: 'Office Network',
        tasksCompleted: 2
      },
      {
        date: '2024-01-14',
        checkIn: null,
        checkOut: null,
        totalHours: 0,
        status: 'absent',
        location: null,
        tasksCompleted: 0
      },
      {
        date: '2024-01-13',
        checkIn: '09:30 AM',
        checkOut: '04:00 PM',
        totalHours: 6.5,
        status: 'half-day',
        location: 'Office Network',
        tasksCompleted: 1
      },
      {
        date: '2024-01-12',
        checkIn: '09:10 AM',
        checkOut: '05:20 PM',
        totalHours: 8.17,
        status: 'present',
        location: 'Office Network',
        tasksCompleted: 4
      }
    ];

    setAttendanceData(mockAttendance);

    // Check if today's attendance exists
    const today = new Date().toISOString().split('T')[0];
    const todayRecord = mockAttendance.find(record => record.date === today);
    setTodayAttendance(todayRecord);
  }, []);

  const handleCheckIn = () => {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateString = now.toISOString().split('T')[0];

    const newRecord = {
      date: dateString,
      checkIn: timeString,
      checkOut: null,
      totalHours: 0,
      status: 'present',
      location: currentLocation?.location || 'Unknown',
      tasksCompleted: 0
    };

    setTodayAttendance(newRecord);
    setAttendanceData(prev => [newRecord, ...prev.filter(record => record.date !== dateString)]);
  };

  const handleCheckOut = () => {
    if (todayAttendance && todayAttendance.checkIn) {
      const now = new Date();
      const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      // Calculate hours (simplified)
      const checkInTime = new Date(`${todayAttendance.date} ${todayAttendance.checkIn}`);
      const checkOutTime = now;
      const diffHours = (checkOutTime - checkInTime) / (1000 * 60 * 60);

      const updatedRecord = {
        ...todayAttendance,
        checkOut: timeString,
        totalHours: Math.round(diffHours * 100) / 100
      };

      setTodayAttendance(updatedRecord);
      setAttendanceData(prev => 
        prev.map(record => 
          record.date === updatedRecord.date ? updatedRecord : record
        )
      );
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800';
      case 'absent': return 'bg-red-100 text-red-800';
      case 'half-day': return 'bg-yellow-100 text-yellow-800';
      case 'late': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present': return '✅';
      case 'absent': return '❌';
      case 'half-day': return '⚠️';
      case 'late': return '🕐';
      default: return '❓';
    }
  };

  // Calculate statistics
  const totalDays = attendanceData.length;
  const presentDays = attendanceData.filter(record => record.status === 'present').length;
  const absentDays = attendanceData.filter(record => record.status === 'absent').length;
  const totalHours = attendanceData.reduce((sum, record) => sum + (record.totalHours || 0), 0);
  const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
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
      {/* Check In/Out Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Today's Attendance</h3>
        
        {/* Network Status */}
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Network Status</p>
              <p className="text-sm text-gray-600">
                IP: {currentLocation?.ip} | Location: {currentLocation?.location}
              </p>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              isOnAllowedNetwork 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {isOnAllowedNetwork ? '✅ Allowed Network' : '❌ Restricted Network'}
            </div>
          </div>
        </div>

        {/* Check In/Out Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
            <div className="text-2xl mb-2">🕐</div>
            <h4 className="font-medium text-gray-900 mb-2">Check In</h4>
            {todayAttendance?.checkIn ? (
              <div>
                <p className="text-lg font-bold text-green-600">{todayAttendance.checkIn}</p>
                <p className="text-sm text-gray-500">Already checked in</p>
              </div>
            ) : (
              <button
                onClick={handleCheckIn}
                disabled={!isOnAllowedNetwork}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Check In Now
              </button>
            )}
          </div>

          <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
            <div className="text-2xl mb-2">🕕</div>
            <h4 className="font-medium text-gray-900 mb-2">Check Out</h4>
            {todayAttendance?.checkOut ? (
              <div>
                <p className="text-lg font-bold text-red-600">{todayAttendance.checkOut}</p>
                <p className="text-sm text-gray-500">Already checked out</p>
              </div>
            ) : todayAttendance?.checkIn ? (
              <button
                onClick={handleCheckOut}
                disabled={!isOnAllowedNetwork}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Check Out Now
              </button>
            ) : (
              <p className="text-sm text-gray-500">Check in first</p>
            )}
          </div>
        </div>

        {/* Today's Summary */}
        {todayAttendance && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h5 className="font-medium text-gray-900 mb-2">Today's Summary</h5>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Check In:</span>
                <span className="ml-2 font-medium">{todayAttendance.checkIn || 'Not yet'}</span>
              </div>
              <div>
                <span className="text-gray-600">Check Out:</span>
                <span className="ml-2 font-medium">{todayAttendance.checkOut || 'Not yet'}</span>
              </div>
              <div>
                <span className="text-gray-600">Hours:</span>
                <span className="ml-2 font-medium">{todayAttendance.totalHours || 0}h</span>
              </div>
              <div>
                <span className="text-gray-600">Status:</span>
                <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(todayAttendance.status)}`}>
                  {todayAttendance.status}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">📊</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Attendance Rate</p>
              <p className="text-2xl font-bold text-gray-900">{attendanceRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">✅</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Present Days</p>
              <p className="text-2xl font-bold text-gray-900">{presentDays}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">❌</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Absent Days</p>
              <p className="text-2xl font-bold text-gray-900">{absentDays}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">⏰</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Hours</p>
              <p className="text-2xl font-bold text-gray-900">{totalHours.toFixed(1)}h</p>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance History */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Attendance History</h3>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tasks Completed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {attendanceData.map((record) => (
                <tr key={record.date} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {new Date(record.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                      <span className="mr-1">{getStatusIcon(record.status)}</span>
                      {record.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.checkIn || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.checkOut || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.totalHours ? `${record.totalHours}h` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.tasksCompleted}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.location || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Network Information */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Network Information</h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">
            <strong>Note:</strong> Attendance tracking is based on your network location to ensure you're working from the designated office or approved remote locations.
          </p>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Check-in/out is only allowed from approved networks</li>
            <li>• Your IP address and location are logged for security purposes</li>
            <li>• Contact your mentor if you need to work from a different location</li>
          </ul>
        </div>
      </div>
    </div>
  );
}