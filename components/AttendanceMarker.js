'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export function AttendanceMarker({ onAttendanceMarked }) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userIP, setUserIP] = useState('');
  const [location, setLocation] = useState(null);
  const [todayAttendance, setTodayAttendance] = useState(null);

  useEffect(() => {
    // Fetch user's IP address
    fetchUserIP();
    // Check if attendance already marked today
    checkTodayAttendance();
    // Get user's location (optional)
    getUserLocation();
  }, []);

  const fetchUserIP = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      setUserIP(data.ip);
    } catch (error) {
      console.error('Error fetching IP:', error);
      setError('Unable to fetch your IP address. Please check your internet connection.');
    }
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          console.log('Location access denied or unavailable:', error);
          // Location is optional, so we don't show an error
        }
      );
    }
  };

  const checkTodayAttendance = async () => {
    try {
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);

      const response = await fetch(
        `/api/attendance/mark?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.attendance && data.attendance.length > 0) {
          setTodayAttendance(data.attendance[0]);
          setAttendanceStatus('marked');
        }
      }
    } catch (error) {
      console.error('Error checking today\'s attendance:', error);
    }
  };

  const markAttendance = async () => {
    if (!userIP) {
      setError('Unable to determine your IP address. Please refresh the page.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const deviceInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        screenResolution: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };

      const response = await fetch('/api/attendance/mark', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientIP: userIP,
          location,
          deviceInfo
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Attendance marked successfully! ✅');
        setAttendanceStatus('marked');
        setTodayAttendance({
          date: new Date(),
          status: 'present',
          ipAddress: userIP,
          location
        });
        
        // Call callback if provided
        if (onAttendanceMarked) {
          onAttendanceMarked(data);
        }
      } else {
        if (data.code === 'UNAUTHORIZED_NETWORK') {
          setError(`🚫 ${data.error}\n\nYour current IP: ${userIP}\nPlease connect to an authorized Wi-Fi network to mark attendance.`);
        } else if (data.code === 'ALREADY_MARKED') {
          setError('✅ Attendance already marked for today!');
          setAttendanceStatus('marked');
        } else {
          setError(data.error || 'Failed to mark attendance');
        }
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceStatusColor = () => {
    switch (attendanceStatus) {
      case 'marked': return 'text-green-600';
      case 'pending': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getAttendanceStatusIcon = () => {
    switch (attendanceStatus) {
      case 'marked': return '✅';
      case 'pending': return '⏳';
      default: return '📝';
    }
  };

  if (!session) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          📍 Attendance Tracker
        </h3>
        <div className={`flex items-center space-x-2 ${getAttendanceStatusColor()}`}>
          <span className="text-xl">{getAttendanceStatusIcon()}</span>
          <span className="font-medium capitalize">
            {attendanceStatus || 'Not Marked'}
          </span>
        </div>
      </div>

      {/* Current Status */}
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Your IP Address</div>
            <div className="font-mono text-sm font-medium">
              {userIP || 'Loading...'}
            </div>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Today's Date</div>
            <div className="font-medium">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Today's Attendance Status */}
      {todayAttendance && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-green-600 text-xl">✅</span>
            <span className="font-medium text-green-800">Attendance Marked</span>
          </div>
          <div className="text-sm text-green-700">
            <div>Time: {new Date(todayAttendance.date).toLocaleTimeString()}</div>
            <div>IP: {todayAttendance.ipAddress}</div>
            {todayAttendance.location && (
              <div>
                Location: {todayAttendance.location.latitude.toFixed(4)}, {todayAttendance.location.longitude.toFixed(4)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <span className="text-red-500 text-xl">⚠️</span>
            <div className="text-red-700 text-sm whitespace-pre-line">
              {error}
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-green-500 text-xl">🎉</span>
            <div className="text-green-700 font-medium">
              {success}
            </div>
          </div>
        </div>
      )}

      {/* Mark Attendance Button */}
      <div className="flex flex-col space-y-3">
        <button
          onClick={markAttendance}
          disabled={loading || attendanceStatus === 'marked' || !userIP}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
            attendanceStatus === 'marked'
              ? 'bg-green-100 text-green-700 cursor-not-allowed'
              : loading || !userIP
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {loading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Marking Attendance...</span>
            </div>
          ) : attendanceStatus === 'marked' ? (
            'Attendance Already Marked'
          ) : (
            'Mark Attendance'
          )}
        </button>

        {/* Security Notice */}
        <div className="text-xs text-gray-500 text-center">
          🔒 Attendance can only be marked from authorized Wi-Fi networks for security purposes.
        </div>
      </div>

      {/* Network Security Info */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-2">
          <span className="text-blue-500 text-lg">🛡️</span>
          <div className="text-blue-800 text-sm">
            <div className="font-medium mb-1">Network Security</div>
            <div>
              Your attendance is tracked using secure Wi-Fi validation. 
              Only authorized network connections are allowed to ensure accurate location-based attendance.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}