'use client';

import { useState, useEffect } from 'react';
import { EnhancedLineChart, EnhancedBarChart, EnhancedDoughnutChart, MetricCard } from '../Charts';
import { format, subDays } from 'date-fns';
import { CollegeCard } from '../CollegeLogo';

export function AdvancedAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');
  const [selectedMetric, setSelectedMetric] = useState('overview');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/analytics?timeRange=${timeRange}`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      } else {
        console.error('Failed to fetch analytics');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type, format) => {
    try {
      const response = await fetch(`/api/admin/analytics/export?type=${type}&format=${format}`);
      
      if (response.ok) {
        if (format === 'csv') {
          // Download CSV file
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `analytics-${type}-${new Date().toISOString().split('T')[0]}.csv`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        } else {
          // Download JSON file
          const data = await response.json();
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `analytics-${type}-${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }
      } else {
        alert('Failed to export data');
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Error exporting data');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Advanced Analytics</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Advanced Analytics</h2>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-gray-600">Failed to load analytics data. Please try again.</p>
        </div>
      </div>
    );
  }

  const { userMetrics, taskMetrics, collegeMetrics, performanceMetrics, timeSeriesData, systemHealth } = analytics;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Advanced Analytics</h2>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard
          title="Total Users"
          value={userMetrics.total.toLocaleString()}
          change={`+${userMetrics.recentSignups} this period`}
          icon="👥"
          color="blue"
        />
        <MetricCard
          title="Task Completion Rate"
          value={`${performanceMetrics.taskCompletionRate}%`}
          change={`${taskMetrics.completed}/${taskMetrics.total} tasks`}
          icon="✅"
          color="green"
        />
        <MetricCard
          title="User Engagement"
          value={`${performanceMetrics.userEngagement}%`}
          change={`${userMetrics.activeInPeriod} active users`}
          icon="📊"
          color="purple"
        />
        <MetricCard
          title="System Health"
          value={`${systemHealth.userSatisfaction}%`}
          change={`${systemHealth.activeUsers} active now`}
          icon="💚"
          color="emerald"
        />
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', name: 'Overview', icon: '📊' },
              { id: 'users', name: 'Users', icon: '👥' },
              { id: 'tasks', name: 'Tasks', icon: '📝' },
              { id: 'colleges', name: 'Colleges', icon: '🏫' },
              { id: 'performance', name: 'Performance', icon: '🎯' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedMetric(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  selectedMetric === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {selectedMetric === 'overview' && (
            <div className="space-y-6">
              {/* Time Series Chart */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Trends</h3>
                <EnhancedLineChart
                  data={{
                    labels: timeSeriesData.map(d => format(new Date(d.date), 'MMM dd')),
                    datasets: [
                      {
                        label: 'New Users',
                        data: timeSeriesData.map(d => d.newUsers),
                        borderColor: 'rgb(59, 130, 246)',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4
                      },
                      {
                        label: 'Tasks Created',
                        data: timeSeriesData.map(d => d.tasksCreated),
                        borderColor: 'rgb(16, 185, 129)',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.4
                      },
                      {
                        label: 'Tasks Completed',
                        data: timeSeriesData.map(d => d.tasksCompleted),
                        borderColor: 'rgb(245, 158, 11)',
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        tension: 0.4
                      }
                    ]
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: 'top',
                      },
                      title: {
                        display: true,
                        text: `System Activity - Last ${timeRange} Days`
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true
                      }
                    }
                  }}
                />
              </div>

              {/* Quick Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Growth Rate</p>
                      <p className="text-2xl font-bold text-blue-900">+{performanceMetrics.growthRate}%</p>
                    </div>
                    <div className="text-3xl">📈</div>
                  </div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-red-600 font-medium">Overdue Tasks</p>
                      <p className="text-2xl font-bold text-red-900">{taskMetrics.overdue}</p>
                    </div>
                    <div className="text-3xl">⚠️</div>
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-600 font-medium">Avg Progress</p>
                      <p className="text-2xl font-bold text-green-900">{taskMetrics.avgProgress}%</p>
                    </div>
                    <div className="text-3xl">🎯</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedMetric === 'users' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* User Role Distribution */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">User Distribution by Role</h3>
                  <EnhancedDoughnutChart
                    data={{
                      labels: ['Interns', 'Mentors', 'Super-Mentors', 'Admins'],
                      datasets: [{
                        data: [
                          userMetrics.byRole.intern,
                          userMetrics.byRole.mentor,
                          userMetrics.byRole['super-mentor'],
                          userMetrics.byRole.admin
                        ],
                        backgroundColor: [
                          'rgba(59, 130, 246, 0.8)',
                          'rgba(16, 185, 129, 0.8)',
                          'rgba(245, 158, 11, 0.8)',
                          'rgba(239, 68, 68, 0.8)'
                        ]
                      }]
                    }}
                  />
                </div>

                {/* User Activity */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">User Activity Status</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Users</span>
                      <span className="font-semibold">{userMetrics.total}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Active Users</span>
                      <span className="font-semibold text-green-600">{userMetrics.active}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Recent Signups</span>
                      <span className="font-semibold text-blue-600">{userMetrics.recentSignups}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Active in Period</span>
                      <span className="font-semibold text-purple-600">{userMetrics.activeInPeriod}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedMetric === 'tasks' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Task Status Distribution */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Status Distribution</h3>
                  <EnhancedBarChart
                    data={{
                      labels: ['Not Started', 'In Progress', 'Completed', 'Overdue'],
                      datasets: [{
                        label: 'Tasks',
                        data: [
                          taskMetrics.notStarted,
                          taskMetrics.inProgress,
                          taskMetrics.completed,
                          taskMetrics.overdue
                        ],
                        backgroundColor: [
                          'rgba(156, 163, 175, 0.8)',
                          'rgba(59, 130, 246, 0.8)',
                          'rgba(16, 185, 129, 0.8)',
                          'rgba(239, 68, 68, 0.8)'
                        ]
                      }]
                    }}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          display: false
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true
                        }
                      }
                    }}
                  />
                </div>

                {/* Task Priority & Creator */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Metrics</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">By Priority</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-red-600">High Priority</span>
                          <span className="font-semibold">{taskMetrics.byPriority.high}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-yellow-600">Medium Priority</span>
                          <span className="font-semibold">{taskMetrics.byPriority.medium}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-green-600">Low Priority</span>
                          <span className="font-semibold">{taskMetrics.byPriority.low}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">By Creator Role</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Admin Created</span>
                          <span className="font-semibold">{taskMetrics.byCreator.admin}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Super-Mentor Created</span>
                          <span className="font-semibold">{taskMetrics.byCreator['super-mentor']}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Mentor Created</span>
                          <span className="font-semibold">{taskMetrics.byCreator.mentor}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedMetric === 'colleges' && (
            <div className="space-y-6">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">College User Distribution</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          College
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Users
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Interns
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Mentors
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Super-Mentors
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {collegeMetrics.userDistribution.map((college, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <CollegeCard college={{ name: college?.name || 'Unknown College' }} size="sm" showLocation={false} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {college?.users || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {college?.interns || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {college?.mentors || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {college?.superMentors || 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {selectedMetric === 'performance' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">System Performance</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Task Completion Rate</span>
                      <div className="flex items-center">
                        <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${performanceMetrics.taskCompletionRate}%` }}
                          ></div>
                        </div>
                        <span className="font-semibold">{performanceMetrics.taskCompletionRate}%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">User Engagement</span>
                      <div className="flex items-center">
                        <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${performanceMetrics.userEngagement}%` }}
                          ></div>
                        </div>
                        <span className="font-semibold">{performanceMetrics.userEngagement}%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Overdue Rate</span>
                      <div className="flex items-center">
                        <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-red-600 h-2 rounded-full" 
                            style={{ width: `${performanceMetrics.overdueRate}%` }}
                          ></div>
                        </div>
                        <span className="font-semibold">{performanceMetrics.overdueRate}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-green-600 mb-2">
                        {systemHealth.userSatisfaction}%
                      </div>
                      <p className="text-sm text-gray-600">Overall System Health</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-blue-600">{systemHealth.activeUsers}</div>
                        <p className="text-xs text-gray-600">Active Users</p>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-orange-600">{systemHealth.taskBacklog}</div>
                        <p className="text-xs text-gray-600">Task Backlog</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Data Export */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Analytics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Export Data</h4>
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => handleExport('summary', 'csv')}
                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                Summary CSV
              </button>
              <button 
                onClick={() => handleExport('users', 'csv')}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Users CSV
              </button>
              <button 
                onClick={() => handleExport('tasks', 'csv')}
                className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
              >
                Tasks CSV
              </button>
              <button 
                onClick={() => handleExport('colleges', 'csv')}
                className="px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
              >
                Colleges CSV
              </button>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Reports</h4>
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => handleExport('all', 'json')}
                className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
              >
                Full Report JSON
              </button>
              <button 
                onClick={() => alert('Report scheduling feature coming soon!')}
                className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
              >
                Schedule Report
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}