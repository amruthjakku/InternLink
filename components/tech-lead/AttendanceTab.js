'use client';

import { useState, useEffect } from 'react';
import { format, subDays, parseISO, eachDayOfInterval } from 'date-fns';
import { CollegeBadge } from '../CollegeLogo';
// Using real API calls - no mock data

export function AttendanceTab({ userRole = 'mentor' }) {
  const [attendance, setAttendance] = useState([]);
  const [interns, setInterns] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedIntern, setSelectedIntern] = useState('');
  const [showIPSettings, setShowIPSettings] = useState(false);
  const [allowedIPs, setAllowedIPs] = useState(['192.168.1.0/24', '10.0.0.0/8']);
  const [activeView, setActiveView] = useState('overview'); // 'overview', 'history', 'analytics'
  const [dateRange, setDateRange] = useState({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  });
  const [attendanceHistory, setAttendanceHistory] = useState([]);

  useEffect(() => {
    fetchAttendanceData();
    fetchInterns();
    fetchAttendanceHistory();
  }, []);

  useEffect(() => {
    if (activeView === 'history') {
      fetchAttendanceHistory();
    }
  }, [dateRange, activeView]);

  const fetchAttendanceData = async () => {
    try {
      const response = await fetch('/api/attendance/summary');
      if (response.ok) {
        const data = await response.json();
        setAttendance(data.attendance || []);
      } else {
        setAttendance([]);
      }
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      setAttendance([]);
    }
  };

  const fetchInterns = async () => {
    try {
      // Different API endpoints based on user role
      let endpoint = '/api/admin/users?role=AI%20developer%20Intern';
      if (userRole === 'Tech Lead') {
        endpoint = '/api/tech-lead/assigned-interns';
      } else if (userRole === 'POC') {
        endpoint = '/api/poc/college-interns';
      }
      
      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        setInterns(data.users || data.interns || []);
      } else {
        setInterns([]);
      }
    } catch (error) {
      console.error('Error fetching interns:', error);
      setInterns([]);
    }
  };

  const fetchAttendanceHistory = async () => {
    try {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });
      
      const response = await fetch(`/api/attendance/history?${params}`);
      if (response.ok) {
        const data = await response.json();
        setAttendanceHistory(data.attendance || []);
      } else {
        setAttendanceHistory([]);
      }
    } catch (error) {
      console.error('Error fetching attendance history:', error);
      setAttendanceHistory([]);
    }
  };

  const getAttendanceForDate = (date) => {
    return attendance.filter(record => record.date === date);
  };

  const getInternAttendanceStats = (internId) => {
    const internAttendance = attendance.filter(record => record.intern_id === internId);
    const presentDays = internAttendance.filter(record => record.status === 'present').length;
    const totalDays = internAttendance.length;
    const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;
    const avgHours = internAttendance.length > 0 
      ? internAttendance.reduce((sum, record) => sum + record.hours_worked, 0) / presentDays || 0
      : 0;

    return {
      presentDays,
      totalDays,
      attendanceRate: attendanceRate.toFixed(1),
      avgHours: avgHours.toFixed(1)
    };
  };

  // Helper functions for attendance history
  const groupAttendanceByDate = (records) => {
    const grouped = {};
    records.forEach(record => {
      const date = record.date || record.timestamp?.split('T')[0] || new Date(record.timestamp).toISOString().split('T')[0];
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(record);
    });
    
    // Sort records within each date by timestamp
    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) => {
        const timeA = new Date(a.timestamp || a.markedAt || a.date);
        const timeB = new Date(b.timestamp || b.markedAt || b.date);
        return timeA - timeB;
      });
    });
    
    return grouped;
  };

  const getDayStatus = (records) => {
    const hasCheckin = records.some(r => r.action === 'checkin');
    const hasCheckout = records.some(r => r.action === 'checkout');
    const hasOldFormat = records.some(r => r.status === 'present' && !r.action);
    
    if (hasOldFormat) return 'old-format';
    if (hasCheckin && hasCheckout) return 'complete';
    if (hasCheckin && !hasCheckout) return 'partial';
    return 'unknown';
  };

  const getDayWorkingHours = (records) => {
    const checkinRecord = records.find(r => r.action === 'checkin');
    const checkoutRecord = records.find(r => r.action === 'checkout');
    
    if (!checkinRecord || !checkoutRecord) return null;
    
    const checkinTime = new Date(checkinRecord.timestamp);
    const checkoutTime = new Date(checkoutRecord.timestamp);
    const diffMs = checkoutTime - checkinTime;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${diffHours}h ${diffMinutes}m`;
  };

  const calculateHistoryStats = () => {
    const groupedData = groupAttendanceByDate(attendanceHistory);
    const dates = Object.keys(groupedData);
    
    const totalDays = dates.length;
    const completeDays = dates.filter(date => getDayStatus(groupedData[date]) === 'complete').length;
    const partialDays = dates.filter(date => getDayStatus(groupedData[date]) === 'partial').length;
    const oldFormatDays = dates.filter(date => getDayStatus(groupedData[date]) === 'old-format').length;
    
    const presentDays = completeDays + oldFormatDays;
    const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
    
    // Calculate total working hours
    let totalWorkingHours = 0;
    dates.forEach(date => {
      const hours = getDayWorkingHours(groupedData[date]);
      if (hours) {
        const [h, m] = hours.split('h ');
        totalWorkingHours += parseInt(h) + parseInt(m.replace('m', '')) / 60;
      }
    });
    
    return {
      totalDays,
      presentDays,
      completeDays,
      partialDays,
      attendanceRate,
      totalWorkingHours: Math.round(totalWorkingHours * 10) / 10
    };
  };

  const handleDateRangeChange = (field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'at_risk': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPerformanceColor = (score) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const AttendanceOverview = () => {
    const todayAttendance = getAttendanceForDate(selectedDate);
    const presentToday = todayAttendance.filter(record => record.status === 'present').length;
    const absentToday = todayAttendance.filter(record => record.status === 'absent').length;
    const avgHoursToday = todayAttendance.length > 0 
      ? todayAttendance.reduce((sum, record) => sum + record.hours_worked, 0) / presentToday || 0
      : 0;

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Attendance Overview</h3>
          <div className="flex items-center space-x-4">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
            <button
              onClick={() => setShowIPSettings(true)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <span className="mr-2">🔒</span>
              IP Settings
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{presentToday}</div>
            <div className="text-sm text-gray-600">Present Today</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{absentToday}</div>
            <div className="text-sm text-gray-600">Absent Today</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {((presentToday / (presentToday + absentToday)) * 100 || 0).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Attendance Rate</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{avgHoursToday.toFixed(1)}h</div>
            <div className="text-sm text-gray-600">Avg Hours</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3">
          <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700">
            <span className="mr-2">✅</span>
            Mark All Present
          </button>
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
            <span className="mr-2">📊</span>
            Export Report
          </button>
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
            <span className="mr-2">📧</span>
            Send Reminders
          </button>
        </div>
      </div>
    );
  };

  const AttendanceRecords = () => {
    const todayAttendance = getAttendanceForDate(selectedDate);

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Daily Records - {new Date(selectedDate).toLocaleDateString()}
          </h3>
          <select
            value={selectedIntern}
            onChange={(e) => setSelectedIntern(e.target.value)}
            className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">All Interns</option>
            {interns.map(intern => (
              <option key={intern.id} value={intern.id}>{intern.name}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Intern
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
                  Hours
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {todayAttendance
                .filter(record => !selectedIntern || record.intern_id.toString() === selectedIntern)
                .map(record => {
                  const intern = interns.find(i => i.id === record.intern_id);
                  return (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">
                              {intern?.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{intern?.name}</div>
                            <CollegeBadge college={{ name: intern?.college_name }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          record.status === 'present' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {record.status === 'present' ? '✅ Present' : '❌ Absent'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.check_in || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.check_out || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.hours_worked}h
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.location || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                        <button className="text-red-600 hover:text-red-900">Delete</button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const AttendanceAnalytics = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Attendance Analytics</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Individual Stats */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-4">Individual Attendance Rates</h4>
          <div className="space-y-3">
            {interns
              .sort((a, b) => {
                const statsA = getInternAttendanceStats(a.id);
                const statsB = getInternAttendanceStats(b.id);
                return parseFloat(statsB.attendanceRate) - parseFloat(statsA.attendanceRate);
              })
              .map(intern => {
                const stats = getInternAttendanceStats(intern.id);
                return (
                  <div key={intern.id} className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {intern.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-900">{intern.name}</span>
                        <span className="text-gray-500">{stats.attendanceRate}% ({stats.presentDays}/{stats.totalDays})</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div
                          className={`h-2 rounded-full ${
                            parseFloat(stats.attendanceRate) >= 90 ? 'bg-green-500' :
                            parseFloat(stats.attendanceRate) >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${stats.attendanceRate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Trends */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-4">Attendance Trends</h4>
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {(attendance.filter(r => r.status === 'present').length / attendance.length * 100 || 0).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Overall Attendance Rate</div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {(attendance.filter(r => r.status === 'present').reduce((sum, r) => sum + r.hours_worked, 0) / attendance.filter(r => r.status === 'present').length || 0).toFixed(1)}h
                </div>
                <div className="text-sm text-gray-600">Average Daily Hours</div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {interns.filter(intern => {
                    const stats = getInternAttendanceStats(intern.id);
                    return parseFloat(stats.attendanceRate) >= 90;
                  }).length}
                </div>
                <div className="text-sm text-gray-600">Perfect Attendance (90%+)</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const AttendanceHistory = () => {
    const historyStats = calculateHistoryStats();
    const groupedAttendance = groupAttendanceByDate(attendanceHistory);

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-900">📅 Attendance History</h3>
        
          <div className="flex items-center space-x-3">
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-sm text-blue-600 mb-1">Total Days</div>
            <div className="text-2xl font-bold text-blue-900">{historyStats.totalDays}</div>
          </div>
          
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="text-sm text-green-600 mb-1">Present Days</div>
            <div className="text-2xl font-bold text-green-900">{historyStats.presentDays}</div>
          </div>
          
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="text-sm text-purple-600 mb-1">Complete Days</div>
            <div className="text-2xl font-bold text-purple-900">{historyStats.completeDays}</div>
          </div>
          
          <div className="p-4 bg-yellow-50 rounded-lg">
            <div className="text-sm text-yellow-600 mb-1">Attendance Rate</div>
            <div className="text-2xl font-bold text-yellow-900">{historyStats.attendanceRate}%</div>
          </div>
          
          <div className="p-4 bg-indigo-50 rounded-lg">
            <div className="text-sm text-indigo-600 mb-1">Working Hours</div>
            <div className="text-2xl font-bold text-indigo-900">{historyStats.totalWorkingHours}h</div>
          </div>
        </div>

        {/* Attendance Records */}
        {Object.keys(groupedAttendance).length === 0 ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">📅</div>
            <div className="text-lg font-medium text-gray-900 mb-2">No Attendance Records</div>
            <div className="text-gray-600">No attendance records found for the selected date range.</div>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedAttendance)
              .sort(([a], [b]) => new Date(b) - new Date(a)) // Sort by date descending
              .map(([date, records]) => (
              <div key={date} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-medium text-gray-900">
                    {format(parseISO(date), 'EEEE, MMMM d, yyyy')}
                  </div>
                  <div className="flex items-center space-x-2">
                    {getDayStatus(records) === 'complete' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ✅ Complete Day
                      </span>
                    )}
                    {getDayStatus(records) === 'partial' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        ⚠️ Incomplete
                      </span>
                    )}
                    {getDayStatus(records) === 'old-format' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        📝 Marked Present
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  {records.map((record, index) => {
                    const intern = interns.find(i => i.id === record.userId || i.id === record.intern_id);
                    return (
                      <div key={record._id || index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${
                            record.action === 'checkin' ? 'bg-green-500' :
                            record.action === 'checkout' ? 'bg-red-500' :
                            'bg-blue-500'
                          }`}></div>
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">
                              {intern?.name?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {intern?.name || 'Unknown User'} - {record.action === 'checkin' ? '🟢 Check In' :
                               record.action === 'checkout' ? '🔴 Check Out' :
                               '📝 Attendance Marked'}
                            </div>
                            <div className="text-xs text-gray-600">
                              {format(new Date(record.timestamp || record.markedAt || record.date), 'h:mm a')}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          {record.ipAddress && (
                            <div className="text-xs text-gray-500">
                              IP: {record.ipAddress}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Working Hours Summary */}
                  {getDayWorkingHours(records) && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Working Hours:</span> {getDayWorkingHours(records)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const IPVerificationModal = () => {
    if (!showIPSettings) return null;

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <div className="mt-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">IP Verification Settings</h3>
              <button
                onClick={() => setShowIPSettings(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Allowed IP Ranges
                </label>
                <div className="space-y-2">
                  {allowedIPs.map((ip, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={ip}
                        onChange={(e) => {
                          const newIPs = [...allowedIPs];
                          newIPs[index] = e.target.value;
                          setAllowedIPs(newIPs);
                        }}
                        className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                      <button
                        onClick={() => {
                          const newIPs = allowedIPs.filter((_, i) => i !== index);
                          setAllowedIPs(newIPs);
                        }}
                        className="text-red-600 hover:text-red-800"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setAllowedIPs([...allowedIPs, ''])}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                >
                  + Add IP Range
                </button>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-1">IP Format Examples</h4>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• Single IP: 192.168.1.100</li>
                  <li>• IP Range: 192.168.1.0/24</li>
                  <li>• Subnet: 10.0.0.0/8</li>
                </ul>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowIPSettings(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Attendance Management</h2>
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveView('overview')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeView === 'overview'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📊 Overview
            </button>
            <button
              onClick={() => setActiveView('history')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeView === 'history'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📅 History
            </button>
            <button
              onClick={() => setActiveView('analytics')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeView === 'analytics'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📈 Analytics
            </button>
          </div>
        </div>
      </div>

      {/* Conditional Content Rendering */}
      {activeView === 'overview' && (
        <>
          <AttendanceOverview />
          <AttendanceRecords />
        </>
      )}

      {activeView === 'history' && <AttendanceHistory />}

      {activeView === 'analytics' && <AttendanceAnalytics />}

      <IPVerificationModal />
    </div>
  );
}