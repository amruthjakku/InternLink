'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../AuthProvider';

export function SimpleGitLabTab() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch GitLab data
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/gitlab/simple-analytics');
      const result = await response.json();
      
      if (response.ok) {
        setData(result);
        setError(null);
      } else {
        setError(result.error || 'Failed to fetch data');
        setData(null);
      }
    } catch (err) {
      setError('Network error: ' + err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  // Sync GitLab data
  const handleSync = async () => {
    try {
      setSyncing(true);
      setError(null);
      
      const response = await fetch('/api/gitlab/simple-sync', {
        method: 'POST'
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setMessage(result.message);
        setTimeout(() => setMessage(null), 5000);
        // Refresh data after sync
        await fetchData();
      } else {
        setError(result.error || 'Sync failed');
      }
    } catch (err) {
      setError('Sync error: ' + err.message);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading GitLab data...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="text-red-400 text-xl mr-3">❌</div>
          <div>
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">🦊</div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">GitLab Integration</h2>
              <div className="flex items-center space-x-2 mt-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-600 font-medium">Connected</span>
                {data?.username && (
                  <span className="text-sm text-gray-500">as @{data.username}</span>
                )}
              </div>
            </div>
          </div>
          
          <button
            onClick={handleSync}
            disabled={syncing}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {syncing ? '🔄 Syncing...' : '🔄 Sync Data'}
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mt-6">
          <nav className="flex space-x-6">
            {[
              { id: 'overview', name: 'Overview', icon: '📊' },
              { id: 'repositories', name: 'Repositories', icon: '📁' },
              { id: 'commits', name: 'Recent Commits', icon: '💾' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-green-400 text-xl mr-3">✅</div>
            <p className="text-sm text-green-700">{message}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-red-400 text-xl mr-3">❌</div>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Content */}
      {data && (
        <>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <span className="text-2xl">💾</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Commits</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {data.summary?.totalCommits || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <span className="text-2xl">📁</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Repositories</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {data.summary?.activeRepositories || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <span className="text-2xl">🔥</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Current Streak</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {data.summary?.currentStreak || 0} days
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <span className="text-2xl">📊</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Last Sync</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {data.lastSyncAt ? new Date(data.lastSyncAt).toLocaleDateString() : 'Never'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Repositories Tab */}
          {activeTab === 'repositories' && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Your Repositories ({data.repositoryStats?.length || 0})
                </h3>
              </div>
              
              {data.repositoryStats && data.repositoryStats.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {data.repositoryStats.map((repo, index) => (
                    <div key={index} className="p-6 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="text-lg font-medium text-gray-900">{repo.name}</h4>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              repo.visibility === 'public' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {repo.visibility}
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-3">{repo.path}</p>
                          
                          <div className="flex items-center space-x-6 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <span>💾</span>
                              <span>{repo.commits} commits</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <span className="text-green-600">+{repo.additions}</span>
                              <span className="text-red-600">-{repo.deletions}</span>
                            </div>
                            {repo.lastCommit && (
                              <div className="flex items-center space-x-1">
                                <span>📅</span>
                                <span>Last: {new Date(repo.lastCommit).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {repo.url && (
                          <a
                            href={repo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-4 bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                          >
                            View →
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <div className="text-4xl mb-4">📁</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Repositories Found</h3>
                  <p className="text-gray-600 mb-4">Click "Sync Data" to fetch your repositories</p>
                  <button
                    onClick={handleSync}
                    disabled={syncing}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {syncing ? 'Syncing...' : 'Sync Now'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Commits Tab */}
          {activeTab === 'commits' && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Recent Commits ({data.recentCommits?.length || 0})
                </h3>
              </div>
              
              {data.recentCommits && data.recentCommits.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {data.recentCommits.map((commit, index) => (
                    <div key={index} className="p-6 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-1">{commit.title}</h4>
                          <p className="text-sm text-gray-600 mb-2">{commit.project?.name}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>By {commit.author_name}</span>
                            <span>{new Date(commit.created_at).toLocaleDateString()}</span>
                            {commit.stats && (
                              <span className="text-green-600">+{commit.stats.additions} -{commit.stats.deletions}</span>
                            )}
                          </div>
                        </div>
                        
                        {commit.web_url && (
                          <a
                            href={commit.web_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-4 text-blue-600 hover:text-blue-800 text-sm"
                          >
                            View →
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <div className="text-4xl mb-4">💾</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Commits Found</h3>
                  <p className="text-gray-600 mb-4">Click "Sync Data" to fetch your commits</p>
                  <button
                    onClick={handleSync}
                    disabled={syncing}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {syncing ? 'Syncing...' : 'Sync Now'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Debug Info */}
          {data.debug && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Debug Info</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div>Total stored activities: {data.debug.totalStoredActivities}</div>
                <div>User filtered activities: {data.debug.userFilteredActivities}</div>
                <div>Repositories found: {data.debug.repositoriesFound}</div>
                <div>Filter: {data.debug.filterCriteria.username} ({data.debug.filterCriteria.email})</div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}