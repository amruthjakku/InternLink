'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../AuthProvider';
import { GitLabCommitTracker } from '../GitLabCommitTracker';
import { GitLabInsightsDashboard } from '../gitlab/GitLabInsightsDashboard';

export function EnhancedGitLabTab() {
  const { user } = useAuth();
  const [gitlabData, setGitlabData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState({
    hasOAuth: false,
    hasPAT: false,
    preferredMethod: null,
    connected: false
  });
  const [activeView, setActiveView] = useState('overview');
  const [syncing, setSyncing] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use unified status endpoint
      const response = await fetch('/api/gitlab/unified-status');
      
      if (response.ok) {
        const statusData = await response.json();
        
        setConnectionStatus({
          hasOAuth: statusData.oauth.canUse,
          hasPAT: statusData.pat.canUse,
          preferredMethod: statusData.preferredMethod,
          connected: statusData.connected,
          integration: statusData.integration,
          recommendations: statusData.recommendations,
          migration: statusData.migration
        });

        if (statusData.connected) {
          await fetchGitLabData();
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to check connection status');
      }
    } catch (error) {
      console.error('Error checking connection status:', error);
      setError('Failed to check GitLab connection status');
    } finally {
      setLoading(false);
    }
  };

  const fetchGitLabData = async () => {
    try {
      setLoading(true);
      
      // Use unified activity endpoint (automatically chooses best method)
      const response = await fetch('/api/gitlab/unified-activity?includeStats=true');

      if (response.ok) {
        const data = await response.json();
        setGitlabData(data);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch GitLab data');
      }
    } catch (error) {
      console.error('Error fetching GitLab data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthConnect = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/gitlab/oauth-connect', {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        setSuccessMessage('GitLab connected successfully via OAuth!');
        await checkConnectionStatus();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to connect via OAuth');
      }
    } catch (error) {
      console.error('Error connecting via OAuth:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      setError(null);

      const response = await fetch('/api/gitlab/simple-sync', {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        setSuccessMessage('GitLab data synced successfully!');
        await fetchGitLabData();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Sync failed');
      }
    } catch (error) {
      console.error('Error syncing:', error);
      setError(error.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setLoading(true);
      setError(null);

      const endpoint = connectionStatus.preferredMethod === 'oauth' 
        ? '/api/gitlab/oauth-test' 
        : '/api/gitlab/test-connection';
      
      const response = await fetch(endpoint);
      const data = await response.json();

      if (data.success) {
        setSuccessMessage(`Connection test successful! Using ${data.tokenType} authentication.`);
      } else {
        throw new Error(data.error || 'Connection test failed');
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !gitlabData) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading GitLab integration...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">{successMessage}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setSuccessMessage(null)}
                className="inline-flex text-green-400 hover:text-green-600"
              >
                <span className="sr-only">Dismiss</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setError(null)}
                className="inline-flex text-red-400 hover:text-red-600"
              >
                <span className="sr-only">Dismiss</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Connection Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">GitLab Integration Status</h3>
          <div className="flex space-x-2">
            <button
              onClick={handleTestConnection}
              disabled={loading || !connectionStatus.connected}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 disabled:opacity-50"
            >
              Test Connection
            </button>
            <button
              onClick={handleSync}
              disabled={syncing || !connectionStatus.connected}
              className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 disabled:opacity-50"
            >
              {syncing ? 'Syncing...' : 'Sync Now'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className={`text-2xl mb-2 ${connectionStatus.hasOAuth ? 'text-green-600' : 'text-gray-400'}`}>
              🔐
            </div>
            <h4 className="font-medium text-gray-900">OAuth Integration</h4>
            <p className="text-sm text-gray-600">
              {connectionStatus.hasOAuth ? 'Connected' : 'Not Connected'}
            </p>
            {connectionStatus.hasOAuth && (
              <span className="inline-block mt-1 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                Preferred
              </span>
            )}
          </div>

          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className={`text-2xl mb-2 ${connectionStatus.hasPAT ? 'text-yellow-600' : 'text-gray-400'}`}>
              🔑
            </div>
            <h4 className="font-medium text-gray-900">Personal Access Token</h4>
            <p className="text-sm text-gray-600">
              {connectionStatus.hasPAT ? 'Connected' : 'Not Connected'}
            </p>
            {connectionStatus.hasPAT && !connectionStatus.hasOAuth && (
              <span className="inline-block mt-1 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                Legacy
              </span>
            )}
          </div>

          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className={`text-2xl mb-2 ${connectionStatus.connected ? 'text-green-600' : 'text-red-600'}`}>
              {connectionStatus.connected ? '✅' : '❌'}
            </div>
            <h4 className="font-medium text-gray-900">Overall Status</h4>
            <p className="text-sm text-gray-600">
              {connectionStatus.connected ? 'Connected' : 'Not Connected'}
            </p>
          </div>
        </div>

        {/* Smart Recommendations */}
        {connectionStatus.recommendations && connectionStatus.recommendations.length > 0 && (
          <div className="mt-6 space-y-4">
            {connectionStatus.recommendations.map((rec, index) => (
              <div 
                key={index}
                className={`p-4 rounded-lg border ${
                  rec.priority === 'high' ? 'bg-red-50 border-red-200' :
                  rec.priority === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                  rec.type === 'success' ? 'bg-green-50 border-green-200' :
                  'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    {rec.type === 'connect' && (
                      <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                      </svg>
                    )}
                    {rec.type === 'upgrade' && (
                      <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                    {rec.type === 'success' && (
                      <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                    {rec.type === 'info' && (
                      <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="ml-3 flex-1">
                    <h4 className={`font-medium ${
                      rec.priority === 'high' ? 'text-red-900' :
                      rec.priority === 'medium' ? 'text-yellow-900' :
                      rec.type === 'success' ? 'text-green-900' :
                      'text-blue-900'
                    }`}>
                      {rec.title}
                    </h4>
                    <p className={`text-sm mt-1 ${
                      rec.priority === 'high' ? 'text-red-700' :
                      rec.priority === 'medium' ? 'text-yellow-700' :
                      rec.type === 'success' ? 'text-green-700' :
                      'text-blue-700'
                    }`}>
                      {rec.description}
                    </p>
                    {rec.action && rec.action !== 'oauth_info' && rec.action !== 'sync' && (
                      <div className="mt-3">
                        <button
                          onClick={rec.action === 'oauth_connect' || rec.action === 'oauth_upgrade' ? handleOAuthConnect : undefined}
                          disabled={loading}
                          className={`px-4 py-2 text-sm font-medium rounded-md disabled:opacity-50 ${
                            rec.priority === 'high' ? 'bg-red-600 text-white hover:bg-red-700' :
                            rec.priority === 'medium' ? 'bg-yellow-600 text-white hover:bg-yellow-700' :
                            'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {loading ? 'Processing...' : rec.actionText}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* GitLab Data Display */}
      {connectionStatus.connected && gitlabData && (
        <div className="space-y-6">
          {/* Navigation Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', name: 'Overview', icon: '📊' },
                { id: 'commits', name: 'Commits', icon: '💻' },
                { id: 'insights', name: 'Insights', icon: '🔍' },
                { id: 'analytics', name: 'Analytics', icon: '📈' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveView(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeView === tab.id
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
          {activeView === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Total Commits</h3>
                <p className="text-3xl font-bold text-blue-600">
                  {gitlabData.data?.totalCommits || gitlabData.totalCommits || 0}
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Active Projects</h3>
                <p className="text-3xl font-bold text-green-600">
                  {gitlabData.data?.activeProjects || gitlabData.activeProjects || 0}
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Integration Type</h3>
                <p className="text-lg font-medium text-purple-600">
                  {connectionStatus.preferredMethod === 'oauth' ? 'OAuth 🔐' : 'PAT 🔑'}
                </p>
              </div>
            </div>
          )}

          {activeView === 'commits' && (
            <GitLabCommitTracker 
              data={gitlabData} 
              tokenType={connectionStatus.preferredMethod}
            />
          )}

          {activeView === 'insights' && (
            <GitLabInsightsDashboard />
          )}

          {activeView === 'analytics' && gitlabData.stats && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Detailed Analytics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{gitlabData.stats.totalAdditions}</p>
                  <p className="text-sm text-gray-600">Lines Added</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{gitlabData.stats.totalDeletions}</p>
                  <p className="text-sm text-gray-600">Lines Deleted</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{gitlabData.stats.averageCommitsPerDay.toFixed(1)}</p>
                  <p className="text-sm text-gray-600">Avg Commits/Day</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-purple-600">{gitlabData.stats.mostActiveProject || 'N/A'}</p>
                  <p className="text-sm text-gray-600">Most Active Project</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}