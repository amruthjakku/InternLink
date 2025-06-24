'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../AuthProvider';
import { GitLabCommitTracker } from '../GitLabCommitTracker';
import { GitLabDebugInfo } from './GitLabDebugInfo';

export function GitLabTab() {
  const { user } = useAuth();
  const [gitlabData, setGitlabData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Debug logging (remove in production)
  if (process.env.NODE_ENV === 'development') {
    console.log('GitLabTab rendered with user:', user);
  }
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
  const [successMessage, setSuccessMessage] = useState(null);
  const [showOAuthConnect, setShowOAuthConnect] = useState(false);
  const [oauthAvailable, setOauthAvailable] = useState(false);

  useEffect(() => {
    checkGitLabConnection();
  }, []);

  const checkGitLabConnection = async () => {
    try {
      setLoading(true);
      
      // First check OAuth status
      const oauthResponse = await fetch('/api/gitlab/oauth-connect');
      if (oauthResponse.ok) {
        const oauthData = await oauthResponse.json();
        setOauthAvailable(oauthData.canConnectViaOAuth);
        
        if (oauthData.canConnectViaOAuth) {
          // User has valid OAuth token, check if already connected
          const statusResponse = await fetch('/api/gitlab/connection-status');
          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            setIsConnected(statusData.connected);
            if (statusData.connected) {
              await fetchGitLabData();
            } else {
              // Has OAuth token but not connected, show OAuth connect option
              setShowOAuthConnect(true);
            }
          }
        } else {
          // No OAuth token, check for existing PAT connection
          const statusResponse = await fetch('/api/gitlab/connection-status');
          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            setIsConnected(statusData.connected);
            if (statusData.connected) {
              await fetchGitLabData();
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking GitLab connection:', error);
      // Only set error if already connected, otherwise show connect UI
      if (isConnected) setError('Failed to check GitLab connection');
    } finally {
      setLoading(false);
    }
  };

  const fetchGitLabData = async () => {
    try {
      const response = await fetch('/api/gitlab/intern-analytics');
      if (response.ok) {
        const data = await response.json();
        if (data.connected === false || data.error === 'GitLab not connected') {
          setIsConnected(false);
          setGitlabData(null);
          // Do NOT set error, just show connect UI
        } else {
          setGitlabData(data);
        }
      } else {
        throw new Error('Failed to fetch GitLab data');
      }
    } catch (error) {
      console.error('Error fetching GitLab data:', error);
      if (isConnected) setError('Failed to fetch GitLab data');
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
        const data = await response.json();
        setIsConnected(true);
        setShowTokenForm(false);
        setSuccessMessage(`Successfully connected to GitLab as @${data.integration?.username}! Found ${data.integration?.repositoriesCount || 0} repositories.`);
        await fetchGitLabData();
        // Clear success message after 5 seconds
        setTimeout(() => setSuccessMessage(null), 5000);
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

  const handleSync = async (fullSync = false, customDays = null) => {
    setSyncing(true);
    setError(null);
    try {
      let url = '/api/gitlab/sync-commits';
      const params = new URLSearchParams();
      
      if (fullSync) {
        params.append('fullSync', 'true');
      } else if (customDays) {
        params.append('days', customDays.toString());
      }
      
      if (params.toString()) {
        url += '?' + params.toString();
      }
      
      const response = await fetch(url, {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        await fetchGitLabData();
        // Show success message with sync results
        if (data.syncResults) {
          const syncType = fullSync ? 'Full sync' : customDays ? `${customDays}-day sync` : 'Sync';
          setSuccessMessage(`${syncType} completed! Found ${data.syncResults.newCommits} new commits and ${data.syncResults.updatedCommits} updated commits from ${data.syncResults.projectsScanned} projects.`);
          setTimeout(() => setSuccessMessage(null), 8000);
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Sync failed');
      }
    } catch (error) {
      console.error('Error syncing GitLab data:', error);
      setError(`Failed to sync GitLab data: ${error.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleOAuthConnect = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/gitlab/oauth-connect', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setIsConnected(true);
        setShowOAuthConnect(false);
        setSuccessMessage(`Successfully connected to GitLab via OAuth! Found ${data.stats?.totalProjects || 0} projects with ${data.stats?.totalCommits || 0} commits.`);
        await fetchGitLabData();
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to connect via OAuth');
      }
    } catch (error) {
      console.error('Error connecting via OAuth:', error);
      setError('Failed to connect via OAuth');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your GitLab account? This will remove all stored data and analytics.')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/gitlab/disconnect', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setIsConnected(false);
        setGitlabData(null);
        setError(null);
        setShowOAuthConnect(false);
        setSuccessMessage(`GitLab account disconnected successfully. Removed ${data.removedData?.activityRecords || 0} activity records.`);
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to disconnect GitLab account');
      }
    } catch (error) {
      console.error('Error disconnecting GitLab:', error);
      setError('Failed to disconnect GitLab account');
    } finally {
      setLoading(false);
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
              Connect your Swecha GitLab account to track your development progress, 
              commits, and contributions across your repositories.
            </p>
            
            {/* OAuth Connect Option (if available) */}
            {showOAuthConnect && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">🎉 Quick Connect Available!</h4>
                <p className="text-blue-700 text-sm mb-4">
                  You're already signed in with GitLab. Connect instantly to start tracking your progress.
                </p>
                <button
                  onClick={handleOAuthConnect}
                  disabled={loading}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium mr-3"
                >
                  {loading ? 'Connecting...' : '🚀 Connect via OAuth'}
                </button>
                <button
                  onClick={() => setShowOAuthConnect(false)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Use Personal Access Token instead
                </button>
              </div>
            )}
            
            {!showTokenForm && !showOAuthConnect ? (
              <div className="space-y-3">
                <button
                  onClick={() => {
                    if (process.env.NODE_ENV === 'development') {
                      console.log('Connect GitLab Account button clicked');
                      console.log('Current state:', { showTokenForm, isConnected, loading });
                    }
                    setShowTokenForm(true);
                    if (process.env.NODE_ENV === 'development') {
                      console.log('showTokenForm set to true');
                    }
                  }}
                  className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors font-medium"
                >
                  Connect with Personal Access Token
                </button>
                {oauthAvailable && (
                  <div>
                    <p className="text-sm text-gray-500 mt-2">or</p>
                    <button
                      onClick={() => setShowOAuthConnect(true)}
                      className="text-blue-600 hover:text-blue-800 text-sm underline"
                    >
                      Use OAuth (Recommended)
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="max-w-md mx-auto">
                {process.env.NODE_ENV === 'development' && (
                  <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
                    Debug: Form is now visible (showTokenForm = {showTokenForm.toString()})
                  </div>
                )}
                <form onSubmit={handleTokenSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      GitLab Username
                    </label>
                    <input
                      type="text"
                      required
                      value={tokenForm.gitlabUsername}
                      onChange={(e) => setTokenForm({...(tokenForm || {}), gitlabUsername: e.target.value})}
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
                      onChange={(e) => setTokenForm({...(tokenForm || {}), personalAccessToken: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="glpat-xxxxxxxxxxxxxxxxxxxx"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Create a token at <a href="https://code.swecha.org/-/profile/personal_access_tokens" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Swecha GitLab → Settings → Access Tokens</a> with 'read_api', 'read_repository', and 'read_user' scopes
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Repository Names (Optional)
                    </label>
                    <input
                      type="text"
                      value={tokenForm.repositories}
                      onChange={(e) => setTokenForm({...(tokenForm || {}), repositories: e.target.value})}
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
      {/* Debug Information */}
      <GitLabDebugInfo gitlabData={gitlabData} integration={{ gitlabUsername: gitlabData?.username, gitlabEmail: gitlabData?.email }} />

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
            {/* Sync Dropdown */}
            <div className="relative">
              <button
                onClick={() => handleSync()}
                disabled={syncing}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm flex items-center space-x-1"
              >
                <span>{syncing ? 'Syncing...' : '🔄 Quick Sync'}</span>
              </button>
            </div>
            
            {/* Full Sync Button */}
            <button
              onClick={() => handleSync(true)}
              disabled={syncing}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors text-sm"
              title="Sync all commits from past year"
            >
              {syncing ? 'Syncing...' : '📅 Full Sync'}
            </button>
            
            {/* Custom Sync Options */}
            <div className="flex space-x-1">
              <button
                onClick={() => handleSync(false, 90)}
                disabled={syncing}
                className="bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors text-xs"
                title="Sync last 90 days"
              >
                90d
              </button>
              <button
                onClick={() => handleSync(false, 180)}
                disabled={syncing}
                className="bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors text-xs"
                title="Sync last 180 days"
              >
                180d
              </button>
            </div>
            
            <button
              onClick={handleDisconnect}
              disabled={loading}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors text-sm"
            >
              🔌 Disconnect
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-6">
            {[
              { id: 'overview', name: 'Overview', icon: '📊' },
              { id: 'repositories', name: 'Repositories', icon: '📁' },
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

      {activeView === 'repositories' && (
        <div className="space-y-6">
          {/* Repository List */}
          {gitlabData?.repositoryStats && gitlabData.repositoryStats.length > 0 ? (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Your Repositories ({gitlabData.repositoryStats.length})
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Repositories where you have commits
                </p>
              </div>
              <div className="divide-y divide-gray-200">
                {gitlabData.repositoryStats.map((repo, index) => (
                  <div key={index} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="text-lg font-medium text-gray-900">{repo.name}</h4>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            repo.visibility === 'public' 
                              ? 'bg-green-100 text-green-800' 
                              : repo.visibility === 'internal'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {repo.visibility}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3">
                          {repo.path}
                        </p>
                        
                        {repo.description && (
                          <p className="text-sm text-gray-700 mb-3">
                            {repo.description}
                          </p>
                        )}
                        
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
                              <span>Last: {formatDate(repo.lastCommit)}</span>
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
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-8">
              <div className="text-center">
                <div className="text-6xl mb-4">📁</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Repositories Found</h3>
                <p className="text-gray-600 mb-6">
                  No repositories with your commits were found. This could mean:
                </p>
                <div className="text-left max-w-md mx-auto space-y-2 text-sm text-gray-600 mb-6">
                  <div className="flex items-start space-x-2">
                    <span>•</span>
                    <span>You haven't made any commits yet</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span>•</span>
                    <span>Your commits are older than the sync period</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span>•</span>
                    <span>Your GitLab username/email doesn't match</span>
                  </div>
                </div>
                <button
                  onClick={() => handleSync(true)}
                  disabled={syncing}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {syncing ? 'Syncing...' : 'Try Full Sync (1 Year)'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeView === 'commits' && (
        <div className="space-y-6">
          <GitLabCommitTracker gitlabData={gitlabData} />

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

      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <div className="text-green-400 text-xl mr-3">✅</div>
            <div>
              <h3 className="text-sm font-medium text-green-800">Success</h3>
              <p className="text-sm text-green-700 mt-1">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      {isConnected && error && (
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