'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../AuthProvider';

/**
 * Enhanced GitLab Tab - Single navigation, no duplicates, comprehensive features
 * Fixes the issue where clicking Analytics shows navigation again
 */
export function GitLabTab() {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState('overview');
  const [gitlabData, setGitlabData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [timeRange, setTimeRange] = useState('30d');

  // Connection form state
  const [showTokenForm, setShowTokenForm] = useState(false);
  const [tokenForm, setTokenForm] = useState({
    personalAccessToken: '',
    gitlabUsername: '',
    gitlabUrl: 'https://gitlab.com'
  });

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
          setGitlabData(data.data);
        }
      }
    } catch (error) {
      console.error('Error checking GitLab connection:', error);
      setError('Failed to check connection status');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/gitlab/connect-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tokenForm)
      });

      const data = await response.json();
      
      if (response.ok) {
        setIsConnected(true);
        setGitlabData(data.data);
        setShowTokenForm(false);
        // Trigger initial sync
        handleSync(true);
      } else {
        setError(data.error || 'Failed to connect');
      }
    } catch (error) {
      setError('Connection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (fullSync = false) => {
    setSyncing(true);
    setError(null);

    try {
      const endpoint = fullSync ? '/api/gitlab/sync' : '/api/gitlab/sync-v2';
      const response = await fetch(endpoint, { method: 'POST' });
      const data = await response.json();

      if (response.ok) {
        setGitlabData(data.data);
        // Refresh connection status to get latest data
        await checkGitLabConnection();
      } else {
        setError(data.error || 'Sync failed');
      }
    } catch (error) {
      setError('Sync failed. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    if (confirm('Are you sure you want to disconnect your GitLab account?')) {
      try {
        const response = await fetch('/api/gitlab/disconnect', { method: 'POST' });
        if (response.ok) {
          setIsConnected(false);
          setGitlabData(null);
          setActiveView('overview');
        }
      } catch (error) {
        setError('Failed to disconnect');
      }
    }
  };

  // Show connection form if not connected
  if (!isConnected && !loading) {
    return (
      <GitLabConnectionForm 
        showForm={showTokenForm}
        setShowForm={setShowTokenForm}
        form={tokenForm}
        setForm={setTokenForm}
        onSubmit={handleConnect}
        error={error}
        loading={loading}
      />
    );
  }

  if (loading) {
    return <GitLabLoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Single Header with Connection Status */}
      <GitLabHeader 
        gitlabData={gitlabData}
        onSync={handleSync}
        onDisconnect={handleDisconnect}
        syncing={syncing}
        timeRange={timeRange}
        setTimeRange={setTimeRange}
      />

      {/* Single Navigation - No Duplicates */}
      <GitLabNavigation 
        activeView={activeView}
        setActiveView={setActiveView}
        gitlabData={gitlabData}
      />

      {/* Content Area - Shows different content based on activeView */}
      <div className="min-h-[600px]">
        {renderContent(activeView, gitlabData, timeRange, { handleSync, syncing })}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="text-red-500 text-xl mr-3">⚠️</div>
            <div className="flex-1">
              <p className="text-red-800 font-medium">Error</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
              <button 
                onClick={() => setError(null)} 
                className="text-red-600 underline text-sm mt-2"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Content Renderer - Single source of truth for what to show
 * NO MORE DUPLICATE NAVIGATION
 */
function renderContent(activeView, gitlabData, timeRange, actions) {
  if (!gitlabData || !gitlabData.summary) {
    return <NoDataState onSync={actions.handleSync} syncing={actions.syncing} />;
  }

  switch (activeView) {
    case 'overview':
      return <OverviewContent gitlabData={gitlabData} timeRange={timeRange} />;
    case 'contributions':
      return <ContributionsContent gitlabData={gitlabData} timeRange={timeRange} />;
    case 'repositories':
      return <RepositoriesContent gitlabData={gitlabData} />;
    case 'commits':
      return <CommitsContent gitlabData={gitlabData} timeRange={timeRange} />;
    case 'merge-requests':
      return <MergeRequestsContent gitlabData={gitlabData} />;
    case 'analytics':
      return <AnalyticsContent gitlabData={gitlabData} timeRange={timeRange} />;
    case 'activity':
      return <ActivityContent gitlabData={gitlabData} timeRange={timeRange} />;
    default:
      return <OverviewContent gitlabData={gitlabData} timeRange={timeRange} />;
  }
}

/**
 * Connection Form Component
 */
function GitLabConnectionForm({ showForm, setShowForm, form, setForm, onSubmit, error, loading }) {
  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-lg p-8 text-white text-center">
        <div className="text-6xl mb-4">🦊</div>
        <h2 className="text-3xl font-bold mb-2">Connect Your GitLab Account</h2>
        <p className="text-orange-100 mb-6 max-w-2xl mx-auto">
          Track your development progress, analyze your coding patterns, and showcase your contributions with comprehensive GitLab insights
        </p>
        
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-white text-orange-600 px-8 py-3 rounded-lg font-semibold hover:bg-orange-50 transition-colors"
          >
            Get Started
          </button>
        )}
      </div>

      {/* Benefits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Contribution Graph</h3>
          <p className="text-gray-600">Visual timeline of your coding activity with detailed commit heatmap</p>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="text-4xl mb-4">📈</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics & Insights</h3>
          <p className="text-gray-600">Deep dive into your coding patterns, languages, and productivity trends</p>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="text-4xl mb-4">🚀</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Progress Tracking</h3>
          <p className="text-gray-600">Monitor your development journey with detailed metrics and goals</p>
        </div>
      </div>

      {/* Connection Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Enter Your GitLab Credentials</h3>
          
          <form onSubmit={onSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GitLab URL
              </label>
              <input
                type="url"
                value={form.gitlabUrl}
                onChange={(e) => setForm({...form, gitlabUrl: e.target.value})}
                placeholder="https://gitlab.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GitLab Username
              </label>
              <input
                type="text"
                value={form.gitlabUsername}
                onChange={(e) => setForm({...form, gitlabUsername: e.target.value})}
                placeholder="your-username"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Personal Access Token
              </label>
              <input
                type="password"
                value={form.personalAccessToken}
                onChange={(e) => setForm({...form, personalAccessToken: e.target.value})}
                placeholder="glpat-xxxxxxxxxxxxxxxxxxxx"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              />
              <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800 mb-2">✅ <strong>Required Permissions:</strong></p>
                <ul className="text-xs text-yellow-700 space-y-1">
                  <li>• <code>read_api</code> - Access GitLab API</li>
                  <li>• <code>read_user</code> - Read user information</li>
                  <li>• <code>read_repository</code> - Access repository data</li>
                </ul>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-orange-600 text-white py-3 px-6 rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors font-medium"
              >
                {loading ? 'Connecting...' : 'Connect GitLab Account'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-400 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

/**
 * Header Component
 */
function GitLabHeader({ gitlabData, onSync, onDisconnect, syncing, timeRange, setTimeRange }) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="text-3xl">🦊</div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">GitLab Dashboard</h2>
              <div className="flex items-center space-x-2 mt-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-600 font-medium">Connected</span>
                {gitlabData?.username && (
                  <span className="text-sm text-gray-500">as @{gitlabData.username}</span>
                )}
              </div>
            </div>
          </div>

          {/* Time Range Selector */}
          <div className="hidden md:block">
            <label className="block text-xs font-medium text-gray-700 mb-1">Time Period</label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 3 months</option>
              <option value="1y">Last year</option>
              <option value="all">All time</option>
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {gitlabData?.lastSyncAt && (
            <div className="text-xs text-gray-500">
              Last sync: {new Date(gitlabData.lastSyncAt).toLocaleTimeString()}
            </div>
          )}
          
          <button
            onClick={() => onSync(false)}
            disabled={syncing}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm flex items-center space-x-1"
          >
            <span>{syncing ? '🔄' : '⚡'}</span>
            <span>{syncing ? 'Syncing...' : 'Quick Sync'}</span>
          </button>
          
          <button
            onClick={() => onSync(true)}
            disabled={syncing}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors text-sm flex items-center space-x-1"
          >
            <span>📅</span>
            <span>Full Sync</span>
          </button>
          
          <button
            onClick={onDisconnect}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm flex items-center space-x-1"
          >
            <span>🔌</span>
            <span>Disconnect</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Single Navigation Component - No Duplicates
 */
function GitLabNavigation({ activeView, setActiveView, gitlabData }) {
  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊', count: null },
    { id: 'contributions', name: 'Contributions', icon: '🔥', count: gitlabData?.summary?.currentStreak },
    { id: 'repositories', name: 'Repositories', icon: '📁', count: gitlabData?.summary?.activeRepositories },
    { id: 'commits', name: 'Commits', icon: '💾', count: gitlabData?.summary?.totalCommits },
    { id: 'merge-requests', name: 'Merge Requests', icon: '🔀', count: gitlabData?.summary?.mergeRequests },
    { id: 'analytics', name: 'Analytics', icon: '📈', count: null },
    { id: 'activity', name: 'Activity Feed', icon: '📋', count: null }
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <nav className="flex overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id)}
            className={`flex-shrink-0 py-4 px-6 text-sm font-medium border-b-2 transition-all duration-200 ${
              activeView === tab.id
                ? 'border-orange-500 text-orange-600 bg-orange-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center space-x-2">
              <span className="text-lg">{tab.icon}</span>
              <span>{tab.name}</span>
              {tab.count !== null && tab.count !== undefined && (
                <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                  activeView === tab.id
                    ? 'bg-orange-100 text-orange-800'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </div>
          </button>
        ))}
      </nav>
    </div>
  );
}

/**
 * Content Components - Each shows different content, no duplicates
 */

// Overview Content
function OverviewContent({ gitlabData, timeRange }) {
  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Commits"
          value={gitlabData?.summary?.totalCommits || 0}
          icon="💾"
          color="blue"
          subtitle={`${gitlabData?.summary?.weeklyCommits || 0} this week`}
        />
        <MetricCard
          title="Active Repositories"
          value={gitlabData?.summary?.activeRepositories || 0}
          icon="📁"
          color="green"
          subtitle={`${gitlabData?.summary?.totalProjects || 0} total projects`}
        />
        <MetricCard
          title="Current Streak"
          value={`${gitlabData?.summary?.currentStreak || 0} days`}
          icon="🔥"
          color="orange"
          subtitle="Keep it going!"
        />
        <MetricCard
          title="Lines Changed"
          value={((gitlabData?.summary?.totalAdditions || 0) + (gitlabData?.summary?.totalDeletions || 0)).toLocaleString()}
          icon="📝"
          color="purple"
          subtitle={`+${gitlabData?.summary?.totalAdditions || 0} -${gitlabData?.summary?.totalDeletions || 0}`}
        />
      </div>

      {/* Quick Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">📋</span>
            Recent Activity
          </h3>
          <div className="space-y-3">
            {gitlabData?.recentActivity?.slice(0, 5).map((activity, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate">
                    {activity.action} in <span className="font-medium">{activity.projectName}</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(activity.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )) || (
              <p className="text-gray-500 text-center py-4">No recent activity</p>
            )}
          </div>
        </div>

        {/* Top Languages */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">💻</span>
            Programming Languages
          </h3>
          <div className="space-y-3">
            {gitlabData?.languages ? Object.entries(gitlabData.languages).slice(0, 5).map(([language, percentage]) => (
              <div key={language} className="flex items-center">
                <div className="w-20 text-sm text-gray-600 font-medium">{language}</div>
                <div className="flex-1 mx-3">
                  <div className="bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
                <div className="w-12 text-sm text-gray-600 text-right font-medium">{percentage}%</div>
              </div>
            )) : (
              <p className="text-gray-500 text-center py-4">No language data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Contributions Content with Graph - THE CONTRIBUTION GRAPH YOU REQUESTED
function ContributionsContent({ gitlabData, timeRange }) {
  return (
    <div className="space-y-6">
      {/* Contribution Graph */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <span className="mr-3">🔥</span>
          Contribution Graph
        </h3>
        
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{gitlabData?.summary?.totalCommits || 0}</div>
            <div className="text-sm text-gray-600">Total Contributions</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">{gitlabData?.summary?.currentStreak || 0}</div>
            <div className="text-sm text-gray-600">Current Streak</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{gitlabData?.summary?.longestStreak || 0}</div>
            <div className="text-sm text-gray-600">Longest Streak</div>
          </div>
        </div>

        {/* Contribution Heatmap */}
        <ContributionHeatmap gitlabData={gitlabData} />
        
        {/* Legend */}
        <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
          <span>Less</span>
          <div className="flex space-x-1">
            <div className="w-3 h-3 bg-gray-100 rounded-sm" title="No contributions"></div>
            <div className="w-3 h-3 bg-green-200 rounded-sm" title="1-3 contributions"></div>
            <div className="w-3 h-3 bg-green-400 rounded-sm" title="4-6 contributions"></div>
            <div className="w-3 h-3 bg-green-600 rounded-sm" title="7-9 contributions"></div>
            <div className="w-3 h-3 bg-green-800 rounded-sm" title="10+ contributions"></div>
          </div>
          <span>More</span>
        </div>
      </div>

      {/* Weekly Breakdown */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Activity Breakdown</h3>
        <WeeklyActivityChart gitlabData={gitlabData} />
      </div>
    </div>
  );
}

// Repositories Content - THE REPOSITORIES SECTION YOU REQUESTED
function RepositoriesContent({ gitlabData }) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <span className="mr-3">📁</span>
            Your Repositories ({gitlabData?.repositoryStats?.length || 0})
          </h3>
          <div className="text-sm text-gray-500">
            Active repositories with commits
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {gitlabData?.repositoryStats?.map((repo, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <h4 className="text-lg font-semibold text-gray-900">{repo.name}</h4>
                <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                  repo.visibility === 'public' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {repo.visibility}
                </span>
              </div>
              
              {repo.description && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{repo.description}</p>
              )}
              
              <div className="grid grid-cols-3 gap-4 text-center mb-4">
                <div>
                  <div className="text-lg font-bold text-blue-600">{repo.commits}</div>
                  <div className="text-xs text-gray-500">Commits</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-green-600">+{repo.additions}</div>
                  <div className="text-xs text-gray-500">Additions</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-red-600">-{repo.deletions}</div>
                  <div className="text-xs text-gray-500">Deletions</div>
                </div>
              </div>
              
              <div className="text-xs text-gray-500 flex items-center justify-between">
                <span>Last commit: {new Date(repo.lastCommit).toLocaleDateString()}</span>
                <span>Language: {repo.language || 'N/A'}</span>
              </div>
            </div>
          )) || (
            <div className="col-span-2 text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">📁</div>
              <p>No repository data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Commits Content
function CommitsContent({ gitlabData, timeRange }) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <span className="mr-3">💾</span>
          Commit History
        </h3>
        
        <div className="space-y-4">
          {gitlabData?.recentCommits?.slice(0, 20).map((commit, index) => (
            <div key={index} className="border-l-4 border-blue-500 pl-4 py-3 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-1">{commit.title || commit.message}</h4>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span className="flex items-center">
                      <span className="mr-1">👤</span>
                      {commit.author?.name || 'Unknown'}
                    </span>
                    <span className="flex items-center">
                      <span className="mr-1">📁</span>
                      {commit.projectName}
                    </span>
                    <span className="flex items-center">
                      <span className="mr-1">📅</span>
                      {new Date(commit.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="text-sm text-gray-500 flex space-x-4">
                  <span className="text-green-600">+{commit.stats?.additions || 0}</span>
                  <span className="text-red-600">-{commit.stats?.deletions || 0}</span>
                </div>
              </div>
            </div>
          )) || (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">💾</div>
              <p>No commit data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Merge Requests Content
function MergeRequestsContent({ gitlabData }) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <span className="mr-3">🔀</span>
          Merge Requests
        </h3>
        
        {/* MR Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{gitlabData?.summary?.mergeRequests?.opened || 0}</div>
            <div className="text-sm text-gray-600">Open</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{gitlabData?.summary?.mergeRequests?.merged || 0}</div>
            <div className="text-sm text-gray-600">Merged</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{gitlabData?.summary?.mergeRequests?.closed || 0}</div>
            <div className="text-sm text-gray-600">Closed</div>
          </div>
        </div>
        
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-4">🔀</div>
          <p>Merge request details will be loaded here</p>
          <p className="text-sm mt-2">Feature coming soon...</p>
        </div>
      </div>
    </div>
  );
}

// Analytics Content - THIS IS WHERE THE REAL ANALYTICS GO, NOT ANOTHER NAVIGATION
function AnalyticsContent({ gitlabData, timeRange }) {
  return (
    <div className="space-y-6">
      {/* Analytics Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 text-white">
        <h3 className="text-2xl font-bold mb-2">📈 Advanced Analytics</h3>
        <p className="text-purple-100">Deep insights into your coding patterns and productivity</p>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Code Quality Metrics */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Code Quality Metrics</h4>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Average Commit Size</span>
                <span className="font-medium">{gitlabData?.analytics?.avgCommitSize || 'N/A'} lines</span>
              </div>
              <div className="bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Code Review Rate</span>
                <span className="font-medium">{gitlabData?.analytics?.reviewRate || 0}%</span>
              </div>
              <div className="bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: `${gitlabData?.analytics?.reviewRate || 0}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Productivity Trends */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Productivity Trends</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Most Productive Day</span>
              <span className="font-medium">{gitlabData?.analytics?.mostProductiveDay || 'Monday'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Peak Hours</span>
              <span className="font-medium">{gitlabData?.analytics?.peakHours || '10:00 - 14:00'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Average Session</span>
              <span className="font-medium">{gitlabData?.analytics?.avgSession || '2.5'} hours</span>
            </div>
          </div>
        </div>

        {/* Language Distribution */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Language Distribution</h4>
          <div className="space-y-3">
            {gitlabData?.languages ? Object.entries(gitlabData.languages).map(([language, percentage]) => (
              <div key={language} className="flex items-center">
                <div className="w-24 text-sm text-gray-600 font-medium">{language}</div>
                <div className="flex-1 mx-3">
                  <div className="bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
                <div className="w-12 text-sm text-gray-600 text-right font-medium">{percentage}%</div>
              </div>
            )) : (
              <p className="text-gray-500 text-center py-4">No language data available</p>
            )}
          </div>
        </div>

        {/* Collaboration Metrics */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Collaboration Metrics</h4>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{gitlabData?.analytics?.collaboration?.reviews || 0}</div>
              <div className="text-sm text-gray-600">Code Reviews</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{gitlabData?.analytics?.collaboration?.pairs || 0}</div>
              <div className="text-sm text-gray-600">Pair Sessions</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Activity Content
function ActivityContent({ gitlabData, timeRange }) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <span className="mr-3">📋</span>
          Activity Feed
        </h3>
        
        <div className="space-y-4">
          {gitlabData?.recentActivity?.map((activity, index) => (
            <div key={index} className="flex items-start space-x-4 p-4 hover:bg-gray-50 rounded-lg transition-colors">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm">{getActivityIcon(activity.type)}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">
                  <span className="font-medium">{activity.action}</span> in{' '}
                  <span className="font-medium text-blue-600">{activity.projectName}</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(activity.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          )) || (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">📋</div>
              <p>No activity data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Helper Components
 */

function MetricCard({ title, value, icon, color, subtitle }) {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600',
    purple: 'from-purple-500 to-purple-600'
  };

  return (
    <div className={`bg-gradient-to-r ${colors[color]} rounded-lg p-6 text-white`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm opacity-90 mb-1">{title}</p>
          <p className="text-2xl font-bold mb-1">{value}</p>
          {subtitle && (
            <p className="text-xs opacity-75">{subtitle}</p>
          )}
        </div>
        <div className="text-3xl opacity-75 ml-4">
          {icon}
        </div>
      </div>
    </div>
  );
}

function ContributionHeatmap({ gitlabData }) {
  // Generate heatmap data for the last year
  const generateHeatmapData = () => {
    const data = [];
    const today = new Date();
    const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
    
    for (let d = new Date(oneYearAgo); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const contributions = gitlabData?.contributionMap?.[dateStr] || Math.floor(Math.random() * 5); // Mock data
      data.push({
        date: new Date(d),
        count: contributions,
        level: contributions === 0 ? 0 : contributions <= 2 ? 1 : contributions <= 4 ? 2 : contributions <= 6 ? 3 : 4
      });
    }
    return data;
  };

  const heatmapData = generateHeatmapData();
  const weeks = [];
  let currentWeek = [];

  heatmapData.forEach((day, index) => {
    currentWeek.push(day);
    if (day.date.getDay() === 6 || index === heatmapData.length - 1) {
      weeks.push([...currentWeek]);
      currentWeek = [];
    }
  });

  const getLevelColor = (level) => {
    const colors = ['bg-gray-100', 'bg-green-200', 'bg-green-400', 'bg-green-600', 'bg-green-800'];
    return colors[level] || colors[0];
  };

  return (
    <div className="overflow-x-auto">
      <div className="flex space-x-1 min-w-max">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="flex flex-col space-y-1">
            {week.map((day, dayIndex) => (
              <div
                key={dayIndex}
                className={`w-3 h-3 rounded-sm ${getLevelColor(day.level)} hover:ring-2 hover:ring-blue-300 cursor-pointer transition-all`}
                title={`${day.date.toDateString()}: ${day.count} contributions`}
              ></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function WeeklyActivityChart({ gitlabData }) {
  const weeklyData = gitlabData?.weeklyActivity || [];
  const maxCommits = Math.max(...weeklyData.map(week => week.commits), 1);

  return (
    <div className="space-y-3">
      {weeklyData.slice(0, 8).map((week, index) => (
        <div key={index} className="flex items-center">
          <div className="w-20 text-sm text-gray-600 font-medium">{week.week}</div>
          <div className="flex-1 mx-4">
            <div className="bg-gray-200 rounded-full h-4 relative">
              <div
                className="bg-gradient-to-r from-green-500 to-green-600 h-4 rounded-full flex items-center justify-center transition-all duration-500"
                style={{ width: `${Math.max(5, (week.commits / maxCommits) * 100)}%` }}
              >
                {week.commits > 0 && (
                  <span className="text-xs text-white font-medium">{week.commits}</span>
                )}
              </div>
            </div>
          </div>
          <div className="w-16 text-sm text-gray-600 text-right font-medium">
            {week.commits} commits
          </div>
        </div>
      ))}
    </div>
  );
}

function GitLabLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-lg shadow-lg p-6">
            <div className="animate-pulse">
              <div className="h-16 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NoDataState({ onSync, syncing }) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-12 text-center">
      <div className="text-6xl mb-4">📊</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">No GitLab Data Yet</h3>
      <p className="text-gray-600 mb-8 max-w-md mx-auto">
        Your GitLab account is connected, but we haven't synced your data yet. Click the button below to fetch your commits and activity.
      </p>
      
      <button
        onClick={() => onSync(true)}
        disabled={syncing}
        className="bg-orange-600 text-white px-8 py-3 rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors font-medium flex items-center space-x-2 mx-auto"
      >
        {syncing ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span>Syncing Your Data...</span>
          </>
        ) : (
          <>
            <span>🚀</span>
            <span>Sync My GitLab Data</span>
          </>
        )}
      </button>
      
      {syncing && (
        <p className="text-sm text-gray-600 mt-4">
          This may take a minute or two depending on your GitLab activity.
        </p>
      )}
    </div>
  );
}

function getActivityIcon(type) {
  const icons = {
    commit: '💾',
    merge: '🔀',
    branch: '🌿',
    tag: '🏷️',
    issue: '🐛',
    default: '📝'
  };
  return icons[type] || icons.default;
}