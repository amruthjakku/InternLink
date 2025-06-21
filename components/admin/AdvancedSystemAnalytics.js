'use client';

import { useState, useEffect } from 'react';
import { EnhancedLineChart, EnhancedBarChart, MetricCard, ActivityHeatmap } from '../Charts';
import { format, subDays, eachDayOfInterval, eachHourOfInterval, startOfDay, endOfDay } from 'date-fns';

export function AdvancedSystemAnalytics() {
  const [systemMetrics, setSystemMetrics] = useState({});
  const [usageAnalytics, setUsageAnalytics] = useState({});
  const [performanceData, setPerformanceData] = useState({});
  const [predictions, setPredictions] = useState({});
  const [realTimeData, setRealTimeData] = useState({});
  const [timeframe, setTimeframe] = useState('24h'); // '1h', '24h', '7d', '30d'

  useEffect(() => {
    // Generate real-time system data
    const generateRealTimeData = () => ({
      serverLoad: Math.floor(Math.random() * 40) + 30, // 30-70%
      activeUsers: Math.floor(Math.random() * 50) + 120, // 120-170
      userGrowth: (Math.random() - 0.5) * 20, // -10% to +10%
      responseTime: Math.floor(Math.random() * 300) + 150, // 150-450ms
      errorRate: Math.random() * 2, // 0-2%
      totalErrors: Math.floor(Math.random() * 20) + 5, // 5-25
      memoryUsage: Math.floor(Math.random() * 30) + 50, // 50-80%
      diskUsage: Math.floor(Math.random() * 20) + 60, // 60-80%
      networkTraffic: Math.floor(Math.random() * 100) + 200, // 200-300 MB/s
      databaseConnections: Math.floor(Math.random() * 50) + 80 // 80-130
    });

    // Generate usage analytics
    const generateUsageAnalytics = () => {
      // User activity heatmap (24 hours x 7 days)
      const heatmap = Array.from({ length: 7 }, () =>
        Array.from({ length: 24 }, () => Math.floor(Math.random() * 50) + 10)
      );

      // Feature usage data
      const features = [
        { name: 'Dashboard', usage: 85, trend: 5.2 },
        { name: 'Task Management', usage: 72, trend: 8.1 },
        { name: 'User Profile', usage: 68, trend: -2.3 },
        { name: 'Reports', usage: 45, trend: 12.5 },
        { name: 'Settings', usage: 32, trend: -1.8 },
        { name: 'GitLab Integration', usage: 28, trend: 15.7 },
        { name: 'Analytics', usage: 22, trend: 9.4 },
        { name: 'Notifications', usage: 18, trend: 3.6 }
      ];

      // User behavior patterns
      const behaviorPatterns = {
        avgSessionDuration: 45, // minutes
        bounceRate: 12, // percentage
        pageViews: 8.5, // per session
        returnUserRate: 68, // percentage
        mobileUsage: 35, // percentage
        peakHours: [9, 10, 11, 14, 15, 16], // hours of day
        mostActiveDay: 'Tuesday'
      };

      return {
        heatmap,
        features,
        behaviorPatterns
      };
    };

    // Generate performance data
    const generatePerformanceData = () => {
      const slowQueries = [
        {
          id: 1,
          query: 'SELECT * FROM users JOIN tasks ON users.id = tasks.user_id WHERE...',
          duration: 2340,
          count: 45,
          lastExecuted: '2024-01-16 14:23:15',
          impact: 'high'
        },
        {
          id: 2,
          query: 'SELECT COUNT(*) FROM activity_logs WHERE created_at > ...',
          duration: 1890,
          count: 23,
          lastExecuted: '2024-01-16 14:18:42',
          impact: 'medium'
        },
        {
          id: 3,
          query: 'UPDATE user_stats SET last_active = NOW() WHERE user_id = ...',
          duration: 1250,
          count: 156,
          lastExecuted: '2024-01-16 14:25:01',
          impact: 'medium'
        }
      ];

      const slowEndpoints = [
        {
          path: '/api/admin/analytics/detailed',
          method: 'GET',
          avgDuration: 3200,
          requests: 234,
          errorRate: 2.1,
          impact: 'high'
        },
        {
          path: '/api/tasks/bulk-update',
          method: 'POST',
          avgDuration: 2800,
          requests: 89,
          errorRate: 1.2,
          impact: 'medium'
        },
        {
          path: '/api/users/search',
          method: 'GET',
          avgDuration: 1900,
          requests: 445,
          errorRate: 0.8,
          impact: 'medium'
        }
      ];

      const systemHealth = {
        cpu: Math.floor(Math.random() * 30) + 40, // 40-70%
        memory: Math.floor(Math.random() * 25) + 55, // 55-80%
        disk: Math.floor(Math.random() * 20) + 60, // 60-80%
        network: Math.floor(Math.random() * 40) + 30, // 30-70%
        database: Math.floor(Math.random() * 20) + 70 // 70-90%
      };

      return {
        slowQueries,
        slowEndpoints,
        systemHealth
      };
    };

    // Generate predictive analytics
    const generatePredictions = () => {
      const timeline = eachDayOfInterval({
        start: subDays(new Date(), 30),
        end: subDays(new Date(), -30)
      }).map(date => format(date, 'MMM dd'));

      const actualUsers = Array.from({ length: 30 }, (_, i) => 
        Math.floor(Math.random() * 20) + 100 + i * 2
      );

      const predictedUsers = Array.from({ length: 30 }, (_, i) => 
        actualUsers[29] + (i + 1) * 3 + Math.floor(Math.random() * 10)
      );

      const loadTimeline = eachDayOfInterval({
        start: subDays(new Date(), 14),
        end: subDays(new Date(), -14)
      }).map(date => format(date, 'MMM dd'));

      const currentLoad = Array.from({ length: 14 }, () => 
        Math.floor(Math.random() * 30) + 40
      );

      const predictedLoad = Array.from({ length: 14 }, (_, i) => 
        currentLoad[13] + (i + 1) * 2 + Math.floor(Math.random() * 10)
      );

      const recommendations = [
        'Consider scaling server resources as user growth is projected to increase by 25% next month',
        'Database query optimization needed - 3 slow queries identified affecting performance',
        'Implement caching for frequently accessed endpoints to reduce response times',
        'Monitor disk usage closely - projected to reach 85% capacity in 2 weeks',
        'Consider load balancing as peak hour traffic is increasing consistently'
      ];

      return {
        timeline,
        actualUsers,
        predictedUsers,
        loadTimeline,
        currentLoad,
        predictedLoad,
        recommendations
      };
    };

    // Generate system metrics
    const generateSystemMetrics = () => {
      const days = eachDayOfInterval({
        start: subDays(new Date(), 30),
        end: new Date()
      });

      const dailyMetrics = days.map(date => ({
        date,
        requests: Math.floor(Math.random() * 5000) + 10000,
        users: Math.floor(Math.random() * 100) + 200,
        errors: Math.floor(Math.random() * 50) + 10,
        responseTime: Math.floor(Math.random() * 200) + 150
      }));

      return {
        dailyMetrics,
        totalRequests: dailyMetrics.reduce((sum, day) => sum + day.requests, 0),
        avgResponseTime: Math.round(dailyMetrics.reduce((sum, day) => sum + day.responseTime, 0) / dailyMetrics.length),
        totalErrors: dailyMetrics.reduce((sum, day) => sum + day.errors, 0),
        uptime: 99.8
      };
    };

    setRealTimeData(generateRealTimeData());
    setUsageAnalytics(generateUsageAnalytics());
    setPerformanceData(generatePerformanceData());
    setPredictions(generatePredictions());
    setSystemMetrics(generateSystemMetrics());

    // Update real-time data every 30 seconds
    const interval = setInterval(() => {
      setRealTimeData(generateRealTimeData());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const getActivityColor = (activity) => {
    if (activity > 40) return 'bg-green-500';
    if (activity > 25) return 'bg-yellow-500';
    if (activity > 10) return 'bg-orange-500';
    return 'bg-gray-300';
  };

  const getDayName = (dayIndex) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[dayIndex];
  };

  const getHealthColor = (percentage) => {
    if (percentage > 80) return 'text-red-600';
    if (percentage > 60) return 'text-yellow-600';
    return 'text-green-600';
  };

  // Chart data
  const systemMetricsData = {
    labels: systemMetrics.dailyMetrics?.map(d => format(d.date, 'MMM dd')) || [],
    datasets: [
      {
        label: 'Daily Requests',
        data: systemMetrics.dailyMetrics?.map(d => d.requests) || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Response Time (ms)',
        data: systemMetrics.dailyMetrics?.map(d => d.responseTime) || [],
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true,
        yAxisID: 'y1'
      }
    ]
  };

  const featureUsageData = {
    labels: usageAnalytics.features?.map(f => f.name) || [],
    datasets: [{
      data: usageAnalytics.features?.map(f => f.usage) || [],
      backgroundColor: [
        '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
        '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280'
      ]
    }]
  };

  const userGrowthData = {
    labels: predictions.timeline || [],
    datasets: [
      {
        label: 'Actual Users',
        data: predictions.actualUsers || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4
      },
      {
        label: 'Predicted Users',
        data: [...Array(30).fill(null), ...predictions.predictedUsers] || [],
        borderColor: 'rgb(16, 185, 129)',
        borderDash: [5, 5],
        tension: 0.4
      }
    ]
  };

  const systemLoadData = {
    labels: predictions.loadTimeline || [],
    datasets: [
      {
        label: 'Current Load',
        data: predictions.currentLoad || [],
        borderColor: 'rgb(147, 51, 234)',
        backgroundColor: 'rgba(147, 51, 234, 0.1)',
        tension: 0.4
      },
      {
        label: 'Predicted Load',
        data: [...Array(14).fill(null), ...predictions.predictedLoad] || [],
        borderColor: 'rgb(239, 68, 68)',
        borderDash: [5, 5],
        tension: 0.4
      }
    ]
  };

  return (
    <div className="space-y-6">
      {/* Real-time System Monitoring */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Server Load</p>
              <p className="text-2xl font-bold text-blue-600">
                {realTimeData.serverLoad || 0}%
              </p>
            </div>
            <div className="text-3xl">🖥️</div>
          </div>
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  (realTimeData.serverLoad || 0) > 80 ? 'bg-red-500' :
                  (realTimeData.serverLoad || 0) > 60 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${realTimeData.serverLoad || 0}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-green-600">
                {realTimeData.activeUsers || 0}
              </p>
            </div>
            <div className="text-3xl">👥</div>
          </div>
          <div className="mt-2">
            <div className="text-xs text-gray-600">
              {realTimeData.userGrowth >= 0 ? '↗️' : '↘️'} 
              {Math.abs(realTimeData.userGrowth || 0).toFixed(1)}% from yesterday
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Response Time</p>
              <p className="text-2xl font-bold text-purple-600">
                {realTimeData.responseTime || 0}ms
              </p>
            </div>
            <div className="text-3xl">⚡</div>
          </div>
          <div className="mt-2">
            <div className={`text-xs ${
              (realTimeData.responseTime || 0) < 200 ? 'text-green-600' :
              (realTimeData.responseTime || 0) < 500 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {(realTimeData.responseTime || 0) < 200 ? 'Excellent' :
               (realTimeData.responseTime || 0) < 500 ? 'Good' : 'Needs Attention'}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Error Rate</p>
              <p className="text-2xl font-bold text-red-600">
                {(realTimeData.errorRate || 0).toFixed(1)}%
              </p>
            </div>
            <div className="text-3xl">⚠️</div>
          </div>
          <div className="mt-2">
            <div className="text-xs text-gray-600">
              {realTimeData.totalErrors || 0} errors in last hour
            </div>
          </div>
        </div>
      </div>

      {/* System Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total Requests"
          value={systemMetrics.totalRequests?.toLocaleString() || '0'}
          change={12.5}
          icon="📊"
          color="blue"
        />
        <MetricCard
          title="Avg Response Time"
          value={`${systemMetrics.avgResponseTime || 0}ms`}
          change={-8.3}
          icon="⚡"
          color="green"
        />
        <MetricCard
          title="System Uptime"
          value={`${systemMetrics.uptime || 0}%`}
          change={0.2}
          icon="🟢"
          color="purple"
        />
        <MetricCard
          title="Total Errors"
          value={systemMetrics.totalErrors || 0}
          change={-15.7}
          icon="🚨"
          color="red"
        />
      </div>

      {/* System Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">📈 System Metrics Trends</h3>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>
          <EnhancedLineChart 
            data={systemMetricsData} 
            height={300}
            options={{
              scales: {
                y: {
                  type: 'linear',
                  display: true,
                  position: 'left',
                  title: { display: true, text: 'Requests' }
                },
                y1: {
                  type: 'linear',
                  display: true,
                  position: 'right',
                  title: { display: true, text: 'Response Time (ms)' },
                  grid: { drawOnChartArea: false }
                }
              }
            }}
          />
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">🎯 Feature Usage Distribution</h3>
          <EnhancedBarChart data={featureUsageData} height={300} />
        </div>
      </div>

      {/* User Activity Heatmap */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4">📊 User Activity Heatmap</h3>
        <div className="grid grid-cols-25 gap-1">
          <div></div> {/* Empty corner */}
          {Array.from({ length: 24 }, (_, hour) => (
            <div key={hour} className="text-center text-xs text-gray-500 p-1">
              {hour}
            </div>
          ))}
          {Array.from({ length: 7 }, (_, day) => (
            <div key={day} className="contents">
              <div className="text-xs text-gray-500 p-1 text-right">
                {getDayName(day)}
              </div>
              {Array.from({ length: 24 }, (_, hour) => {
                const activity = usageAnalytics.heatmap?.[day]?.[hour] || 0;
                return (
                  <div
                    key={hour}
                    className={`w-4 h-4 rounded-sm ${getActivityColor(activity)}`}
                    title={`${getDayName(day)} ${hour}:00 - ${activity} users`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Performance Bottlenecks */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4">🚨 Performance Bottlenecks</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Slow Queries */}
          <div>
            <h4 className="font-medium mb-3">Slow Database Queries</h4>
            <div className="space-y-2">
              {performanceData.slowQueries?.map(query => (
                <div key={query.id} className="p-3 border rounded">
                  <div className="flex justify-between items-start mb-2">
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                      {query.query.substring(0, 50)}...
                    </code>
                    <span className="text-red-600 font-medium">{query.duration}ms</span>
                  </div>
                  <div className="text-xs text-gray-600">
                    Executed {query.count} times • Last: {query.lastExecuted}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* API Endpoints */}
          <div>
            <h4 className="font-medium mb-3">Slow API Endpoints</h4>
            <div className="space-y-2">
              {performanceData.slowEndpoints?.map(endpoint => (
                <div key={endpoint.path} className="p-3 border rounded">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        endpoint.method === 'GET' ? 'bg-blue-100 text-blue-700' :
                        endpoint.method === 'POST' ? 'bg-green-100 text-green-700' :
                        endpoint.method === 'PUT' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {endpoint.method}
                      </span>
                      <code className="ml-2 text-sm">{endpoint.path}</code>
                    </div>
                    <span className="text-red-600 font-medium">{endpoint.avgDuration}ms</span>
                  </div>
                  <div className="text-xs text-gray-600">
                    {endpoint.requests} requests • {endpoint.errorRate}% error rate
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="mt-6">
          <h4 className="font-medium mb-3">System Health</h4>
          <div className="grid grid-cols-5 gap-4">
            {Object.entries(performanceData.systemHealth || {}).map(([component, usage]) => (
              <div key={component} className="text-center">
                <div className={`text-2xl font-bold ${getHealthColor(usage)}`}>
                  {usage}%
                </div>
                <div className="text-sm text-gray-600 capitalize">{component}</div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div 
                    className={`h-2 rounded-full ${
                      usage > 80 ? 'bg-red-500' :
                      usage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${usage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Predictive Analytics */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4">🔮 Predictive Analytics</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Growth Prediction */}
          <div>
            <h4 className="font-medium mb-3">User Growth Forecast</h4>
            <EnhancedLineChart 
              data={userGrowthData} 
              height={250}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: 'top' }
                }
              }}
            />
          </div>

          {/* System Load Prediction */}
          <div>
            <h4 className="font-medium mb-3">System Load Forecast</h4>
            <EnhancedLineChart 
              data={systemLoadData} 
              height={250}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: 'top' }
                }
              }}
            />
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium mb-3">🎯 AI Recommendations</h4>
          <div className="space-y-2">
            {predictions.recommendations?.map((rec, index) => (
              <div key={index} className="flex items-start space-x-2">
                <div className="text-blue-600 mt-1">•</div>
                <div className="text-sm text-blue-800">{rec}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}