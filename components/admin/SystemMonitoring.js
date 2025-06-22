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
      const [realTimeResponse, metricsResponse, usageResponse, performanceResponse] = await Promise.all([
        fetch('/api/admin/system/realtime').catch(() => ({ ok: false })),
        fetch('/api/admin/system/metrics').catch(() => ({ ok: false })),
        fetch('/api/admin/system/usage').catch(() => ({ ok: false })),
        fetch('/api/admin/system/performance').catch(() => ({ ok: false }))
      ]);

      if (realTimeResponse.ok) {
        const data = await realTimeResponse.json();
        setRealTimeData(data.metrics || getDefaultRealTimeData());
      } else {
        setRealTimeData(getDefaultRealTimeData());
      }

      if (metricsResponse.ok) {
        const data = await metricsResponse.json();
        setSystemMetrics(data.metrics || []);
      } else {
        setSystemMetrics([]);
      }

      if (usageResponse.ok) {
        const data = await usageResponse.json();
        setUsageAnalytics(data.analytics || getDefaultUsageAnalytics());
      } else {
        setUsageAnalytics(getDefaultUsageAnalytics());
      }

      if (performanceResponse.ok) {
        const data = await performanceResponse.json();
        setPerformanceData(data.performance || {});
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
    networkTraffic: 0
  });

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

  // System metrics chart data
  const systemMetricsData = {
    labels: systemMetrics.map(d => format(d.date, 'MMM dd')),
    datasets: [
      {
        label: 'Server Load (%)',
        data: systemMetrics.map(d => d.serverLoad),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Active Users',
        data: systemMetrics.map(d => d.activeUsers),
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
            <span className="text-lg font-bold text-gray-900">{realTimeData.networkTraffic} MB/s</span>
          </div>
          <div className="text-xs text-gray-500">
            ↗️ Incoming: {Math.floor(realTimeData.networkTraffic * 0.6)} MB/s
          </div>
          <div className="text-xs text-gray-500">
            ↙️ Outgoing: {Math.floor(realTimeData.networkTraffic * 0.4)} MB/s
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