import { useState } from 'react';

const SystemTools = () => {
  const [activeSubTab, setActiveSubTab] = useState('bulk-operations');

  const subTabs = [
    { id: 'bulk-operations', name: 'Bulk Operations', icon: '📦', description: 'Mass data operations and imports' },
    { id: 'data-integrity', name: 'Data Integrity', icon: '🔧', description: 'Data validation and cleanup tools' },
    { id: 'debug-tools', name: 'Debug Tools', icon: '🔍', description: 'System debugging and diagnostics' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-gray-500 to-slate-500 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">🔧</span>
            </div>
            System Tools & Utilities
          </h2>
          <p className="text-gray-600 mt-1">Administrative tools for system maintenance and operations</p>
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
                    ? 'bg-gray-50 text-gray-700 border-b-2 border-gray-500'
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
          {activeSubTab === 'bulk-operations' && <BulkOperationsTab />}
          {activeSubTab === 'data-integrity' && <DataIntegrityTab />}
          {activeSubTab === 'debug-tools' && <DebugToolsTab />}
        </div>
      </div>
    </div>
  );
};

const BulkOperationsTab = () => {
  const [activeOperation, setActiveOperation] = useState(null);

  const operations = [
    {
      id: 'bulk-user-import',
      name: 'Bulk User Import',
      description: 'Import multiple users from CSV/Excel files',
      icon: '👥',
      color: 'blue'
    },
    {
      id: 'bulk-task-assignment',
      name: 'Bulk Task Assignment',
      description: 'Assign tasks to multiple users or cohorts',
      icon: '📋',
      color: 'green'
    },
    {
      id: 'bulk-college-cohort',
      name: 'Bulk College-Cohort Assignment',
      description: 'Mass assign colleges to cohorts',
      icon: '🏫',
      color: 'purple'
    },
    {
      id: 'data-export',
      name: 'Data Export',
      description: 'Export system data in various formats',
      icon: '📤',
      color: 'orange'
    }
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Bulk Operations Center</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {operations.map((operation) => (
          <div
            key={operation.id}
            onClick={() => setActiveOperation(operation)}
            className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
              activeOperation?.id === operation.id
                ? `border-${operation.color}-500 bg-${operation.color}-50`
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center space-x-4">
              <div className={`w-12 h-12 bg-${operation.color}-100 rounded-lg flex items-center justify-center`}>
                <span className="text-2xl">{operation.icon}</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">{operation.name}</h4>
                <p className="text-sm text-gray-600">{operation.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {activeOperation && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-4">{activeOperation.name}</h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-600 mb-4">{activeOperation.description}</p>
            <button className={`bg-${activeOperation.color}-500 text-white px-4 py-2 rounded-lg hover:bg-${activeOperation.color}-600 transition-colors`}>
              Start {activeOperation.name}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const DataIntegrityTab = () => {
  const [checks, setChecks] = useState([
    { id: 'orphaned-users', name: 'Orphaned Users', status: 'healthy', count: 0 },
    { id: 'missing-colleges', name: 'Users without Colleges', status: 'warning', count: 5 },
    { id: 'invalid-cohorts', name: 'Invalid Cohort Assignments', status: 'healthy', count: 0 },
    { id: 'duplicate-emails', name: 'Duplicate Emails', status: 'error', count: 2 },
    { id: 'inactive-mentors', name: 'Inactive Tech Leads with AI Developer Interns', status: 'warning', count: 3 }
  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return '❓';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Data Integrity Checks</h3>
        <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
          Run All Checks
        </button>
      </div>
      
      <div className="space-y-4">
        {checks.map((check) => (
          <div key={check.id} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{getStatusIcon(check.status)}</span>
                <div>
                  <h4 className="font-medium text-gray-900">{check.name}</h4>
                  <p className="text-sm text-gray-600">
                    {check.count > 0 ? `${check.count} issues found` : 'No issues detected'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(check.status)}`}>
                  {check.status}
                </span>
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 mb-2">🔧 Available Fixes</h4>
        <div className="space-y-2 text-sm text-blue-700">
          <div>• Auto-assign users to appropriate colleges</div>
          <div>• Remove duplicate email addresses</div>
          <div>• Clean up orphaned user records</div>
          <div>• Validate cohort assignments</div>
        </div>
      </div>
    </div>
  );
};

const DebugToolsTab = () => {
  const [logs, setLogs] = useState([
    { timestamp: '2024-01-15 10:30:25', level: 'INFO', message: 'User login successful: admin@example.com' },
    { timestamp: '2024-01-15 10:29:15', level: 'WARNING', message: 'High memory usage detected: 85%' },
    { timestamp: '2024-01-15 10:28:45', level: 'ERROR', message: 'Database connection timeout' },
    { timestamp: '2024-01-15 10:27:12', level: 'INFO', message: 'Task created: "Weekly Progress Report"' },
    { timestamp: '2024-01-15 10:25:33', level: 'DEBUG', message: 'Cache cleared for user sessions' }
  ]);

  const getLevelColor = (level) => {
    switch (level) {
      case 'ERROR': return 'text-red-600 bg-red-100';
      case 'WARNING': return 'text-yellow-600 bg-yellow-100';
      case 'INFO': return 'text-blue-600 bg-blue-100';
      case 'DEBUG': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">System Debug Tools</h3>
        <div className="flex space-x-2">
          <button className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors">
            Clear Cache
          </button>
          <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
            Refresh Logs
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Status */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-4">System Status</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Database Connection</span>
              <span className="text-sm text-green-600 font-medium">✅ Connected</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Redis Cache</span>
              <span className="text-sm text-green-600 font-medium">✅ Active</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">File Storage</span>
              <span className="text-sm text-green-600 font-medium">✅ Available</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Email Service</span>
              <span className="text-sm text-yellow-600 font-medium">⚠️ Slow</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-4">Quick Actions</h4>
          <div className="space-y-3">
            <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="font-medium text-gray-900">🔄 Restart Services</div>
              <div className="text-sm text-gray-600">Restart background services</div>
            </button>
            <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="font-medium text-gray-900">🗄️ Database Backup</div>
              <div className="text-sm text-gray-600">Create immediate backup</div>
            </button>
            <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="font-medium text-gray-900">📊 Generate Report</div>
              <div className="text-sm text-gray-600">System health report</div>
            </button>
          </div>
        </div>
      </div>

      {/* System Logs */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="font-medium text-gray-900 mb-4">Recent System Logs</h4>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {logs.map((log, index) => (
            <div key={index} className="flex items-center space-x-3 text-sm py-2 border-b border-gray-100 last:border-b-0">
              <span className="text-gray-500 font-mono">{log.timestamp}</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${getLevelColor(log.level)}`}>
                {log.level}
              </span>
              <span className="text-gray-900 flex-1">{log.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SystemTools;