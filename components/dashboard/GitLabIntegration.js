'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

/**
 * GitLab Integration Component for AI Developer Intern Dashboard
 * Shows development activity, commits, and progress metrics
 */
export default function GitLabIntegration() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (session) {
      checkGitLabConnection();
    }
  }, [session]);

  const checkGitLabConnection = async () => {
    try {
      setLoading(true);
      // Check if user has connected GitLab account
      const response = await fetch('/api/gitlab/status');
      if (response.ok) {
        const data = await response.json();
        setConnected(data.connected);
        if (data.connected) {
          await fetchGitLabAnalytics();
        }
      }
    } catch (error) {
      console.error('Error checking GitLab connection:', error);
      setError('Failed to check GitLab connection');
    } finally {
      setLoading(false);
    }
  };

  const fetchGitLabAnalytics = async () => {
    try {
      const response = await fetch('/api/gitlab/analytics');
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching GitLab analytics:', error);
      setError('Failed to fetch GitLab analytics');
    }
  };

  const connectGitLab = () => {
    window.location.href = '/api/auth/signin/gitlab';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-8">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Connection Error</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={checkGitLabConnection}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (!connected) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🦊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Connect GitLab</h3>
          <p className="text-gray-600 mb-6">
            Connect your GitLab account to track your development progress, commits, and project contributions.
          </p>
          <button
            onClick={connectGitLab}
            className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors font-medium"
          >
            Connect GitLab Account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">🦊 GitLab Integration</h3>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-green-600 font-medium">Connected</span>
          </div>
        </div>

        {analytics ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Summary Stats */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Development Summary</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Commits</span>
                  <span className="font-medium">{analytics.summary?.totalCommits || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Active Projects</span>
                  <span className="font-medium">{analytics.summary?.activeProjects || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Issues Resolved</span>
                  <span className="font-medium">{analytics.summary?.resolvedIssues || 0}</span>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Recent Activity</h4>
              <div className="space-y-2">
                {analytics.recentActivity?.slice(0, 3).map((activity, index) => (
                  <div key={index} className="text-sm">
                    <div className="font-medium text-gray-900">{activity.type}</div>
                    <div className="text-gray-600">{activity.project}</div>
                    <div className="text-xs text-gray-500">{activity.date}</div>
                  </div>
                )) || (
                  <div className="text-sm text-gray-500">No recent activity</div>
                )}
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">This Week</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Commits</span>
                  <span className="font-medium">{analytics.weeklyStats?.commits || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Lines Added</span>
                  <span className="font-medium text-green-600">+{analytics.weeklyStats?.linesAdded || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Lines Removed</span>
                  <span className="font-medium text-red-600">-{analytics.weeklyStats?.linesRemoved || 0}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📊</div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">Loading Analytics</h4>
            <p className="text-gray-600">
              Fetching your GitLab development data...
            </p>
          </div>
        )}
      </div>

      {/* Project List */}
      {analytics?.projects && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Projects</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analytics.projects.map((project, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{project.name}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    project.visibility === 'private' 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {project.visibility}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{project.description}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    {project.language && (
                      <span className="inline-flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-1"></div>
                        {project.language}
                      </span>
                    )}
                  </span>
                  <span className="text-gray-500">
                    Last updated: {project.lastActivity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}