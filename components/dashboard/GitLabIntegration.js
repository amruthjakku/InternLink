'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

/**
 * GitLab Integration Component for Intern Dashboard
 * Shows development activity, commits, and progress metrics
 */
export default function GitLabIntegration({ demoMode = false }) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [commits, setCommits] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (demoMode) {
      loadDemoData();
    } else {
      checkConnection();
    }
  }, [demoMode]);

  const loadDemoData = () => {
    setConnected(true);
    setAnalytics({
      summary: {
        totalCommits: 47,
        totalIssues: 12,
        totalMergeRequests: 8,
        totalAdditions: 2847,
        totalDeletions: 1203,
        activeProjects: 3
      },
      projectActivity: [
        {
          _id: 'E-Commerce Platform',
          commits: 23,
          issues: 5,
          mergeRequests: 4,
          totalAdditions: 1456,
          totalDeletions: 623,
          lastActivity: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        },
        {
          _id: 'Task Management App',
          commits: 18,
          issues: 4,
          mergeRequests: 3,
          totalAdditions: 892,
          totalDeletions: 345,
          lastActivity: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
        },
        {
          _id: 'Portfolio Website',
          commits: 6,
          issues: 3,
          mergeRequests: 1,
          totalAdditions: 499,
          totalDeletions: 235,
          lastActivity: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
        }
      ]
    });
    
    setCommits([
      {
        id: 'demo1',
        title: 'Add user authentication system',
        message: 'Implemented JWT-based authentication with login/logout functionality',
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        web_url: 'https://gitlab.com/demo/project/-/commit/demo1',
        project_name: 'E-Commerce Platform',
        stats: { additions: 156, deletions: 23 }
      },
      {
        id: 'demo2',
        title: 'Fix responsive design issues',
        message: 'Updated CSS grid layout for better mobile compatibility',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        web_url: 'https://gitlab.com/demo/project/-/commit/demo2',
        project_name: 'Task Management App',
        stats: { additions: 89, deletions: 45 }
      },
      {
        id: 'demo3',
        title: 'Implement search functionality',
        message: 'Added full-text search with filters and pagination',
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        web_url: 'https://gitlab.com/demo/project/-/commit/demo3',
        project_name: 'E-Commerce Platform',
        stats: { additions: 234, deletions: 67 }
      },
      {
        id: 'demo4',
        title: 'Update documentation',
        message: 'Added API documentation and setup instructions',
        created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        web_url: 'https://gitlab.com/demo/project/-/commit/demo4',
        project_name: 'Portfolio Website',
        stats: { additions: 78, deletions: 12 }
      },
      {
        id: 'demo5',
        title: 'Optimize database queries',
        message: 'Improved query performance with proper indexing',
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        web_url: 'https://gitlab.com/demo/project/-/commit/demo5',
        project_name: 'Task Management App',
        stats: { additions: 45, deletions: 89 }
      }
    ]);
    
    setLoading(false);
  };

  const checkConnection = async () => {
    try {
      const response = await fetch('/api/gitlab/connect');
      const data = await response.json();
      
      setConnected(data.connected);
      
      if (data.connected) {
        await fetchAnalytics();
        await fetchCommits();
      }
    } catch (error) {
      console.error('Error checking GitLab connection:', error);
      setError('Failed to check GitLab connection');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/gitlab/analytics?period=30d');
      const data = await response.json();
      
      if (response.ok) {
        setAnalytics(data);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError('Failed to fetch analytics');
    }
  };

  const fetchCommits = async () => {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const response = await fetch(`/api/gitlab/commits?since=${thirtyDaysAgo}&limit=10`);
      const data = await response.json();
      
      if (response.ok) {
        setCommits(data.commits || []);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error fetching commits:', error);
      setError('Failed to fetch commits');
    }
  };

  const handleConnect = () => {
    const clientId = process.env.NEXT_PUBLIC_GITLAB_CLIENT_ID;
    const redirectUri = `${window.location.origin}/api/auth/callback/gitlab`;
    const scope = 'read_user read_api read_repository';
    
    const authUrl = `https://gitlab.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;
    window.location.href = authUrl;
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const response = await fetch('/api/gitlab/analytics/sync', {
        method: 'POST'
      });
      
      if (response.ok) {
        await fetchAnalytics();
        await fetchCommits();
      } else {
        const data = await response.json();
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error syncing data:', error);
      setError('Failed to sync GitLab data');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!connected && !demoMode) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-orange-100 mb-4">
            <svg className="h-6 w-6 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 0 1-.3-.94l1.22-3.78 2.44-7.51A.42.42 0 0 1 4.82 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.16l2.44 7.49h8.1l2.44-7.51A.42.42 0 0 1 18.6 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.16l2.44 7.51 1.22 3.78a.84.84 0 0 1-.3.94z"/>
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Connect GitLab Account</h3>
          <p className="text-gray-500 mb-4">
            Connect your GitLab account to track your development progress and showcase your work.
          </p>
          <button
            onClick={handleConnect}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 0 1-.3-.94l1.22-3.78 2.44-7.51A.42.42 0 0 1 4.82 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.16l2.44 7.49h8.1l2.44-7.51A.42.42 0 0 1 18.6 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.16l2.44 7.51 1.22 3.78a.84.84 0 0 1-.3.94z"/>
            </svg>
            Connect GitLab
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Development Activity Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Development Activity</h3>
          {!demoMode && (
            <button
              onClick={handleSync}
              disabled={syncing}
              className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {syncing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  Syncing...
                </>
              ) : (
                <>
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Sync
                </>
              )}
            </button>
          )}
        </div>

        {/* Activity Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {analytics?.summary?.totalCommits || 0}
            </div>
            <div className="text-sm text-gray-600">Commits (30 days)</div>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {analytics?.summary?.totalIssues || 0}
            </div>
            <div className="text-sm text-gray-600">Issues Worked</div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {analytics?.summary?.totalAdditions || 0}
            </div>
            <div className="text-sm text-gray-600">Lines Added</div>
          </div>
        </div>

        {/* Project Activity */}
        {analytics?.projectActivity && analytics.projectActivity.length > 0 && (
          <div className="mb-6">
            <h4 className="font-medium mb-3 text-gray-900">Project Activity</h4>
            <div className="space-y-3">
              {analytics.projectActivity.slice(0, 3).map((project, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{project._id}</div>
                    <div className="text-sm text-gray-500">
                      {project.commits} commits • {project.totalAdditions} additions • {project.totalDeletions} deletions
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">
                      {new Date(project.lastActivity).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Commits */}
        <div>
          <h4 className="font-medium mb-3 text-gray-900">Recent Commits</h4>
          {commits.length > 0 ? (
            <div className="space-y-3">
              {commits.slice(0, 5).map((commit) => (
                <div key={commit.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 mb-1">{commit.title}</div>
                    <div className="text-sm text-gray-600 mb-2">{commit.message}</div>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>{commit.project_name}</span>
                      <span>{new Date(commit.created_at).toLocaleDateString()}</span>
                      {commit.stats && (
                        <span className="text-green-600">
                          +{commit.stats.additions} -{commit.stats.deletions}
                        </span>
                      )}
                    </div>
                  </div>
                  <a 
                    href={commit.web_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="ml-4 text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View →
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>No commits found in the last 30 days</p>
              <p className="text-sm">Start coding to see your progress here!</p>
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}