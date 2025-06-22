'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../AuthProvider';

export function GitLabTab() {
  const { user } = useAuth();
  const [gitlabData, setGitlabData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTokenForm, setShowTokenForm] = useState(false);
  const [tokenForm, setTokenForm] = useState({
    personalAccessToken: '',
    gitlabUsername: '',
    repositories: ''
  });
  const [isConnected, setIsConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [activeView, setActiveView] = useState('overview'); // overview, commits, analytics

  useEffect(() => {
    checkGitLabConnection();
  }, []);

  const checkGitLabConnection = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/gitlab/connection-status');
      if (response.ok) {
        const data = await response.json();
        setIsConnected(data.connected);
        if (data.connected) {
          await fetchGitLabData();
        }
      }
    } catch (error) {
      console.error('Error checking GitLab connection:', error);
      setError('Failed to check GitLab connection');
    } finally {
      setLoading(false);
    }
  };

  const fetchGitLabData = async () => {
    try {
      const response = await fetch('/api/gitlab/intern-analytics');
      if (response.ok) {
        const data = await response.json();
        setGitlabData(data);
      } else {
        throw new Error('Failed to fetch GitLab data');
      }
    } catch (error) {
      console.error('Error fetching GitLab data:', error);
      setError('Failed to fetch GitLab data');
    }
  };

  const handleTokenSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/gitlab/connect-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tokenForm),
      });

      if (response.ok) {
        setIsConnected(true);
        setShowTokenForm(false);
        await fetchGitLabData();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to connect GitLab');
      }
    } catch (error) {
      console.error('Error connecting GitLab:', error);
      setError('Failed to connect GitLab');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const response = await fetch('/api/gitlab/sync-commits', {
        method: 'POST',
      });
      
      if (response.ok) {
        await fetchGitLabData();
      } else {
        throw new Error('Sync failed');
      }
    } catch (error) {
      console.error('Error syncing GitLab data:', error);
      setError('Failed to sync GitLab data');
    } finally {
      setSyncing(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCommitFrequencyColor = (count) => {
    if (count === 0) return 'bg-gray-100';
    if (count <= 2) return 'bg-green-200';
    if (count <= 5) return 'bg-green-400';
    if (count <= 10) return 'bg-green-600';
    return 'bg-green-800';
  };

  if (loading && !gitlabData) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🦊</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Connect Your GitLab Account</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Connect your GitLab account using a Personal Access Token to track your development progress, 
              commits, and contributions across your repositories.
            </p>
            
            {!showTokenForm ? (
              <button
                onClick={() => setShowTokenForm(true)}
                className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors font-medium"
              >
                Connect GitLab Account
              </button>
            ) : (
              <div className="max-w-md mx-auto">
                <form onSubmit={handleTokenSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      GitLab Username
                    </label>
                    <input
                      type="text"
                      required
                      value={tokenForm.gitlabUsername}
                      onChange={(e) => setTokenForm({...tokenForm, gitlabUsername: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="your-gitlab-username"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Personal Access Token
                    </label>
                    <input
                      type="password"
                      required
                      value={tokenForm.personalAccessToken}
                      onChange={(e) => setTokenForm({...tokenForm, personalAccessToken: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="glpat-xxxxxxxxxxxxxxxxxxxx"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Create a token at GitLab → Settings → Access Tokens with 'read_api' and 'read_repository' scopes
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Repository Names (Optional)
                    </label>
                    <input
                      type="text"
                      value={tokenForm.repositories}
                      onChange={(e) => setTokenForm({...tokenForm, repositories: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="repo1, repo2, repo3 (leave empty for all repos)"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Comma-separated list of specific repositories to track
                    </p>
                  </div>
                  
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}
                  
                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 disabled:opacity-50 transition-colors"
                    >
                      {loading ? 'Connecting...' : 'Connect Account'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowTokenForm(false)}
                      className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Connection Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">🦊</div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">GitLab Integration</h2>
              <div className="flex items-center space-x-2 mt-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-600 font-medium">Connected</span>
                {gitlabData?.username && (
                  <span className="text-sm text-gray-500">as @{gitlabData.username}</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
            >
              {syncing ? 'Syncing...' : '🔄 Sync Now'}
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-6">
            {[
              { id: 'overview', name: 'Overview', icon: '📊' },
              { id: 'commits', name: 'Commits', icon: '💾' },
              { id: 'analytics', name: 'Analytics', icon: '📈' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeView === tab.id
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content based on active view */}
      {activeView === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Summary Cards */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-2xl">💾</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Commits</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {gitlabData?.summary?.totalCommits || 0}
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
                <p className="text-sm font-medium text-gray-600">Active Repos</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {gitlabData?.summary?.activeRepositories || 0}
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
                  {gitlabData?.summary?.currentStreak || 0} days
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <span className="text-2xl">📅</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Week</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {gitlabData?.summary?.weeklyCommits || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeView === 'commits' && (
        <div className="space-y-6">
          {/* Recent Commits */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Commits</h3>
            <div className="space-y-4">
              {gitlabData?.recentCommits?.length > 0 ? (
                gitlabData.recentCommits.slice(0, 10).map((commit, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{commit.title}</p>
                        <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                          <span>📁 {commit.project}</span>
                          <span>🌿 {commit.branch}</span>
                          <span>📅 {formatDate(commit.created_at)}</span>
                        </div>
                        {commit.stats && (
                          <div className="flex items-center space-x-4 mt-1 text-sm">
                            <span className="text-green-600">+{commit.stats.additions}</span>
                            <span className="text-red-600">-{commit.stats.deletions}</span>
                          </div>
                        )}
                      </div>
                      <a
                        href={commit.web_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        View →
                      </a>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">📝</div>
                  <p>No commits found. Start coding to see your activity here!</p>
                </div>
              )}
            </div>
          </div>

          {/* Commit Activity Heatmap */}
          {gitlabData?.commitHeatmap && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Commit Activity (Last 90 Days)</h3>
              <div className="grid grid-cols-13 gap-1">
                {gitlabData.commitHeatmap.map((day, index) => (
                  <div
                    key={index}
                    className={`w-3 h-3 rounded-sm ${getCommitFrequencyColor(day.count)}`}
                    title={`${day.date}: ${day.count} commits`}
                  ></div>
                ))}
              </div>
              <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
                <span>Less</span>
                <div className="flex space-x-1">
                  <div className="w-3 h-3 bg-gray-100 rounded-sm"></div>
                  <div className="w-3 h-3 bg-green-200 rounded-sm"></div>
                  <div className="w-3 h-3 bg-green-400 rounded-sm"></div>
                  <div className="w-3 h-3 bg-green-600 rounded-sm"></div>
                  <div className="w-3 h-3 bg-green-800 rounded-sm"></div>
                </div>
                <span>More</span>
              </div>
            </div>
          )}
        </div>
      )}

      {activeView === 'analytics' && (
        <div className="space-y-6">
          {/* Language Usage */}
          {gitlabData?.languages && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Programming Languages</h3>
              <div className="space-y-3">
                {Object.entries(gitlabData.languages).map(([language, percentage]) => (
                  <div key={language} className="flex items-center">
                    <div className="w-24 text-sm text-gray-600">{language}</div>
                    <div className="flex-1 mx-4">
                      <div className="bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="w-12 text-sm text-gray-600 text-right">{percentage}%</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weekly Activity Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Activity</h3>
            {gitlabData?.weeklyActivity ? (
              <div className="space-y-2">
                {gitlabData.weeklyActivity.map((week, index) => (
                  <div key={index} className="flex items-center">
                    <div className="w-20 text-sm text-gray-600">{week.week}</div>
                    <div className="flex-1 mx-4">
                      <div className="bg-gray-200 rounded-full h-4">
                        <div
                          className="bg-green-600 h-4 rounded-full flex items-center justify-center"
                          style={{ width: `${Math.min(100, (week.commits / 20) * 100)}%` }}
                        >
                          {week.commits > 0 && (
                            <span className="text-xs text-white font-medium">{week.commits}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📊</div>
                <p>No activity data available</p>
              </div>
            )}
          </div>

          {/* Repository Contributions */}
          {gitlabData?.repositoryStats && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Repository Contributions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {gitlabData.repositoryStats.map((repo, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{repo.name}</h4>
                      <span className="text-sm text-gray-500">{repo.commits} commits</span>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">{repo.description}</div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-green-600">+{repo.additions}</span>
                      <span className="text-red-600">-{repo.deletions}</span>
                      <span className="text-gray-500">Last: {formatDate(repo.lastCommit)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="text-red-400 text-xl mr-3">⚠️</div>
            <div>
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}