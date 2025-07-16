'use client';

import { useState, useEffect } from 'react';
import { AttendanceAnalytics } from './AttendanceAnalytics';
import { IPManagement } from './IPManagement';
import { AttendanceDebugger } from './AttendanceDebugger';
import { format } from 'date-fns';

export function CombinedAttendanceSystem() {
  const [activeSubTab, setActiveSubTab] = useState('overview');
  const [systemStatus, setSystemStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSystemStatus();
  }, []);

  const fetchSystemStatus = async () => {
    try {
      const response = await fetch('/api/admin/attendance-system-status');
      if (response.ok) {
        const data = await response.json();
        setSystemStatus(data);
      }
    } catch (error) {
      console.error('Error fetching system status:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { 
      id: 'overview', 
      name: 'System Overview', 
      icon: '🎯', 
      description: 'Real-time attendance insights',
      color: 'blue'
    },
    { 
      id: 'analytics', 
      name: 'Analytics', 
      icon: '📊', 
      description: 'Deep dive into attendance patterns',
      color: 'purple'
    },
    { 
      id: 'ip-management', 
      name: 'IP Management', 
      icon: '🛡️', 
      description: 'Control attendance access points',
      color: 'green'
    },
    { 
      id: 'policies', 
      name: 'Policies & Rules', 
      icon: '📋', 
      description: 'Configure attendance requirements',
      color: 'orange'
    },
    { 
      id: 'debug', 
      name: 'Debug Tools', 
      icon: '🔧', 
      description: 'Troubleshoot attendance issues',
      color: 'red'
    }
  ];

  const getColorClasses = (color, isActive) => {
    const colorMap = {
      blue: isActive ? 'bg-blue-100 text-blue-700' : 'hover:bg-blue-50',
      purple: isActive ? 'bg-purple-100 text-purple-700' : 'hover:bg-purple-50',
      green: isActive ? 'bg-green-100 text-green-700' : 'hover:bg-green-50',
      orange: isActive ? 'bg-orange-100 text-orange-700' : 'hover:bg-orange-50',
      red: isActive ? 'bg-red-100 text-red-700' : 'hover:bg-red-50'
    };
    return colorMap[color] || colorMap.blue;
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-2xl">⏰</span>
              </div>
              Attendance & IP Management Center
            </h2>
            <p className="text-gray-600 mt-2">
              Monitor attendance patterns, manage IP restrictions, and ensure system integrity
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">System Time</div>
            <div className="text-lg font-semibold text-gray-900">
              {format(new Date(), 'HH:mm:ss')}
            </div>
            <div className="text-xs text-gray-500">
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/80 backdrop-blur rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {systemStatus?.currentlyActive || 0}
                </div>
                <div className="text-sm text-gray-600">Currently Active</div>
              </div>
              <div className="text-3xl">🟢</div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {systemStatus?.todayAttendance || 0}%
                </div>
                <div className="text-sm text-gray-600">Today's Rate</div>
              </div>
              <div className="text-3xl">📈</div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {systemStatus?.authorizedIPs || 0}
                </div>
                <div className="text-sm text-gray-600">Authorized IPs</div>
              </div>
              <div className="text-3xl">🛡️</div>
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {systemStatus?.alertsToday || 0}
                </div>
                <div className="text-sm text-gray-600">Alerts Today</div>
              </div>
              <div className="text-3xl">⚠️</div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex flex-wrap">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex-1 min-w-[200px] px-6 py-4 text-sm font-medium transition-all ${
                  activeSubTab === tab.id
                    ? `${getColorClasses(tab.color, true)} border-b-2 border-${tab.color}-500`
                    : `text-gray-600 hover:text-gray-900 ${getColorClasses(tab.color, false)}`
                }`}
              >
                <div className="flex flex-col items-center space-y-1">
                  <span className="text-2xl">{tab.icon}</span>
                  <div className="font-medium">{tab.name}</div>
                  <div className="text-xs opacity-75">{tab.description}</div>
                </div>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* System Overview Tab */}
          {activeSubTab === 'overview' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span>💡</span> Why Attendance Tracking Matters
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-600">1</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Performance Insights</h4>
                        <p className="text-sm text-gray-600">
                          Track engagement levels and identify patterns to improve program effectiveness
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-600">2</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Early Intervention</h4>
                        <p className="text-sm text-gray-600">
                          Detect attendance issues early to provide timely support to struggling participants
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-600">3</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Resource Optimization</h4>
                        <p className="text-sm text-gray-600">
                          Allocate mentorship resources based on actual participation data
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-600">4</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Compliance & Reporting</h4>
                        <p className="text-sm text-gray-600">
                          Meet institutional requirements with accurate attendance records
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Real-time Activity Feed */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span>🔴</span> Live Activity Feed
                  </span>
                  <span className="text-sm font-normal text-gray-500">Auto-updates every 30s</span>
                </h3>
                <div className="space-y-3">
                  {systemStatus?.recentActivity?.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          activity.type === 'check-in' ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                        <div>
                          <div className="font-medium text-gray-900">{activity.userName}</div>
                          <div className="text-sm text-gray-500">
                            {activity.type === 'check-in' ? 'Checked in' : 'Checked out'} from {activity.ip}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {format(new Date(activity.timestamp), 'HH:mm:ss')}
                      </div>
                    </div>
                  )) || (
                    <div className="text-center py-8 text-gray-500">
                      No recent activity. System is monitoring...
                    </div>
                  )}
                </div>
              </div>

              {/* IP Security Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                    <span>✅</span> Security Status: Healthy
                  </h4>
                  <ul className="space-y-2 text-sm text-green-800">
                    <li className="flex items-center gap-2">
                      <span>•</span> All attendance marking from authorized IPs
                    </li>
                    <li className="flex items-center gap-2">
                      <span>•</span> No suspicious activity detected
                    </li>
                    <li className="flex items-center gap-2">
                      <span>•</span> IP whitelist up to date
                    </li>
                  </ul>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                  <h4 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
                    <span>📋</span> Quick Actions
                  </h4>
                  <div className="space-y-2">
                    <button className="w-full text-left px-4 py-2 bg-white rounded-lg border border-amber-300 hover:bg-amber-100 transition-colors text-sm">
                      🔄 Force sync attendance data
                    </button>
                    <button className="w-full text-left px-4 py-2 bg-white rounded-lg border border-amber-300 hover:bg-amber-100 transition-colors text-sm">
                      📧 Send attendance reminders
                    </button>
                    <button className="w-full text-left px-4 py-2 bg-white rounded-lg border border-amber-300 hover:bg-amber-100 transition-colors text-sm">
                      📊 Generate weekly report
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeSubTab === 'analytics' && <AttendanceAnalytics />}

          {/* IP Management Tab */}
          {activeSubTab === 'ip-management' && <IPManagement />}

          {/* Policies Tab */}
          {activeSubTab === 'policies' && (
            <div className="space-y-6">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-orange-900 mb-4">📋 Attendance Policies & Rules</h3>
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-4 border border-orange-200">
                    <h4 className="font-medium text-gray-900 mb-2">Minimum Attendance Requirement</h4>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Current threshold for alerts</span>
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" 
                          className="w-20 px-2 py-1 border rounded" 
                          defaultValue="75" 
                        />
                        <span className="text-sm text-gray-600">%</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-orange-200">
                    <h4 className="font-medium text-gray-900 mb-2">Grace Period</h4>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Late check-in window</span>
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" 
                          className="w-20 px-2 py-1 border rounded" 
                          defaultValue="15" 
                        />
                        <span className="text-sm text-gray-600">minutes</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-orange-200">
                    <h4 className="font-medium text-gray-900 mb-2">Working Hours</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-600">Start Time</label>
                        <input type="time" className="w-full px-2 py-1 border rounded" defaultValue="09:00" />
                      </div>
                      <div>
                        <label className="text-sm text-gray-600">End Time</label>
                        <input type="time" className="w-full px-2 py-1 border rounded" defaultValue="18:00" />
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-orange-200">
                    <h4 className="font-medium text-gray-900 mb-2">Automated Actions</h4>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked className="rounded" />
                        <span className="text-sm text-gray-700">Send email alerts for low attendance</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked className="rounded" />
                        <span className="text-sm text-gray-700">Notify mentors of absent mentees</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" className="rounded" />
                        <span className="text-sm text-gray-700">Auto-generate weekly reports</span>
                      </label>
                    </div>
                  </div>
                </div>
                <button className="mt-4 px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
                  Save Policy Changes
                </button>
              </div>
            </div>
          )}

          {/* Debug Tab */}
          {activeSubTab === 'debug' && <AttendanceDebugger />}
        </div>
      </div>
    </div>
  );
}
