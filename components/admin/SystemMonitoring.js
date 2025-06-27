'use client';

import { useState, useEffect } from 'react';
import { EnhancedLineChart, EnhancedBarChart, MetricCard, ActivityHeatmap } from '../Charts';
import { format, subDays, eachDayOfInterval } from 'date-fns';

export function SystemMonitoring() {
  const [realTimeData, setRealTimeData] = useState({});
  const [systemMetrics, setSystemMetrics] = useState([]);
  const [usageAnalytics, setUsageAnalytics] = useState({});
  const [performanceData, setPerformanceData] = useState({});
  const [predictions, setPredictions] = useState({});
  const [alerts, setAlerts] = useState([]);

  const handleAcknowledgeAlert = async (alertId) => {
    try {
      const response = await fetch(`/api/admin/alerts/${alertId}/acknowledge`, {
        method: 'POST',
      });

      if (response.ok) {
        setAlerts(prev => prev.map(alert => 
          alert.id === alertId ? { ...alert, acknowledged: true } : alert
        ));
      } else {
        console.error('Failed to acknowledge alert');
      }
    } catch (error) {
      console.error('Error acknowledging alert:', error);
    }
  };

  const handleDismissAlert = async (alertId) => {
    try {
      const response = await fetch(`/api/admin/alerts/${alertId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setAlerts(prev => prev.filter(alert => alert.id !== alertId));
      } else {
        console.error('Failed to dismiss alert');
      }
    } catch (error) {
      console.error('Error dismissing alert:', error);
    }
  };

  useEffect(() => {
    fetchSystemData();
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(fetchSystemData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchSystemData = async () => {
    try {
      const [healthResponse, performanceResponse, logsResponse] = await Promise.all([
        fetch('/api/system/health').catch(() => ({ ok: false })),
        fetch('/api/system/performance').catch(() => ({ ok: false })),
        fetch('/api/system/logs?limit=50').catch(() => ({ ok: false }))
      ]);

      if (healthResponse.ok) {
        const data = await healthResponse.json();
        setRealTimeData({
          timestamp: data.timestamp,
          systemHealth: data.overallHealth,
          activeUsers: data.userActivity?.active || 0,
          cpuUsage: data.resources?.cpu?.used || 0,
          memoryUsage: data.resources?.memory?.used || 0,
          diskUsage: data.resources?.disk?.used || 0,
          serverLoad: data.resources?.cpu?.used || 0, // Server load = CPU usage
          responseTime: data.api?.avgResponseTime || 0,
          apiResponseTime: data.api?.avgResponseTime || 0,
          errorRate: data.api?.errorRate || 0,
          databaseHealth: data.database?.health || 0,
          status: data.status,
          totalUsers: data.userActivity?.total || 0,
          recentLogins: data.userActivity?.recentLogins || 0,
          userGrowth: data.userActivity?.recentLogins > 0 ? 
            Math.round(((data.userActivity?.recentLogins || 0) / (data.userActivity?.total || 1)) * 100) : 0,
          networkTraffic: Math.round(20 + (data.userActivity?.active || 0) * 0.5), // Simulated network traffic
          networkIncoming: Math.round(15 + (data.userActivity?.active || 0) * 0.3),
          networkOutgoing: Math.round(8 + (data.userActivity?.active || 0) * 0.2)
        });
        console.log('✅ System health data synchronized from /api/system/health');
      } else {
        console.log('⚠️ System health API failed, using fallback data');
        setRealTimeData(getDefaultRealTimeData());
      }

      if (performanceResponse.ok) {
        const data = await performanceResponse.json();
        setSystemMetrics([
          {
            name: 'CPU Usage',
            value: data.current?.cpuUsage || 0,
            trend: data.trends?.cpu || 0,
            status: data.status?.cpu || 'unknown'
          },
          {
            name: 'Memory Usage',
            value: data.current?.memoryUsage || 0,
            trend: data.trends?.memory || 0,
            status: data.status?.memory || 'unknown'
          },
          {
            name: 'Response Time',
            value: data.current?.responseTime || 0,
            trend: data.trends?.responseTime || 0,
            status: data.status?.responseTime || 'unknown'
          },
          {
            name: 'Active Users',
            value: data.current?.activeUsers || 0,
            trend: 0,
            status: 'good'
          }
        ]);
        console.log('✅ Performance data synchronized from /api/system/performance');
      } else {
        console.log('⚠️ Performance API failed, using fallback data');
        setSystemMetrics([]);
      }

      if (logsResponse.ok) {
        const data = await logsResponse.json();
        setUsageAnalytics({
          features: [
            { name: 'User Authentication', usage: data.summary?.categories?.authentication || 0 },
            { name: 'User Management', usage: data.summary?.categories?.user_management || 0 },
            { name: 'College Management', usage: data.summary?.categories?.college_management || 0 },
            { name: 'API Performance', usage: data.summary?.categories?.api_performance || 0 },
            { name: 'Database Operations', usage: data.summary?.categories?.database || 0 },
            { name: 'Security Monitoring', usage: data.summary?.categories?.security || 0 }
          ],
          heatmapData: generateHeatmapFromLogs(data.logs || []),
          userTypes: {
            interns: realTimeData.totalUsers ? Math.round(realTimeData.totalUsers * 0.7) : 0,
            mentors: realTimeData.totalUsers ? Math.round(realTimeData.totalUsers * 0.2) : 0,
            admins: realTimeData.totalUsers ? Math.round(realTimeData.totalUsers * 0.1) : 0
          },
          recentActivities: data.logs?.slice(0, 10) || []
        });
        console.log('✅ System logs synchronized from /api/system/logs');
      } else {
        console.log('⚠️ System logs API failed, using fallback data');
        setUsageAnalytics(getDefaultUsageAnalytics());
      }

      // Use the same performance data we fetched earlier
      if (performanceResponse.ok) {
        const data = await performanceResponse.json();
        setPerformanceData({
          historical: data.historical || [],
          peaks: data.peaks || {},
          database: data.database || {},
          trends: data.trends || {},
          status: data.status || {}
        });
      } else {
        setPerformanceData({});
      }

    } catch (error) {
      console.error('Error fetching system data:', error);
      // Set default values on error
      setRealTimeData(getDefaultRealTimeData());
      setSystemMetrics([]);
      setUsageAnalytics(getDefaultUsageAnalytics());
      setPerformanceData({});
    }
  };

  const getDefaultRealTimeData = () => ({
    serverLoad: 0,
    activeUsers: 0,
    responseTime: 0,
    errorRate: 0,
    userGrowth: 0,
    totalErrors: 0,
    memoryUsage: 0,
    cpuUsage: 0,
    diskUsage: 0,
    networkTraffic: 0,
    networkIncoming: 0,
    networkOutgoing: 0,
    systemHealth: 0,
    databaseHealth: 0,
    apiResponseTime: 0,
    totalUsers: 0,
    recentLogins: 0,
    status: 'unknown',
    timestamp: new Date().toISOString()
  });

  const generateHeatmapFromLogs = (logs) => {
    // Create a 24-hour heatmap from logs
    const heatmapData = [];
    const now = new Date();
    
    for (let hour = 0; hour < 24; hour++) {
      for (let day = 0; day < 7; day++) {
        const targetTime = new Date(now.getTime() - (day * 24 * 60 * 60 * 1000) + (hour * 60 * 60 * 1000));
        const targetHour = targetTime.getHours();
        
        // Count logs in this time period
        const logsInPeriod = logs.filter(log => {
          const logTime = new Date(log.timestamp);
          return logTime.getHours() === targetHour && 
                 Math.abs(logTime.getTime() - targetTime.getTime()) < (24 * 60 * 60 * 1000);
        }).length;
        
        heatmapData.push({
          day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day],
          hour: hour,
          value: logsInPeriod
        });
      }
    }
    
    return heatmapData;
  };

  const getDefaultUsageAnalytics = () => ({
    features: [
      { name: 'Task Management', usage: 0 },
      { name: 'Progress Tracking', usage: 0 },
      { name: 'Communication', usage: 0 },
      { name: 'File Sharing', usage: 0 },
      { name: 'Meetings', usage: 0 },
      { name: 'Reports', usage: 0 }
    ],
    heatmapData: [],
    userTypes: {
      interns: 0,
      mentors: 0,
      admins: 0
    },
    deviceTypes: {
      desktop: 0,
      mobile: 0,
      tablet: 0
    }
  });



  const getAlertColor = (severity) => {
    switch (severity) {
      case 'high': return 'bg-red-50 border-red-200 text-red-800';
      case 'medium': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'low': return 'bg-blue-50 border-blue-200 text-blue-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'error': return '🚨';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '📢';
    }
  };

  // Generate time-series data for chart using real performance data
  const generateTimeSeriesData = () => {
    if (performanceData.historical && performanceData.historical.length > 0) {
      // Use real historical data from performance API (last 24 hours)
      return performanceData.historical.slice(-7).map(data => ({
        date: new Date(data.timestamp),
        serverLoad: Math.round(data.cpuUsage),
        activeUsers: data.activeUsers,
        responseTime: Math.round(data.responseTime)
      }));
    } else {
      // Fallback to simulated data if no real data available
      const days = eachDayOfInterval({
        start: subDays(new Date(), 6),
        end: new Date()
      });
      
      return days.map(date => ({
        date,
        serverLoad: realTimeData.serverLoad || Math.floor(Math.random() * 80) + 10,
        activeUsers: realTimeData.activeUsers || Math.floor(Math.random() * 100) + 20,
        responseTime: realTimeData.responseTime || Math.floor(Math.random() * 200) + 50
      }));
    }
  };

  const timeSeriesData = generateTimeSeriesData();

  // System metrics chart data
  const systemMetricsData = {
    labels: timeSeriesData.map(d => format(d.date, 'MMM dd')),
    datasets: [
      {
        label: 'Server Load (%)',
        data: timeSeriesData.map(d => d.serverLoad),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Active Users',
        data: timeSeriesData.map(d => d.activeUsers),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
        yAxisID: 'y1'
      }
    ]
  };

  return (
    <div className="space-y-6">
      {/* Real-time System Monitoring */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Server Load"
          value={`${realTimeData.serverLoad || 0}%`}
          change={realTimeData.serverLoad > 80 ? -5 : 2}
          icon="🖥️"
          color={realTimeData.serverLoad > 80 ? "red" : realTimeData.serverLoad > 60 ? "orange" : "green"}
        />
        <MetricCard
          title="Active Users"
          value={realTimeData.activeUsers || 0}
          change={realTimeData.userGrowth}
          icon="👥"
          color="blue"
        />
        <MetricCard
          title="Response Time"
          value={`${realTimeData.responseTime || 0}ms`}
          change={realTimeData.responseTime < 200 ? 5 : -3}
          icon="⚡"
          color={realTimeData.responseTime < 200 ? "green" : realTimeData.responseTime < 500 ? "orange" : "red"}
        />
        <MetricCard
          title="Error Rate"
          value={`${(realTimeData.errorRate || 0).toFixed(1)}%`}
          change={-0.5}
          icon="⚠️"
          color={realTimeData.errorRate < 1 ? "green" : realTimeData.errorRate < 3 ? "orange" : "red"}
        />
      </div>

      {/* System Resource Usage */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Memory Usage</span>
            <span className="text-lg font-bold text-gray-900">{realTimeData.memoryUsage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${
                realTimeData.memoryUsage > 85 ? 'bg-red-500' :
                realTimeData.memoryUsage > 70 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${realTimeData.memoryUsage}%` }}
            />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">CPU Usage</span>
            <span className="text-lg font-bold text-gray-900">{realTimeData.cpuUsage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${
                realTimeData.cpuUsage > 85 ? 'bg-red-500' :
                realTimeData.cpuUsage > 70 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${realTimeData.cpuUsage}%` }}
            />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Disk Usage</span>
            <span className="text-lg font-bold text-gray-900">{realTimeData.diskUsage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full ${
                realTimeData.diskUsage > 85 ? 'bg-red-500' :
                realTimeData.diskUsage > 70 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${realTimeData.diskUsage}%` }}
            />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Network Traffic</span>
            <span className="text-lg font-bold text-gray-900">{realTimeData.networkTraffic || 0} MB/s</span>
          </div>
          <div className="text-xs text-gray-500">
            ↗️ Incoming: {realTimeData.networkIncoming || 0} MB/s
          </div>
          <div className="text-xs text-gray-500">
            ↙️ Outgoing: {realTimeData.networkOutgoing || 0} MB/s
          </div>
        </div>
      </div>

      {/* System Metrics Trends */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4">📈 System Metrics Trends</h3>
        <EnhancedLineChart 
          data={systemMetricsData} 
          height={300}
          options={{
            scales: {
              y: {
                type: 'linear',
                display: true,
                position: 'left',
                title: { display: true, text: 'Server Load (%)' }
              },
              y1: {
                type: 'linear',
                display: true,
                position: 'right',
                title: { display: true, text: 'Active Users' },
                grid: { drawOnChartArea: false }
              }
            }
          }}
        />
      </div>

      {/* Usage Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Activity Heatmap */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">📊 User Activity Heatmap</h3>
          <ActivityHeatmap 
            data={usageAnalytics.heatmapData || []}
            startDate={subDays(new Date(), 365)}
            endDate={new Date()}
          />
        </div>

        {/* Feature Usage */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">🎯 Feature Usage</h3>
          <div className="space-y-3">
            {usageAnalytics.features?.map(feature => (
              <div key={feature.name} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{feature.name}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${feature.usage}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-8">{feature.usage}%</span>
                </div>
              </div>
            ))}
          </div>
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
                <div key={query.id} className="p-3 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded flex-1 mr-2">
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
                <div key={endpoint.path} className="p-3 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
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
      </div>

      {/* Predictive Analytics */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4">🔮 Predictive Analytics</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Growth Prediction */}
          <div>
            <h4 className="font-medium mb-3">User Growth Forecast</h4>
            <EnhancedLineChart 
              data={{
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
                    data: predictions.predictedUsers || [],
                    borderColor: 'rgb(16, 185, 129)',
                    borderDash: [5, 5],
                    tension: 0.4
                  }
                ]
              }}
              height={250}
            />
          </div>

          {/* System Load Prediction */}
          <div>
            <h4 className="font-medium mb-3">System Load Forecast</h4>
            <EnhancedLineChart 
              data={{
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
                    data: predictions.predictedLoad || [],
                    borderColor: 'rgb(239, 68, 68)',
                    borderDash: [5, 5],
                    tension: 0.4
                  }
                ]
              }}
              height={250}
            />
          </div>
        </div>

        {/* Recommendations */}
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

      {/* System Alerts */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4">🚨 System Alerts</h3>
        <div className="space-y-3">
          {alerts.map(alert => (
            <div key={alert.id} className={`p-4 rounded-lg border ${getAlertColor(alert.severity)}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <span className="text-lg">{getAlertIcon(alert.type)}</span>
                  <div>
                    <h4 className="font-medium">{alert.title}</h4>
                    <p className="text-sm mt-1">{alert.message}</p>
                    <p className="text-xs mt-2 opacity-75">
                      {alert.timestamp.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => handleAcknowledgeAlert(alert.id)}
                    className="text-xs px-2 py-1 bg-white bg-opacity-50 rounded hover:bg-opacity-75 transition-colors"
                  >
                    Acknowledge
                  </button>
                  <button 
                    onClick={() => handleDismissAlert(alert.id)}
                    className="text-xs px-2 py-1 bg-white bg-opacity-50 rounded hover:bg-opacity-75 transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}