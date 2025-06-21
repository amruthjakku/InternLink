'use client';

import { useState, useEffect } from 'react';
import { mockData } from '../../utils/mockData';

export function AttendanceTab() {
  const [attendance, setAttendance] = useState([]);
  const [interns, setInterns] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedIntern, setSelectedIntern] = useState('');
  const [showIPSettings, setShowIPSettings] = useState(false);
  const [allowedIPs, setAllowedIPs] = useState(['192.168.1.0/24', '10.0.0.0/8']);

  useEffect(() => {
    // Generate more attendance data for demonstration
    const generateAttendanceData = () => {
      const attendanceData = [];
      const today = new Date();
      
      for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        mockData.interns.forEach(intern => {
          const isPresent = Math.random() > 0.15; // 85% attendance rate
          const checkIn = isPresent ? `0${8 + Math.floor(Math.random() * 2)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}:00` : null;
          const checkOut = isPresent ? `1${7 + Math.floor(Math.random() * 2)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}:00` : null;
          const hoursWorked = isPresent ? 8 + Math.random() * 2 : 0;
          
          attendanceData.push({
            id: `${intern.id}-${dateStr}`,
            intern_id: intern.id,
            date: dateStr,
            check_in: checkIn,
            check_out: checkOut,
            hours_worked: parseFloat(hoursWorked.toFixed(1)),
            ip_address: isPresent ? `192.168.1.${100 + intern.id}` : null,
            location: isPresent ? `${intern.college_name} Campus` : null,
            status: isPresent ? 'present' : 'absent'
          });
        });
      }
      
      return attendanceData;
    };

    setAttendance(generateAttendanceData());
    setInterns(mockData.interns);
  }, []);

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
                            <div className="text-sm text-gray-500">{intern?.college_name}</div>
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
      <AttendanceOverview />
      <AttendanceRecords />
      <AttendanceAnalytics />
      <IPVerificationModal />
    </div>
  );
}