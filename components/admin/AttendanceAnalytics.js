'use client';

import { useState, useEffect } from 'react';
import { EnhancedLineChart, EnhancedBarChart, MetricCard } from '../Charts';
import { format, subDays, eachDayOfInterval, startOfWeek, endOfWeek, eachWeekOfInterval } from 'date-fns';

export function AttendanceAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    role: 'all',
    college: 'all'
  });
  const [viewMode, setViewMode] = useState('overview'); // 'overview', 'heatmap', 'users', 'absentees'

  useEffect(() => {
    fetchAnalytics();
  }, [filters]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(filters);
      const response = await fetch(`/api/admin/attendance-analytics?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      } else {
        console.error('Failed to fetch attendance analytics');
      }
    } catch (error) {
      console.error('Error fetching attendance analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const getHeatmapColor = (value, max) => {
    if (value === 0) return 'bg-gray-100';
    const intensity = value / max;
    if (intensity > 0.8) return 'bg-green-600';
    if (intensity > 0.6) return 'bg-green-500';
    if (intensity > 0.4) return 'bg-green-400';
    if (intensity > 0.2) return 'bg-green-300';
    return 'bg-green-200';
  };

  const getAttendanceRateColor = (rate) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 75) return 'text-yellow-600';
    if (rate >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getAttendanceRateBg = (rate) => {
    if (rate >= 90) return 'bg-green-100';
    if (rate >= 75) return 'bg-yellow-100';
    if (rate >= 60) return 'bg-orange-100';
    return 'bg-red-100';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white p-6 rounded-xl shadow-sm animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm animate-pulse">
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500">Failed to load attendance analytics</div>
      </div>
    );
  }

  // Prepare chart data
  const dailyAttendanceData = {
    labels: Object.keys(analytics.dailyHeatmap).map(date => format(new Date(date), 'MMM dd')),
    datasets: [{
      label: 'Daily Attendance',
      data: Object.values(analytics.dailyHeatmap),
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4,
      fill: true
    }]
  };

  const roleStatsData = {
    labels: Object.keys(analytics.roleStats),
    datasets: [
      {
        label: 'Present',
        data: Object.values(analytics.roleStats).map(stat => stat.present),
        backgroundColor: 'rgba(34, 197, 94, 0.8)'
      },
      {
        label: 'Absent',
        data: Object.values(analytics.roleStats).map(stat => stat.absent),
        backgroundColor: 'rgba(239, 68, 68, 0.8)'
      }
    ]
  };

  const collegeStatsData = {
    labels: Object.keys(analytics.collegeStats),
    datasets: [{
      data: Object.values(analytics.collegeStats).map(stat => stat.attendanceRate),
      backgroundColor: [
        '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
        '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280'
      ]
    }]
  };

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">📊 Attendance Analytics</h2>
          <p className="text-sm text-gray-600 mt-1">
            Comprehensive attendance tracking for all interns and mentors
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Date Range */}
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-gray-500">to</span>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          {/* Role Filter */}
          <select
            value={filters.role}
            onChange={(e) => handleFilterChange('role', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Roles</option>
            <option value="intern">Interns</option>
            <option value="mentor">Mentors</option>
            <option value="admin">Admins</option>
          </select>
          
          {/* College Filter */}
          <select
            value={filters.college}
            onChange={(e) => handleFilterChange('college', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Colleges</option>
            {Object.keys(analytics.collegeStats).map(college => (
              <option key={college} value={college}>{college}</option>
            ))}
          </select>
        </div>
      </div>

      {/* View Mode Selector */}
      <div className="flex bg-gray-100 rounded-lg p-1">
        {[
          { id: 'overview', label: 'Overview', icon: '📊' },
          { id: 'heatmap', label: 'Heatmap', icon: '🔥' },
          { id: 'users', label: 'User Details', icon: '👥' },
          { id: 'absentees', label: 'Absentees', icon: '⚠️' }
        ].map(mode => (
          <button
            key={mode.id}
            onClick={() => setViewMode(mode.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === mode.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="mr-2">{mode.icon}</span>
            {mode.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {viewMode === 'overview' && (
        <>
          {/* Overview Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard
              title="Total Users"
              value={analytics.overview.totalUsers}
              icon="👥"
              color="blue"
            />
            <MetricCard
              title="Present Today"
              value={analytics.overview.presentToday}
              change={((analytics.overview.presentToday / analytics.overview.totalUsers) * 100 - 80).toFixed(1)}
              icon="✅"
              color="green"
            />
            <MetricCard
              title="Absent Today"
              value={analytics.overview.absentToday}
              change={-((analytics.overview.absentToday / analytics.overview.totalUsers) * 100 - 20).toFixed(1)}
              icon="❌"
              color="red"
            />
            <MetricCard
              title="Attendance Rate"
              value={`${analytics.overview.attendanceRateToday.toFixed(1)}%`}
              change={(analytics.overview.attendanceRateToday - 85).toFixed(1)}
              icon="📈"
              color="purple"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold mb-4">📈 Daily Attendance Trend</h3>
              <EnhancedLineChart data={dailyAttendanceData} height={300} />
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold mb-4">👥 Role-wise Attendance</h3>
              <EnhancedBarChart data={roleStatsData} height={300} />
            </div>
          </div>

          {/* Top Performers and Streak Leaders */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold mb-4">🏆 Top Performers</h3>
              <div className="space-y-3">
                {analytics.topPerformers.slice(0, 5).map((user, index) => (
                  <div key={user.userId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                        index === 0 ? 'bg-yellow-500' :
                        index === 1 ? 'bg-gray-400' :
                        index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{user.userName}</div>
                        <div className="text-sm text-gray-600">{user.userRole}</div>
                      </div>
                    </div>
                    <div className={`font-bold ${getAttendanceRateColor(user.attendanceRate)}`}>
                      {user.attendanceRate.toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold mb-4">🔥 Streak Leaders</h3>
              <div className="space-y-3">
                {analytics.streakLeaders.slice(0, 5).map((user, index) => (
                  <div key={user.userId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">🔥</div>
                      <div>
                        <div className="font-medium">{user.userName}</div>
                        <div className="text-sm text-gray-600">{user.userRole}</div>
                      </div>
                    </div>
                    <div className="font-bold text-orange-600">
                      {user.currentStreak} days
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Heatmap Tab */}
      {viewMode === 'heatmap' && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">🔥 Daily Attendance Heatmap</h3>
          
          {/* Heatmap */}
          <div className="overflow-x-auto">
            <div className="grid grid-cols-7 gap-1 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-sm font-medium text-gray-600 p-2">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {Object.entries(analytics.dailyHeatmap).map(([date, count]) => {
                const maxCount = Math.max(...Object.values(analytics.dailyHeatmap));
                const dayOfWeek = new Date(date).getDay();
                
                return (
                  <div
                    key={date}
                    className={`w-12 h-12 rounded ${getHeatmapColor(count, maxCount)} flex items-center justify-center text-xs font-medium cursor-pointer hover:scale-110 transition-transform`}
                    title={`${format(new Date(date), 'MMM dd, yyyy')}: ${count} attendees`}
                  >
                    <div className="text-center">
                      <div className="text-xs">{format(new Date(date), 'dd')}</div>
                      <div className="text-xs font-bold">{count}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center space-x-2 mt-4">
            <span className="text-sm text-gray-600">Less</span>
            {[0, 0.2, 0.4, 0.6, 0.8, 1].map(intensity => (
              <div
                key={intensity}
                className={`w-3 h-3 rounded ${getHeatmapColor(intensity, 1)}`}
              />
            ))}
            <span className="text-sm text-gray-600">More</span>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {viewMode === 'users' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold">👥 User Attendance Details</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    College
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Present Days
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attendance Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Streak
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analytics.userAttendance.map((user) => (
                  <tr key={user.userId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.userName}</div>
                        <div className="text-sm text-gray-500">{user.userEmail}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.userRole === 'admin' ? 'bg-purple-100 text-purple-800' :
                        user.userRole === 'mentor' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {user.userRole}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.college || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.presentDays} / {user.totalDays}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getAttendanceRateBg(user.attendanceRate)} ${getAttendanceRateColor(user.attendanceRate)}`}>
                          {user.attendanceRate.toFixed(1)}%
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1">
                        <span className="text-orange-500">🔥</span>
                        <span className="text-sm font-medium">{user.currentStreak} days</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Absentees Tab */}
      {viewMode === 'absentees' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">⚠️ Today's Absentees</h3>
              <div className="text-sm text-gray-600">
                {analytics.absenteesToday.length} absent out of {analytics.overview.totalUsers} total users
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {analytics.absenteesToday.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🎉</div>
                <div className="text-lg font-medium text-green-600 mb-2">Perfect Attendance!</div>
                <div className="text-gray-600">All users have marked their attendance today.</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analytics.absenteesToday.map((user) => (
                  <div key={user.userId} className="p-4 border border-red-200 bg-red-50 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-medium text-gray-900">{user.userName}</div>
                        <div className="text-sm text-gray-600">{user.userEmail}</div>
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        user.userRole === 'admin' ? 'bg-purple-100 text-purple-800' :
                        user.userRole === 'mentor' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {user.userRole}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>College: {user.college || 'N/A'}</div>
                      <div>
                        Last Attendance: {
                          user.lastAttendance 
                            ? format(new Date(user.lastAttendance), 'MMM dd, yyyy')
                            : 'Never'
                        }
                      </div>
                      <div className="flex items-center space-x-1">
                        <span>Streak:</span>
                        <span className="text-orange-500">🔥</span>
                        <span className="font-medium">{user.attendanceStreak} days</span>
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