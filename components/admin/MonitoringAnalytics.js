import { useState } from 'react';
import { CombinedAttendanceSystem } from './CombinedAttendanceSystem';

const MonitoringAnalytics = () => {
  const [activeSubTab, setActiveSubTab] = useState('attendance');

  const subTabs = [
    { id: 'attendance', name: 'Attendance & IP', icon: '📊', description: 'Attendance analytics and IP management' },
    { id: 'system-health', name: 'System Health', icon: '🖥️', description: 'System monitoring and performance' },
    { id: 'analytics', name: 'Advanced Analytics', icon: '📈', description: 'Detailed analytics and reports' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">📈</span>
            </div>
            Monitoring & Analytics Center
          </h2>
          <p className="text-gray-600 mt-1">Monitor system performance, analyze data, and track metrics</p>
        </div>
      </div>

      {/* Sub-tabs Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-0">
            {subTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex-1 px-6 py-4 text-sm font-medium text-center transition-all ${
                  activeSubTab === tab.id
                    ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-lg">{tab.icon}</span>
                  <div className="text-left">
                    <div className="font-medium">{tab.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{tab.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeSubTab === 'attendance' && <CombinedAttendanceSystem />}
          {activeSubTab === 'system-health' && <SystemHealthTab />}
          {activeSubTab === 'analytics' && <AdvancedAnalyticsTab />}
        </div>
      </div>
    </div>
  );
};

const SystemHealthTab = () => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">System Health Monitoring</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-green-600">99.9%</div>
              <div className="text-sm text-green-700">Uptime</div>
            </div>
            <div className="text-2xl text-green-500">✅</div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-blue-600">45ms</div>
              <div className="text-sm text-blue-700">Response Time</div>
            </div>
            <div className="text-2xl text-blue-500">⚡</div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-yellow-600">2.4GB</div>
              <div className="text-sm text-yellow-700">Memory Usage</div>
            </div>
            <div className="text-2xl text-yellow-500">💾</div>
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-purple-600">156</div>
              <div className="text-sm text-purple-700">Active Users</div>
            </div>
            <div className="text-2xl text-purple-500">👥</div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="font-medium text-gray-900 mb-4">Recent System Events</h4>
        <div className="space-y-3">
          <div className="flex items-center space-x-3 text-sm">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span className="text-gray-600">Database backup completed successfully</span>
            <span className="text-gray-400">2 hours ago</span>
          </div>
          <div className="flex items-center space-x-3 text-sm">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            <span className="text-gray-600">System update deployed</span>
            <span className="text-gray-400">6 hours ago</span>
          </div>
          <div className="flex items-center space-x-3 text-sm">
            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
            <span className="text-gray-600">High memory usage detected</span>
            <span className="text-gray-400">1 day ago</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdvancedAnalyticsTab = () => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Advanced Analytics Dashboard</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-4">User Activity Trends</h4>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-4xl mb-2">📊</div>
              <div>Chart will be rendered here</div>
              <div className="text-sm mt-1">User activity over time</div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-4">Task Completion Rates</h4>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-4xl mb-2">📈</div>
              <div>Chart will be rendered here</div>
              <div className="text-sm mt-1">Task completion trends</div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-4">College Performance</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Tech University</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{width: '85%'}}></div>
                </div>
                <span className="text-sm font-medium text-gray-900">85%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Innovation College</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{width: '78%'}}></div>
                </div>
                <span className="text-sm font-medium text-gray-900">78%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Digital Arts Institute</span>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{width: '92%'}}></div>
                </div>
                <span className="text-sm font-medium text-gray-900">92%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-4">Quick Statistics</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Tasks Created</span>
              <span className="text-lg font-bold text-gray-900">1,247</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Tasks Completed</span>
              <span className="text-lg font-bold text-green-600">1,098</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Active Teams</span>
              <span className="text-lg font-bold text-blue-600">34</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Average Completion Time</span>
              <span className="text-lg font-bold text-purple-600">3.2 days</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonitoringAnalytics;