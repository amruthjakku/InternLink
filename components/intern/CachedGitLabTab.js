'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../AuthProvider';
import { useGitLabAnalytics, useGitLabCommits, useGitLabRepositories, useGitLabMergeRequests, useGitLabConnectionStatus } from '../../hooks/useGitLabData';
import { 
  GitLabOverviewSkeleton, 
  GitLabCommitsSkeleton, 
  GitLabAnalyticsSkeleton,
  GitLabRepositoriesSkeleton,
  GitLabMergeRequestsSkeleton,
  GitLabConnectionSkeleton
} from '../skeletons/GitLabSkeleton';

export function CachedGitLabTab() {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState('overview');
  const [showOAuthConnect, setShowOAuthConnect] = useState(false);
  const [showTokenForm, setShowTokenForm] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [error, setError] = useState(null);
  const [tokenForm, setTokenForm] = useState({
    personalAccessToken: '',
    gitlabUsername: '',
    repositories: ''
  });

  // Use our enhanced hooks with caching
  const {
    data: connectionStatus,
    loading: connectionLoading,
    error: connectionError,
    showSkeleton: showConnectionSkeleton,
    refresh: refreshConnection
  } = useGitLabConnectionStatus();

  const {
    data: analytics,
    loading: analyticsLoading,
    error: analyticsError,
    showSkeleton: showAnalyticsSkeleton,
    fromCache: analyticsFromCache,
    refresh: refreshAnalytics
  } = useGitLabAnalytics();

  const {
    data: commits,
    loading: commitsLoading,
    error: commitsError,
    showSkeleton: showCommitsSkeleton,
    fromCache: commitsFromCache,
    refresh: refreshCommits
  } = useGitLabCommits(30);

  const {
    data: repositories,
    loading: repositoriesLoading,
    error: repositoriesError,
    showSkeleton: showRepositoriesSkeleton,
    fromCache: repositoriesFromCache,
    refresh: refreshRepositories
  } = useGitLabRepositories();

  const {
    data: mergeRequests,
    loading: mergeRequestsLoading,
    error: mergeRequestsError,
    showSkeleton: showMergeRequestsSkeleton,
    fromCache: mergeRequestsFromCache,
    refresh: refreshMergeRequests
  } = useGitLabMergeRequests('opened');

  // Determine if user is connected
  const isConnected = connectionStatus?.connected === true;

  // Auto-detect OAuth availability
  useEffect(() => {
    const checkOAuthAvailability = async () => {
      try {
        const response = await fetch('/api/gitlab/oauth-connect');
        if (response.ok) {
          const data = await response.json();
          setShowOAuthConnect(data.canConnectViaOAuth && !isConnected);
        }
      } catch (error) {
        console.log('OAuth availability check failed:', error);
      }
    };

    if (!isConnected && !connectionLoading) {
      checkOAuthAvailability();
    }
  }, [isConnected, connectionLoading]);

  // Handle OAuth connection
  const handleOAuthConnect = async () => {
    try {
      const response = await fetch('/api/gitlab/oauth-connect', { method: 'POST' });
      if (response.ok) {
        const data = await response.json();
        if (data.authUrl) {
          window.location.href = data.authUrl;
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to initiate OAuth connection');
      }
    } catch (error) {
      setError('Failed to connect with OAuth: ' + error.message);
    }
  };

  // Handle token connection
  const handleTokenSubmit = async (e) => {
    e.preventDefault();
    setSyncing(true);

    if (!tokenForm.personalAccessToken || !tokenForm.gitlabUsername) {
      setError('Please fill in both GitLab username and Personal Access Token');
      setSyncing(false);
      return;
    }

    try {
      const response = await fetch('/api/gitlab/connect-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tokenForm),
      });

      if (response.ok) {
        const data = await response.json();
        setSuccessMessage(`Successfully connected to GitLab as @${data.integration?.username}!`);
        setShowTokenForm(false);
        await refreshConnection();
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to connect GitLab');
      }
    } catch (error) {
      setError('Connection failed: ' + error.message);
    } finally {
      setSyncing(false);
    }
  };

  // Handle sync data
  const handleSync = async () => {
    if (!isConnected) return;

    setSyncing(true);
    try {
      const response = await fetch('/api/gitlab/sync', { method: 'POST' });
      if (response.ok) {
        setSuccessMessage('GitLab data synced successfully!');
        // Refresh all data
        await Promise.all([
          refreshAnalytics(),
          refreshCommits(),
          refreshRepositories(),
          refreshMergeRequests()
        ]);
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Sync failed');
      }
    } catch (error) {
      setError('Sync failed: ' + error.message);
    } finally {
      setSyncing(false);
    }
  };

  // Handle disconnect
  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect GitLab? This will remove all your GitLab data.')) {
      return;
    }

    try {
      const response = await fetch('/api/gitlab/disconnect', { method: 'POST' });
      if (response.ok) {
        setSuccessMessage('GitLab disconnected successfully');
        await refreshConnection();
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Disconnect failed');
      }
    } catch (error) {
      setError('Disconnect failed: ' + error.message);
    }
  };

  // Loading state for initial connection check
  if (showConnectionSkeleton) {
    return <GitLabConnectionSkeleton />;
  }

  // Not connected state
  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            GitLab Integration
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Connect your GitLab account to track your commits, projects, and development activity
          </p>
        </div>

        {successMessage && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
            <p className="text-green-800 dark:text-green-200">{successMessage}</p>
          </div>
        )}

        {(error || connectionError) && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-800 dark:text-red-200">{error || connectionError}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* OAuth Connection */}
          {showOAuthConnect && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                Quick Connect (Recommended)
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Connect securely using OAuth. This is the easiest and most secure way.
              </p>
              <button
                onClick={handleOAuthConnect}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Connect with GitLab OAuth
              </button>
            </div>
          )}

          {/* Token Connection */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Personal Access Token
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Connect using a Personal Access Token from your GitLab account.
            </p>
            
            {!showTokenForm ? (
              <button
                onClick={() => setShowTokenForm(true)}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Connect with Token
              </button>
            ) : (
              <form onSubmit={handleTokenSubmit} className="space-y-4">
                <div>
                  <label htmlFor="gitlabUsername" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    GitLab Username
                  </label>
                  <input
                    type="text"
                    id="gitlabUsername"
                    value={tokenForm.gitlabUsername}
                    onChange={(e) => setTokenForm({...tokenForm, gitlabUsername: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="your-username"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="personalAccessToken" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Personal Access Token
                  </label>
                  <input
                    type="password"
                    id="personalAccessToken"
                    value={tokenForm.personalAccessToken}
                    onChange={(e) => setTokenForm({...tokenForm, personalAccessToken: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="glpat-xxxxxxxxxxxxxxxxxxxx"
                    required
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Token should start with 'glpat-'
                  </p>
                </div>

                <div className="flex space-x-2">
                  <button
                    type="submit"
                    disabled={syncing}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    {syncing ? 'Connecting...' : 'Connect'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowTokenForm(false)}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Need help? Check out our{' '}
            <a href="#" className="text-blue-500 hover:text-blue-600">
              GitLab integration guide
            </a>
          </p>
        </div>
      </div>
    );
  }

  // Connected state - show main interface with cached data and skeletons
  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            GitLab Dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Connected as @{connectionStatus?.username || user?.gitlabUsername}
          </p>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          {/* Cache indicators */}
          {(analyticsFromCache || commitsFromCache || repositoriesFromCache) && (
            <div className="flex items-center space-x-1">
              <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                📦 Cached Data
              </span>
            </div>
          )}
          
          <button
            onClick={handleSync}
            disabled={syncing}
            className="bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
          >
            {syncing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Syncing...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Sync</span>
              </>
            )}
          </button>
          
          <button
            onClick={handleDisconnect}
            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 px-3 py-2 transition-colors"
          >
            Disconnect
          </button>
        </div>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
          <p className="text-green-800 dark:text-green-200">{successMessage}</p>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="flex space-x-8">
          {[
            { key: 'overview', label: 'Overview', icon: '📊' },
            { key: 'commits', label: 'Commits', icon: '💻' },
            { key: 'repositories', label: 'Repositories', icon: '📁' },
            { key: 'merge-requests', label: 'Merge Requests', icon: '🔀' },
            { key: 'analytics', label: 'Analytics', icon: '📈' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveView(tab.key)}
              className={`flex items-center space-x-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeView === tab.key
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content based on active view with skeleton loading */}
      <div className="min-h-96">
        {activeView === 'overview' && (
          showAnalyticsSkeleton ? (
            <GitLabOverviewSkeleton />
          ) : (
            <GitLabOverview analytics={analytics} error={analyticsError} />
          )
        )}
        
        {activeView === 'commits' && (
          showCommitsSkeleton ? (
            <GitLabCommitsSkeleton />
          ) : (
            <GitLabCommits commits={commits} error={commitsError} />
          )
        )}
        
        {activeView === 'repositories' && (
          showRepositoriesSkeleton ? (
            <GitLabRepositoriesSkeleton />
          ) : (
            <GitLabRepositories repositories={repositories} error={repositoriesError} />
          )
        )}
        
        {activeView === 'merge-requests' && (
          showMergeRequestsSkeleton ? (
            <GitLabMergeRequestsSkeleton />
          ) : (
            <GitLabMergeRequests mergeRequests={mergeRequests} error={mergeRequestsError} />
          )
        )}
        
        {activeView === 'analytics' && (
          showAnalyticsSkeleton ? (
            <GitLabAnalyticsSkeleton />
          ) : (
            <GitLabAnalytics analytics={analytics} error={analyticsError} />
          )
        )}
      </div>

      {/* Cache Performance Debug Panel */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
          <details className="text-sm">
            <summary className="cursor-pointer text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
              Cache & Performance Debug
            </summary>
            <div className="mt-2 space-y-2 text-xs bg-gray-50 dark:bg-gray-800 p-3 rounded">
              <p><strong>Connection:</strong> {isConnected ? '✅ Connected' : '❌ Disconnected'}</p>
              <p><strong>Analytics:</strong> {analyticsFromCache ? '📦 Cached' : '🔄 Fresh'} {analyticsLoading && '⏳ Loading'}</p>
              <p><strong>Commits:</strong> {commitsFromCache ? '📦 Cached' : '🔄 Fresh'} {commitsLoading && '⏳ Loading'}</p>
              <p><strong>Repositories:</strong> {repositoriesFromCache ? '📦 Cached' : '🔄 Fresh'} {repositoriesLoading && '⏳ Loading'}</p>
              <p><strong>Merge Requests:</strong> {mergeRequestsFromCache ? '📦 Cached' : '🔄 Fresh'} {mergeRequestsLoading && '⏳ Loading'}</p>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}

/* Individual view components that handle data properly */
function GitLabOverview({ analytics, error }) {
  if (error) {
    return (
      <div className="text-center py-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-600 dark:text-red-400">Failed to load overview: {error}</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 dark:text-gray-400">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Stats Cards with gradients */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium opacity-90">Total Commits</h3>
              <p className="text-3xl font-bold">{analytics.summary?.totalCommits || 0}</p>
            </div>
            <div className="text-2xl opacity-80">💻</div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium opacity-90">Active Repositories</h3>
              <p className="text-3xl font-bold">{analytics.summary?.activeRepositories || 0}</p>
            </div>
            <div className="text-2xl opacity-80">📁</div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium opacity-90">Current Streak</h3>
              <p className="text-3xl font-bold">{analytics.summary?.currentStreak || 0}</p>
            </div>
            <div className="text-2xl opacity-80">🔥</div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium opacity-90">Total Projects</h3>
              <p className="text-3xl font-bold">{analytics.summary?.totalProjects || 0}</p>
            </div>
            <div className="text-2xl opacity-80">🚀</div>
          </div>
        </div>
      </div>

      {/* Recent Activity with enhanced styling */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <span className="mr-2">📈</span>
          Recent Commits
        </h3>
        {analytics.recentCommits?.length ? (
          <div className="space-y-3">
            {analytics.recentCommits.slice(0, 5).map((commit, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 102 0V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 1a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{commit.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-2">
                    <span>{commit.project?.name}</span>
                    <span>•</span>
                    <span>{new Date(commit.created_at).toLocaleDateString()}</span>
                    {commit.stats && (
                      <>
                        <span>•</span>
                        <span className="text-green-600">+{commit.stats.additions}</span>
                        <span className="text-red-600">-{commit.stats.deletions}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">📝</div>
            <p className="text-gray-500 dark:text-gray-400">No recent commits</p>
          </div>
        )}
      </div>
    </div>
  );
}

function GitLabCommits({ commits, error }) {
  if (error) {
    return (
      <div className="text-center py-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-600 dark:text-red-400">Failed to load commits: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <span className="mr-2">💻</span>
          Recent Commits
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
          {commits?.recentCommits?.length || 0} commits
        </span>
      </div>
      
      {commits?.recentCommits?.length ? (
        <div className="space-y-3">
          {commits.recentCommits.map((commit, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 102 0V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 1a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 dark:text-white truncate">{commit.title}</h4>
                  {commit.message && commit.message !== commit.title && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">{commit.message}</p>
                  )}
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                      {new Date(commit.created_at).toLocaleDateString()}
                    </span>
                    <span className="flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                      </svg>
                      {commit.project?.name}
                    </span>
                    {commit.stats && (
                      <span className="flex items-center space-x-1">
                        <span className="text-green-600">+{commit.stats.additions}</span>
                        <span className="text-red-600">-{commit.stats.deletions}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No commits found</h3>
          <p className="text-gray-500 dark:text-gray-400">Your commits will appear here once you sync your GitLab data</p>
        </div>
      )}
    </div>
  );
}

function GitLabRepositories({ repositories, error }) {
  if (error) {
    return (
      <div className="text-center py-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-600 dark:text-red-400">Failed to load repositories: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <span className="mr-2">📁</span>
          Repositories
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
          {repositories?.repositoryStats?.length || 0} repositories
        </span>
      </div>
      
      {repositories?.repositoryStats?.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {repositories.repositoryStats.map((repo, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-semibold text-gray-900 dark:text-white truncate flex-1">{repo.name}</h4>
                <span className={`px-2 py-1 rounded text-xs font-medium ml-2 ${
                  repo.visibility === 'public' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                }`}>
                  {repo.visibility || 'private'}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2 min-h-[2.5rem]">
                {repo.description || 'No description available'}
              </p>
              
              <div className="grid grid-cols-3 gap-4 text-center mb-3">
                <div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{repo.commits}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Commits</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-green-600">+{repo.additions}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Additions</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-red-600">-{repo.deletions}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Deletions</p>
                </div>
              </div>
              
              {repo.lastCommit && (
                <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
                  Last commit: {new Date(repo.lastCommit).toLocaleDateString()}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📁</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No repositories found</h3>
          <p className="text-gray-500 dark:text-gray-400">Your repositories will appear here once you sync your GitLab data</p>
        </div>
      )}
    </div>
  );
}

function GitLabMergeRequests({ mergeRequests, error }) {
  if (error) {
    return (
      <div className="text-center py-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-600 dark:text-red-400">Failed to load merge requests: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <span className="mr-2">🔀</span>
          Merge Requests
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
          {mergeRequests?.length || 0} open
        </span>
      </div>
      
      {mergeRequests?.length ? (
        <div className="space-y-3">
          {mergeRequests.map((mr, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">{mr.title}</h4>
                  {mr.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">{mr.description}</p>
                  )}
                  <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414L2.586 8l3.707-3.707a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {mr.source_branch} → {mr.target_branch}
                    </span>
                    <span>{new Date(mr.created_at).toLocaleDateString()}</span>
                    <span>{mr.project?.name}</span>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ml-4 ${
                  mr.state === 'opened' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : mr.state === 'merged'
                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                }`}>
                  {mr.state}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔀</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No merge requests found</h3>
          <p className="text-gray-500 dark:text-gray-400">Your merge requests will appear here once available</p>
        </div>
      )}
    </div>
  );
}

function GitLabAnalytics({ analytics, error }) {
  if (error) {
    return (
      <div className="text-center py-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-600 dark:text-red-400">Failed to load analytics: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Analytics Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Commits</h4>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics?.summary?.totalCommits || 0}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Last 90 days</p>
            </div>
            <div className="text-2xl">💻</div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Repos</h4>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics?.summary?.activeRepositories || 0}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Contributing to</p>
            </div>
            <div className="text-2xl">📁</div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Current Streak</h4>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics?.summary?.currentStreak || 0}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Days</p>
            </div>
            <div className="text-2xl">🔥</div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Longest Streak</h4>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{analytics?.summary?.longestStreak || 0}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Days</p>
            </div>
            <div className="text-2xl">⚡</div>
          </div>
        </div>
      </div>

      {/* Commit Heatmap */}
      {analytics?.commitHeatmap && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <span className="mr-2">🔥</span>
            Commit Activity Heatmap
          </h4>
          <div className="overflow-x-auto">
            <div className="grid grid-cols-7 gap-1 min-w-full">
              {analytics.commitHeatmap.slice(0, 105).map((day, index) => (
                <div
                  key={index}
                  className={`h-3 w-3 rounded ${
                    day.count === 0
                      ? 'bg-gray-100 dark:bg-gray-700'
                      : day.count <= 2
                      ? 'bg-green-200 dark:bg-green-800'
                      : day.count <= 5
                      ? 'bg-green-300 dark:bg-green-700'
                      : day.count <= 10
                      ? 'bg-green-400 dark:bg-green-600'
                      : 'bg-green-500 dark:bg-green-500'
                  }`}
                  title={`${day.count} commits on ${day.date}`}
                />
              ))}
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
              <span>Less</span>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-gray-100 dark:bg-gray-700 rounded"></div>
                <div className="w-3 h-3 bg-green-200 dark:bg-green-800 rounded"></div>
                <div className="w-3 h-3 bg-green-300 dark:bg-green-700 rounded"></div>
                <div className="w-3 h-3 bg-green-400 dark:bg-green-600 rounded"></div>
                <div className="w-3 h-3 bg-green-500 dark:bg-green-500 rounded"></div>
              </div>
              <span>More</span>
            </div>
          </div>
        </div>
      )}

      {/* Weekly Activity Chart */}
      {analytics?.weeklyActivity && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <span className="mr-2">📊</span>
            Weekly Activity
          </h4>
          <div className="space-y-3">
            {analytics.weeklyActivity.slice(-8).map((week, index) => {
              const maxCommits = Math.max(...analytics.weeklyActivity.map(w => w.commits));
              const widthPercentage = maxCommits > 0 ? (week.commits / maxCommits) * 100 : 0;
              
              return (
                <div key={index} className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600 dark:text-gray-400 w-16">
                    Week {week.week}
                  </span>
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3 relative">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500" 
                      style={{ width: `${widthPercentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white w-12 text-right">
                    {week.commits}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}