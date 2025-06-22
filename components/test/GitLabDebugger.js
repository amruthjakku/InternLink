'use client';

import { useState, useEffect } from 'react';

export function GitLabDebugger() {
  const [debugInfo, setDebugInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('connection');

  const runDebugCheck = async () => {
    setLoading(true);
    try {
      // Check connection status
      const connectionResponse = await fetch('/api/gitlab/connection-status');
      const connectionData = await connectionResponse.json();

      // Get analytics data
      const analyticsResponse = await fetch('/api/gitlab/intern-analytics');
      const analyticsData = await analyticsResponse.json();

      // Get configuration
      const configResponse = await fetch('/api/gitlab/test-connection');
      const configData = await configResponse.json();

      setDebugInfo({
        connection: connectionData,
        analytics: analyticsData,
        config: configData,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      setDebugInfo({
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const testSync = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/gitlab/sync-commits', {
        method: 'POST'
      });
      const data = await response.json();
      
      // Refresh debug info after sync
      await runDebugCheck();
      
      alert(`Sync completed: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      alert(`Sync failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runDebugCheck();
  }, []);

  const tabs = [
    { id: 'connection', name: 'Connection Status' },
    { id: 'analytics', name: 'Analytics Data' },
    { id: 'config', name: 'Configuration' },
    { id: 'raw', name: 'Raw Data' }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">GitLab Integration Debugger</h2>
            <div className="flex space-x-2">
              <button
                onClick={runDebugCheck}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Checking...' : 'Refresh Debug Info'}
              </button>
              <button
                onClick={testSync}
                disabled={loading}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Syncing...' : 'Test Sync'}
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Loading debug information...</span>
            </div>
          )}

          {!loading && debugInfo && (
            <>
              {activeTab === 'connection' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Connection Status</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <strong>Connected:</strong> 
                        <span className={`ml-2 px-2 py-1 rounded text-sm ${
                          debugInfo.connection.connected 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {debugInfo.connection.connected ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div>
                        <strong>Username:</strong> {debugInfo.connection.username || 'N/A'}
                      </div>
                      <div>
                        <strong>Repositories:</strong> {debugInfo.connection.repositoriesCount || 0}
                      </div>
                      <div>
                        <strong>Last Sync:</strong> {debugInfo.connection.lastSyncAt ? new Date(debugInfo.connection.lastSyncAt).toLocaleString() : 'Never'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'analytics' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Analytics Data</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    {debugInfo.analytics.error ? (
                      <div className="text-red-600">
                        <strong>Error:</strong> {debugInfo.analytics.error}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="bg-white p-3 rounded border">
                            <div className="text-2xl font-bold text-blue-600">
                              {debugInfo.analytics.summary?.totalCommits || 0}
                            </div>
                            <div className="text-sm text-gray-600">Total Commits</div>
                          </div>
                          <div className="bg-white p-3 rounded border">
                            <div className="text-2xl font-bold text-green-600">
                              {debugInfo.analytics.summary?.activeRepositories || 0}
                            </div>
                            <div className="text-sm text-gray-600">Active Repositories</div>
                          </div>
                          <div className="bg-white p-3 rounded border">
                            <div className="text-2xl font-bold text-purple-600">
                              {debugInfo.analytics.summary?.currentStreak || 0}
                            </div>
                            <div className="text-sm text-gray-600">Current Streak</div>
                          </div>
                        </div>
                        
                        {debugInfo.analytics.recentCommits && debugInfo.analytics.recentCommits.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2">Recent Commits ({debugInfo.analytics.recentCommits.length})</h4>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                              {debugInfo.analytics.recentCommits.slice(0, 5).map((commit, index) => (
                                <div key={index} className="bg-white p-2 rounded border text-sm">
                                  <div className="font-medium">{commit.title}</div>
                                  <div className="text-gray-600">
                                    {commit.author_name} • {new Date(commit.created_at).toLocaleString()}
                                    {commit.project && ` • ${commit.project.name}`}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {debugInfo.analytics.repositoryStats && debugInfo.analytics.repositoryStats.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2">Repository Stats ({debugInfo.analytics.repositoryStats.length})</h4>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                              {debugInfo.analytics.repositoryStats.slice(0, 5).map((repo, index) => (
                                <div key={index} className="bg-white p-2 rounded border text-sm">
                                  <div className="font-medium">{repo.name}</div>
                                  <div className="text-gray-600">
                                    {repo.commits} commits • +{repo.additions} -{repo.deletions}
                                    {repo.lastCommit && ` • Last: ${new Date(repo.lastCommit).toLocaleDateString()}`}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'config' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Configuration</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-1 gap-2">
                      <div><strong>GitLab Instance:</strong> {debugInfo.config.gitlabInstance}</div>
                      <div><strong>API Base:</strong> {debugInfo.config.apiBase}</div>
                      <div><strong>Required Scopes:</strong> {debugInfo.config.requiredScopes?.join(', ')}</div>
                      <div><strong>Token URL:</strong> <a href={debugInfo.config.tokenUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{debugInfo.config.tokenUrl}</a></div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'raw' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Raw Debug Data</h3>
                  <div className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto max-h-96">
                    <pre className="text-sm">{JSON.stringify(debugInfo, null, 2)}</pre>
                  </div>
                </div>
              )}
            </>
          )}

          {!loading && debugInfo?.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-red-800">Error</h3>
              <p className="text-red-600">{debugInfo.error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}