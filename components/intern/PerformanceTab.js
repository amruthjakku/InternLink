'use client';

import { useState, useEffect } from 'react';
import { Line, Bar, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

export function PerformanceTab({ user, tasks, loading }) {
  const [performanceData, setPerformanceData] = useState({
    weeklyProgress: [],
    categoryPerformance: {},
    timeAnalytics: {},
    streakData: {},
    skillsRadar: {}
  });

  const [selectedPeriod, setSelectedPeriod] = useState('weekly');

  useEffect(() => {
    if (tasks.length > 0) {
      // Calculate performance metrics
      const completedTasks = tasks.filter(t => t.status === 'done');
      const totalTimeSpent = tasks.reduce((sum, task) => sum + (task.time_spent || 0), 0);
      
      // Weekly progress simulation
      const weeklyProgress = [
        { week: 'Week 1', completed: 2, total: 3 },
        { week: 'Week 2', completed: 3, total: 4 },
        { week: 'Week 3', completed: 1, total: 2 },
        { week: 'Week 4', completed: 4, total: 5 },
      ];

      // Category performance
      const categoryStats = {};
      tasks.forEach(task => {
        if (!categoryStats[task.category]) {
          categoryStats[task.category] = { total: 0, completed: 0, timeSpent: 0 };
        }
        categoryStats[task.category].total++;
        categoryStats[task.category].timeSpent += task.time_spent || 0;
        if (task.status === 'done') {
          categoryStats[task.category].completed++;
        }
      });

      // Skills radar data
      const skillsData = {
        'Frontend': 85,
        'Backend': 70,
        'Database': 60,
        'Testing': 45,
        'DevOps': 30,
        'Communication': 80
      };

      setPerformanceData({
        weeklyProgress,
        categoryPerformance: categoryStats,
        timeAnalytics: {
          totalHours: totalTimeSpent,
          averagePerTask: completedTasks.length > 0 ? totalTimeSpent / completedTasks.length : 0,
          mostProductiveDay: 'Wednesday',
          averageSessionLength: 2.5
        },
        streakData: {
          currentStreak: 5,
          longestStreak: 12,
          streakGoal: 30
        },
        skillsRadar: skillsData
      });
    }
  }, [tasks]);

  // Chart configurations
  const weeklyProgressChart = {
    labels: performanceData.weeklyProgress.map(w => w.week),
    datasets: [
      {
        label: 'Tasks Completed',
        data: performanceData.weeklyProgress.map(w => w.completed),
        borderColor: 'rgba(34, 197, 94, 1)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Total Tasks',
        data: performanceData.weeklyProgress.map(w => w.total),
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const categoryPerformanceChart = {
    labels: Object.keys(performanceData.categoryPerformance),
    datasets: [
      {
        label: 'Completion Rate (%)',
        data: Object.values(performanceData.categoryPerformance).map(cat => 
          cat.total > 0 ? (cat.completed / cat.total) * 100 : 0
        ),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)',
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(34, 197, 94, 1)',
          'rgba(251, 191, 36, 1)',
          'rgba(239, 68, 68, 1)',
          'rgba(139, 92, 246, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const skillsRadarChart = {
    labels: Object.keys(performanceData.skillsRadar),
    datasets: [
      {
        label: 'Skill Level',
        data: Object.values(performanceData.skillsRadar),
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(59, 130, 246, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(59, 130, 246, 1)',
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

  const radarOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
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
      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">⏱️</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Hours</p>
              <p className="text-2xl font-bold text-gray-900">{performanceData.timeAnalytics?.totalHours || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">📊</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg per Task</p>
              <p className="text-2xl font-bold text-gray-900">
                {(performanceData.timeAnalytics?.averagePerTask || 0).toFixed(1)}h
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">🔥</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Current Streak</p>
              <p className="text-2xl font-bold text-gray-900">{performanceData.streakData?.currentStreak || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">🎯</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Longest Streak</p>
              <p className="text-2xl font-bold text-gray-900">{performanceData.streakData?.longestStreak || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Performance Analytics</h2>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
        </select>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Weekly Progress Trend</h3>
          <Line data={weeklyProgressChart} options={chartOptions} />
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Category Performance</h3>
          <Bar data={categoryPerformanceChart} options={chartOptions} />
        </div>
      </div>

      {/* Skills Radar and Streak Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Skills Assessment</h3>
          <div className="h-64">
            <Radar data={skillsRadarChart} options={radarOptions} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Streak Progress</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Current Streak</span>
                <span>{performanceData.streakData.currentStreak} / {performanceData.streakData.streakGoal} days</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-orange-500 h-3 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${(performanceData.streakData.currentStreak / performanceData.streakData.streakGoal) * 100}%` 
                  }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 mt-6">
              <div className="text-xs text-gray-500 text-center">S</div>
              <div className="text-xs text-gray-500 text-center">M</div>
              <div className="text-xs text-gray-500 text-center">T</div>
              <div className="text-xs text-gray-500 text-center">W</div>
              <div className="text-xs text-gray-500 text-center">T</div>
              <div className="text-xs text-gray-500 text-center">F</div>
              <div className="text-xs text-gray-500 text-center">S</div>
              
              {/* Activity heatmap simulation */}
              {Array.from({ length: 28 }, (_, i) => (
                <div
                  key={i}
                  className={`w-6 h-6 rounded-sm ${
                    Math.random() > 0.3 
                      ? 'bg-green-500' 
                      : Math.random() > 0.6 
                        ? 'bg-green-300' 
                        : 'bg-gray-200'
                  }`}
                  title={`Day ${i + 1}`}
                ></div>
              ))}
            </div>

            <div className="text-sm text-gray-600 mt-4">
              <p><strong>Most Productive Day:</strong> {performanceData.timeAnalytics?.mostProductiveDay || 'N/A'}</p>
              <p><strong>Average Session:</strong> {performanceData.timeAnalytics?.averageSessionLength || 0}h</p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Category Breakdown */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Category Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Tasks
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completion Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time Spent
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(performanceData.categoryPerformance).map(([category, stats]) => (
                <tr key={category}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {stats.total}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {stats.completed}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <div className="flex-1 mr-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%` }}
                          ></div>
                        </div>
                      </div>
                      <span className="text-sm">
                        {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {stats.timeSpent}h
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}