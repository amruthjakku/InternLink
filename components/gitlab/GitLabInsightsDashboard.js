'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../AuthProvider';

export function GitLabInsightsDashboard() {
  const { user } = useAuth();
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('90d');

  useEffect(() => {
    fetchInsights();
  }, [timeRange]);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      setError(null);

      const since = new Date(Date.now() - getTimeRangeMs(timeRange)).toISOString();
      const response = await fetch(`/api/gitlab/insights?since=${since}&includeRepositories=true&includeMergeRequests=true&includeIssues=true&includeAnalytics=true`);

      if (response.ok) {
        const data = await response.json();
        setInsights(data);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch insights');
      }
    } catch (error) {
      console.error('Error fetching GitLab insights:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getTimeRangeMs = (range) => {
    const ranges = {
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000,
      '1y': 365 * 24 * 60 * 60 * 1000
    };
    return ranges[range] || ranges['90d'];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading GitLab insights...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error Loading Insights</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
            <div className="mt-2">
              <button
                onClick={fetchInsights}
                className="text-sm text-red-600 hover:text-red-500 underline"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">No insights data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Time Range Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">GitLab Insights</h2>
          <p className="text-sm text-gray-600">
            Comprehensive analysis of your GitLab activity using {insights.meta.tokenType === 'oauth' ? 'OAuth' : 'PAT'} integration
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Time Range:</label>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard
          title="Total Commits"
          value={insights.summary.total_commits}
          icon="💻"
          color="blue"
        />
        <SummaryCard
          title="Repositories"
          value={insights.summary.total_repositories}
          icon="📁"
          color="green"
        />
        <SummaryCard
          title="Merge Requests"
          value={insights.summary.total_merge_requests}
          icon="🔀"
          color="purple"
        />
        <SummaryCard
          title="Issues"
          value={insights.summary.total_issues}
          icon="🐛"
          color="orange"
        />
      </div>

      {/* Insights Overview */}
      {insights.insights && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <InsightCard
            title="Activity Score"
            value={insights.insights.overview.activity_score}
            maxValue={100}
            description="Overall contribution activity"
            color="blue"
          />
          <InsightCard
            title="Productivity Trend"
            value={insights.insights.productivity.productivity_trend}
            description="Recent productivity pattern"
            color="green"
            isText={true}
          />
          <InsightCard
            title="Collaboration Score"
            value={insights.insights.collaboration.collaboration_score}
            maxValue={100}
            description="Team collaboration effectiveness"
            color="purple"
          />
          <InsightCard
            title="Code Quality Score"
            value={insights.insights.quality.quality_score}
            maxValue={100}
            description="Code quality metrics"
            color="orange"
          />
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Overview', icon: '📊' },
            { id: 'repositories', name: 'Repositories', icon: '📁' },
            { id: 'commits', name: 'Commits', icon: '💻' },
            { id: 'merge-requests', name: 'Merge Requests', icon: '🔀' },
            { id: 'issues', name: 'Issues', icon: '🐛' },
            { id: 'analytics', name: 'Analytics', icon: '📈' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && <OverviewTab insights={insights} />}
        {activeTab === 'repositories' && <RepositoriesTab repositories={insights.repositories} />}
        {activeTab === 'commits' && <CommitsTab commits={insights.commits} />}
        {activeTab === 'merge-requests' && <MergeRequestsTab mergeRequests={insights.merge_requests} />}
        {activeTab === 'issues' && <IssuesTab issues={insights.issues} />}
        {activeTab === 'analytics' && <AnalyticsTab analytics={insights.analytics} />}
      </div>
    </div>
  );
}

function SummaryCard({ title, value, icon, color }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    purple: 'bg-purple-50 text-purple-700',
    orange: 'bg-orange-50 text-orange-700'
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`p-2 rounded-md ${colorClasses[color]}`}>
          <span className="text-2xl">{icon}</span>
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

function InsightCard({ title, value, maxValue, description, color, isText = false }) {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500'
  };

  const formatValue = (val) => {
    if (isText) {
      return val.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    return val;
  };

  const getProgressColor = (score) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900">{formatValue(value)}</p>
          {maxValue && !isText && (
            <div className="mt-2">
              <div className="w-24 bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getProgressColor(value)}`}
                  style={{ width: `${Math.min((value / maxValue) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function OverviewTab({ insights }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Key Metrics</h3>
        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="text-gray-600">Most Active Repository</span>
            <span className="font-medium">{insights.insights?.overview.most_active_repository || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Primary Language</span>
            <span className="font-medium">{insights.insights?.overview.primary_language || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Contribution Streak</span>
            <span className="font-medium">{insights.insights?.overview.contribution_streak || 0} days</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Total Contributions</span>
            <span className="font-medium">{insights.insights?.overview.total_contributions || 0}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Productivity Metrics</h3>
        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="text-gray-600">Commits per Day</span>
            <span className="font-medium">{insights.insights?.productivity.commits_per_day?.toFixed(1) || '0.0'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Lines per Day</span>
            <span className="font-medium">{insights.insights?.productivity.lines_per_day?.toFixed(0) || '0'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Code Efficiency</span>
            <span className="font-medium">{insights.insights?.productivity.code_efficiency?.toFixed(2) || '0.00'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">MR Velocity (per week)</span>
            <span className="font-medium">{insights.insights?.productivity.merge_request_velocity?.toFixed(1) || '0.0'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function RepositoriesTab({ repositories }) {
  if (!repositories || repositories.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">No repositories found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {repositories.slice(0, 12).map((repo) => (
        <div key={repo.id} className="bg-white rounded-lg shadow p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900 truncate">{repo.name}</h3>
              <p className="text-sm text-gray-600 mt-1">{repo.path}</p>
              {repo.description && (
                <p className="text-sm text-gray-500 mt-2 line-clamp-2">{repo.description}</p>
              )}
            </div>
            <span className={`px-2 py-1 text-xs rounded-full ${
              repo.visibility === 'public' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {repo.visibility}
            </span>
          </div>
          
          <div className="mt-4 flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center">
              <span className="mr-1">⭐</span>
              {repo.star_count}
            </div>
            <div className="flex items-center">
              <span className="mr-1">🍴</span>
              {repo.forks_count}
            </div>
            <div className="flex items-center">
              <span className="mr-1">👥</span>
              {repo.members_count}
            </div>
          </div>

          {repo.languages && Object.keys(repo.languages).length > 0 && (
            <div className="mt-3">
              <div className="flex flex-wrap gap-1">
                {Object.keys(repo.languages).slice(0, 3).map((lang) => (
                  <span key={lang} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Recent commits:</span>
              <span className="font-medium">{repo.recent_commits_count || 0}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CommitsTab({ commits }) {
  if (!commits || commits.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">No commits found</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Recent Commits</h3>
      </div>
      <div className="divide-y divide-gray-200">
        {commits.slice(0, 20).map((commit) => (
          <div key={commit.id} className="p-6">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm font-medium">
                    {commit.author_name?.charAt(0) || 'U'}
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {commit.title || commit.message?.split('\n')[0] || 'No title'}
                </p>
                <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                  <span>{commit.author_name}</span>
                  <span>{commit.project?.name || 'Unknown project'}</span>
                  <span>{new Date(commit.created_at).toLocaleDateString()}</span>
                </div>
                {commit.stats && (
                  <div className="mt-2 flex items-center space-x-4 text-sm">
                    <span className="text-green-600">+{commit.stats.additions || 0}</span>
                    <span className="text-red-600">-{commit.stats.deletions || 0}</span>
                  </div>
                )}
              </div>
              {commit.web_url && (
                <div className="flex-shrink-0">
                  <a
                    href={commit.web_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-500"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </a>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MergeRequestsTab({ mergeRequests }) {
  if (!mergeRequests || mergeRequests.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">No merge requests found</p>
      </div>
    );
  }

  const getStateColor = (state) => {
    switch (state) {
      case 'merged': return 'bg-green-100 text-green-800';
      case 'opened': return 'bg-blue-100 text-blue-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Merge Requests</h3>
      </div>
      <div className="divide-y divide-gray-200">
        {mergeRequests.slice(0, 20).map((mr) => (
          <div key={mr.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h4 className="text-sm font-medium text-gray-900 truncate">{mr.title}</h4>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStateColor(mr.state)}`}>
                    {mr.state}
                  </span>
                </div>
                <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                  <span>#{mr.iid}</span>
                  <span>{mr.author?.name || 'Unknown author'}</span>
                  <span>{new Date(mr.created_at).toLocaleDateString()}</span>
                </div>
                <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                  <span>{mr.source_branch} → {mr.target_branch}</span>
                </div>
                {mr.stats && (
                  <div className="mt-2 flex items-center space-x-4 text-sm">
                    <span className="text-green-600">+{mr.stats.additions || 0}</span>
                    <span className="text-red-600">-{mr.stats.deletions || 0}</span>
                    <span className="text-gray-600">{mr.stats.files_changed || 0} files</span>
                  </div>
                )}
              </div>
              {mr.web_url && (
                <div className="flex-shrink-0 ml-4">
                  <a
                    href={mr.web_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-500"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </a>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function IssuesTab({ issues }) {
  if (!issues || issues.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">No issues found</p>
      </div>
    );
  }

  const getStateColor = (state) => {
    switch (state) {
      case 'opened': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Issues</h3>
      </div>
      <div className="divide-y divide-gray-200">
        {issues.slice(0, 20).map((issue) => (
          <div key={issue.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h4 className="text-sm font-medium text-gray-900 truncate">{issue.title}</h4>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStateColor(issue.state)}`}>
                    {issue.state}
                  </span>
                </div>
                <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                  <span>#{issue.iid}</span>
                  <span>{issue.author?.name || 'Unknown author'}</span>
                  <span>{new Date(issue.created_at).toLocaleDateString()}</span>
                </div>
                {issue.labels && issue.labels.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {issue.labels.slice(0, 3).map((label, index) => (
                      <span key={index} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                        {label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {issue.web_url && (
                <div className="flex-shrink-0 ml-4">
                  <a
                    href={issue.web_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-500"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </a>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalyticsTab({ analytics }) {
  if (!analytics) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Time Analytics */}
      {analytics.time && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Time Analytics</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Average commits per day</span>
              <span className="font-medium">{analytics.time.average_commits_per_day?.toFixed(1) || '0.0'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Most active day</span>
              <span className="font-medium">{getDayName(analytics.time.most_active_day)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Most active hour</span>
              <span className="font-medium">{analytics.time.most_active_hour || 0}:00</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Streak days</span>
              <span className="font-medium">{analytics.time.streak_days || 0}</span>
            </div>
          </div>
        </div>
      )}

      {/* Repository Analytics */}
      {analytics.repositories && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Repository Analytics</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total repositories</span>
              <span className="font-medium">{analytics.repositories.total_repositories || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total stars</span>
              <span className="font-medium">{analytics.repositories.total_stars || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total forks</span>
              <span className="font-medium">{analytics.repositories.total_forks || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Most active repo</span>
              <span className="font-medium truncate">{analytics.repositories.most_active_repository || 'N/A'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Productivity Analytics */}
      {analytics.productivity && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Productivity Analytics</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Commits per day</span>
              <span className="font-medium">{analytics.productivity.commits_per_day?.toFixed(1) || '0.0'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Lines per day</span>
              <span className="font-medium">{analytics.productivity.lines_per_day?.toFixed(0) || '0'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total additions</span>
              <span className="font-medium text-green-600">+{analytics.productivity.total_additions || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total deletions</span>
              <span className="font-medium text-red-600">-{analytics.productivity.total_deletions || 0}</span>
            </div>
          </div>
        </div>
      )}

      {/* Language Analytics */}
      {analytics.languages && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Language Analytics</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total languages</span>
              <span className="font-medium">{analytics.languages.total_languages || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Primary language</span>
              <span className="font-medium">{analytics.languages.primary_language || 'N/A'}</span>
            </div>
            {analytics.languages.languages && analytics.languages.languages.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Top Languages:</p>
                <div className="space-y-2">
                  {analytics.languages.languages.slice(0, 5).map((lang, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{lang.language}</span>
                      <span className="text-sm font-medium">{lang.percentage?.toFixed(1) || '0.0'}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function getDayName(dayIndex) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayIndex] || 'Unknown';
}