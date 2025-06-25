'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { format, subDays, parseISO } from 'date-fns';

export function AttendanceHistory() {
  const { data: session } = useSession();
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  });
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const [userIP, setUserIP] = useState('');


  useEffect(() => {
    if (session) {
      fetchAttendance();
      fetchTodayAttendance();
      fetchUserIP();
    }
  }, [session, dateRange]);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });
      
      const response = await fetch(`/api/attendance/mark?${params}`);
      if (response.ok) {
        const data = await response.json();
        setAttendance(data.attendance || []);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayAttendance = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/attendance/today?date=${today}`);
      if (response.ok) {
        const data = await response.json();
        setTodayAttendance(data.attendance);
      }
    } catch (error) {
      console.error('Error fetching today attendance:', error);
    }
  };

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

  const handleAttendanceAction = async (action) => {
    if (!userIP || userIP === 'Unable to detect') {
      setMessage('❌ Unable to detect your IP address. Please check your internet connection.');
      return;
    }

    setProcessing(true);
    setMessage('');

    try {
      const response = await fetch('/api/attendance/checkin-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          clientIP: userIP,
          location: null,
          deviceInfo: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language
          }
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`✅ ${data.message}`);
        
        // Immediately update todayAttendance state with the new record
        const newRecord = {
          _id: data.attendanceId,
          userId: session.user.id,
          action: action,
          timestamp: data.timestamp,
          date: new Date().toISOString().split('T')[0],
          ipAddress: userIP
        };
        
        setTodayAttendance(prev => {
          const updated = prev ? [...prev, newRecord] : [newRecord];
          return updated;
        });
        
        // Also refresh data from server
        await fetchAttendance();
        await fetchTodayAttendance();
      } else {
        if (data.error === 'Unauthorized') {
          setMessage('❌ Please log in first to mark attendance');
        } else if (data.error?.includes('network')) {
          setMessage('❌ Please connect to authorized Wi-Fi network');
        } else {
          setMessage(`❌ ${data.error || 'Failed to process attendance'}`);
        }
      }
    } catch (error) {
      console.error('Error processing attendance:', error);
      if (error.message.includes('fetch')) {
        setMessage('❌ Network error. Check your internet connection.');
      } else {
        setMessage('❌ System error. Please try again or contact admin.');
      }
    } finally {
      setProcessing(false);
    }
  };

  const getAttendanceStatus = () => {
    if (!todayAttendance) return 'not-started';
    
    const hasCheckin = todayAttendance.some(record => record.action === 'checkin');
    const hasCheckout = todayAttendance.some(record => record.action === 'checkout');
    
    if (hasCheckin && hasCheckout) return 'completed';
    if (hasCheckin && !hasCheckout) return 'checked-in';
    return 'not-started';
  };

  const getTodayWorkingHours = () => {
    if (!todayAttendance || todayAttendance.length === 0) return null;
    
    const checkinRecord = todayAttendance.find(record => record.action === 'checkin');
    const checkoutRecord = todayAttendance.find(record => record.action === 'checkout');
    
    if (!checkinRecord) return null;
    
    const checkinTime = new Date(checkinRecord.timestamp);
    const checkoutTime = checkoutRecord ? new Date(checkoutRecord.timestamp) : new Date();
    
    const diffMs = checkoutTime - checkinTime;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return {
      checkin: checkinTime.toLocaleTimeString(),
      checkout: checkoutRecord ? checkoutTime.toLocaleTimeString() : null,
      duration: `${diffHours}h ${diffMinutes}m`
    };
  };

  const handleDateChange = (field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Group attendance records by date
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

  // Get status for a day (complete, partial, old-format)
  const getDayStatus = (records) => {
    const hasCheckin = records.some(r => r.action === 'checkin');
    const hasCheckout = records.some(r => r.action === 'checkout');
    const hasOldFormat = records.some(r => r.status === 'present' && !r.action);
    
    if (hasOldFormat) return 'old-format';
    if (hasCheckin && hasCheckout) return 'complete';
    if (hasCheckin && !hasCheckout) return 'partial';
    return 'unknown';
  };

  // Calculate working hours for a day
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

  // Calculate statistics
  const calculateStats = () => {
    const groupedData = groupAttendanceByDate(attendance);
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

  if (!session) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="text-center text-gray-500">
          Please log in to view attendance history
        </div>
      </div>
    );
  }

  const stats = calculateStats();
  const groupedAttendance = groupAttendanceByDate(attendance);
  const attendanceStatus = getAttendanceStatus();
  const todayWorkingHours = getTodayWorkingHours();
  


  return (
    <div className="space-y-6">
      {/* Today's Attendance Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">🕐 Today's Attendance</h3>
          <div className="flex items-center space-x-2">
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              attendanceStatus === 'completed' ? 'bg-green-100 text-green-800' :
              attendanceStatus === 'checked-in' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {attendanceStatus === 'completed' ? 'Day Complete' :
               attendanceStatus === 'checked-in' ? 'Checked In' :
               'Not Started'}
            </div>
            {session?.user?.role && (
              <div className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 capitalize">
                {session.user.role}
              </div>
            )}
          </div>
        </div>

        {/* Today's Status Display */}
        <div className="mb-6">
          {todayWorkingHours ? (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Check-in:</span>
                  <div className="font-medium text-green-600">{todayWorkingHours.checkin}</div>
                </div>
                <div>
                  <span className="text-gray-600">Check-out:</span>
                  <div className="font-medium text-red-600">
                    {todayWorkingHours.checkout || 'Not yet'}
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200">
                <span className="text-gray-600 text-sm">Working time:</span>
                <div className="font-medium text-blue-600">{todayWorkingHours.duration}</div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-500">
              No attendance recorded for today
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {attendanceStatus === 'not-started' && (
            <button
              onClick={() => handleAttendanceAction('checkin')}
              disabled={processing}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                processing
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {processing ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                '🟢 Check In'
              )}
            </button>
          )}

          {attendanceStatus === 'checked-in' && (
            <button
              onClick={() => handleAttendanceAction('checkout')}
              disabled={processing}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                processing
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              {processing ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                '🔴 Check Out'
              )}
            </button>
          )}

          {attendanceStatus === 'completed' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
              <span className="text-green-800 font-medium">✅ Attendance completed for today</span>
            </div>
          )}
        </div>

        {/* Message Display */}
        {message && (
          <div className={`mt-4 p-3 rounded-lg text-sm ${
            message.startsWith('✅') 
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message}
          </div>
        )}

        {/* Current IP Display */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            Current IP: <span className="font-mono">{userIP}</span>
          </div>
        </div>
      </div>

      {/* Attendance History Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-900">📅 Attendance History</h3>
        
        <div className="flex items-center space-x-3">
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => handleDateChange('startDate', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-gray-500">to</span>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => handleDateChange('endDate', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="text-sm text-blue-600 mb-1">Total Days</div>
          <div className="text-2xl font-bold text-blue-900">{stats.totalDays}</div>
        </div>
        
        <div className="p-4 bg-green-50 rounded-lg">
          <div className="text-sm text-green-600 mb-1">Present Days</div>
          <div className="text-2xl font-bold text-green-900">{stats.presentDays}</div>
        </div>
        
        <div className="p-4 bg-purple-50 rounded-lg">
          <div className="text-sm text-purple-600 mb-1">Complete Days</div>
          <div className="text-2xl font-bold text-purple-900">{stats.completeDays}</div>
        </div>
        
        <div className="p-4 bg-yellow-50 rounded-lg">
          <div className="text-sm text-yellow-600 mb-1">Attendance Rate</div>
          <div className="text-2xl font-bold text-yellow-900">{stats.attendanceRate}%</div>
        </div>
        
        <div className="p-4 bg-indigo-50 rounded-lg">
          <div className="text-sm text-indigo-600 mb-1">Working Hours</div>
          <div className="text-2xl font-bold text-indigo-900">{stats.totalWorkingHours}h</div>
        </div>
      </div>

      {/* Attendance Records */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-20 bg-gray-200 rounded-lg"></div>
            </div>
          ))}
        </div>
      ) : Object.keys(groupedAttendance).length === 0 ? (
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
                {records.map((record, index) => (
                  <div key={record._id || index} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        record.action === 'checkin' ? 'bg-green-500' :
                        record.action === 'checkout' ? 'bg-red-500' :
                        'bg-blue-500'
                      }`}></div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {record.action === 'checkin' ? '🟢 Check In' :
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
                ))}
                
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
    </div>
  );
}