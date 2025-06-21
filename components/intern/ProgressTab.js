'use client';

import { useState, useEffect } from 'react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

export function ProgressTab({ user, tasks, loading }) {
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    notStartedTasks: 0,
    completionRate: 0,
    totalTimeSpent: 0,
    averageTaskTime: 0,
    streakDays: 0
  });

  useEffect(() => {
    if (tasks.length > 0) {
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(t => t.status === 'done').length;
      const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
      const notStartedTasks = tasks.filter(t => t.status === 'not_started').length;
      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
      const totalTimeSpent = tasks.reduce((sum, task) => sum + (task.time_spent || 0), 0);
      const averageTaskTime = completedTasks > 0 ? totalTimeSpent / completedTasks : 0;

      setStats({
        totalTasks,
        completedTasks,
        inProgressTasks,
        notStartedTasks,
        completionRate,
        totalTimeSpent,
        averageTaskTime,
        streakDays: 5 // Mock streak data
      });
    }
  }, [tasks]);

  // Chart data
  const progressChartData = {
    labels: tasks.map(task => task.title.length > 20 ? task.title.substring(0, 20) + '...' : task.title),
    datasets: [
      {
        label: 'Progress (%)',
        data: tasks.map(task => task.progress),
        backgroundColor: tasks.map(task => {
          if (task.status === 'done') return 'rgba(34, 197, 94, 0.8)';
          if (task.status === 'in_progress') return 'rgba(59, 130, 246, 0.8)';
          return 'rgba(156, 163, 175, 0.8)';
        }),
        borderColor: tasks.map(task => {
          if (task.status === 'done') return 'rgba(34, 197, 94, 1)';
          if (task.status === 'in_progress') return 'rgba(59, 130, 246, 1)';
          return 'rgba(156, 163, 175, 1)';
        }),
        borderWidth: 1,
      },
    ],
  };

  const statusChartData = {
    labels: ['Completed', 'In Progress', 'Not Started'],
    datasets: [
      {
        data: [stats.completedTasks, stats.inProgressTasks, stats.notStartedTasks],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(156, 163, 175, 0.8)',
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(156, 163, 175, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Weekly activity mock data
  const weeklyActivityData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Hours Worked',
        data: [3, 4, 2, 5, 6, 1, 2],
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow animate-pulse">
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow animate-pulse">
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Quick Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-white text-2xl font-bold">
                {user?.name?.charAt(0)?.toUpperCase() || '?'}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{user?.name}</h3>
              <p className="text-sm text-gray-600">
                {user?.college_name ? `${user.college_name}` : 'College not selected'}
                {user?.cohort_name && ` • ${user.cohort_name}`}
              </p>
              <div className="flex items-center mt-1 space-x-2">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  user?.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : user?.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {user?.status === 'active' ? '✅ Active' : 
                   user?.status === 'pending' ? '⏳ Pending Approval' : '❓ Status Unknown'}
                </span>
                {user?.is_demo && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    🧪 Demo Mode
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{stats.completionRate.toFixed(0)}%</div>
            <div className="text-sm text-gray-500">Completion Rate</div>
            <div className="text-sm text-gray-600 mt-1">
              {stats.completedTasks} of {stats.totalTasks} tasks done
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                <span className="text-white text-lg">📝</span>
              </div>
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-600">Total Tasks</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalTasks}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-sm">
                <span className="text-white text-lg">✅</span>
              </div>
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.completedTasks}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
                <span className="text-white text-lg">📊</span>
              </div>
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-600">Completion Rate</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.completionRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-sm">
                <span className="text-white text-lg">🔥</span>
              </div>
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-600">Streak Days</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.streakDays}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
        <div className="bg-white p-6 lg:p-8 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Task Progress</h3>
            <div className="text-sm text-gray-500">Individual task completion</div>
          </div>
          <div className="h-80">
            <Bar data={progressChartData} options={{...chartOptions, maintainAspectRatio: false}} />
          </div>
        </div>

        <div className="bg-white p-6 lg:p-8 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Task Status Distribution</h3>
            <div className="text-sm text-gray-500">Overall status breakdown</div>
          </div>
          <div className="h-80 flex items-center justify-center">
            <Doughnut data={statusChartData} options={{ 
              responsive: true, 
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'bottom',
                  labels: {
                    padding: 20,
                    usePointStyle: true,
                  }
                }
              }
            }} />
          </div>
        </div>
      </div>

      {/* Weekly Activity */}
      <div className="bg-white p-6 lg:p-8 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Weekly Activity</h3>
            <p className="text-sm text-gray-500 mt-1">Your progress over the past week</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Last 7 days
            </span>
          </div>
        </div>
        <div className="h-80">
          <Line data={weeklyActivityData} options={{...chartOptions, maintainAspectRatio: false}} />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 lg:p-8 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          <span className="text-sm text-gray-500">Last 5 updates</span>
        </div>
        <div className="space-y-4">
          {tasks
            .filter(task => task.status !== 'not_started')
            .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
            .slice(0, 5)
            .map((task) => (
              <div key={task.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                <div className={`w-4 h-4 rounded-full flex-shrink-0 ${
                  task.status === 'done' ? 'bg-green-500' : 'bg-blue-500'
                }`}></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {task.status === 'done' ? '✅ Completed' : '🔄 Updated'} on {new Date(task.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-3 flex-shrink-0">
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">{task.progress}%</div>
                    <div className="w-16 bg-gray-200 rounded-full h-1.5 mt-1">
                      <div 
                        className={`h-1.5 rounded-full ${
                          task.status === 'done' ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${task.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          {tasks.filter(task => task.status !== 'not_started').length === 0 && (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-2">📝</div>
              <p className="text-gray-500">No recent activity yet</p>
              <p className="text-sm text-gray-400">Start working on your tasks to see activity here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}