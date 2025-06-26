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
  const [activeView, setActiveView] = useState('overview'); // overview, commits, analytics, merge-requests
  const [successMessage, setSuccessMessage] = useState(null);
  const [showOAuthConnect, setShowOAuthConnect] = useState(false);
  const [oauthAvailable, setOauthAvailable] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    checkGitLabConnection();
  }, []);

  // Helper function to safely parse JSON responses
  const safeJsonParse = async (response, errorContext) => {
    try {
      const text = await response.text();
      
      if (!text || text.trim() === '') {
        throw new Error(`Empty response from ${errorContext}`);
      }
      
      try {
        return JSON.parse(text);
      } catch (jsonError) {
        console.error(`❌ JSON parse error (${errorContext}):`, jsonError);
        console.error('Response text:', text.substring(0, 200));
        throw new Error(`Invalid JSON response from ${errorContext}: ${jsonError.message}`);
      }
    } catch (error) {
      console.error(`Error parsing ${errorContext} response:`, error);
      throw error;
    }
  };
  
  const checkGitLabConnection = async () => {
    try {
      setLoading(true);
      setError(null); // Clear any previous errors
      
      // First check OAuth status
      const oauthResponse = await fetch('/api/gitlab/oauth-connect');
      if (oauthResponse.ok) {
        const oauthData = await safeJsonParse(oauthResponse, 'OAuth check');
        setOauthAvailable(oauthData.canConnectViaOAuth);
        
        if (oauthData.canConnectViaOAuth) {
          // User has valid OAuth token, check if already connected
          const statusResponse = await fetch('/api/gitlab/connection-status');
          if (statusResponse.ok) {
            const statusData = await safeJsonParse(statusResponse, 'connection status');
            setIsConnected(statusData.connected);
            if (statusData.connected) {
              await fetchGitLabData();
            } else {
              // Has OAuth token but not connected, show OAuth connect option
              setShowOAuthConnect(true);
            }
          } else {
            try {
              const statusError = await safeJsonParse(statusResponse, 'connection status error');
              console.error('Connection status check failed:', statusError);
              // Only show error if it's not a simple "not connected" case
              if (statusResponse.status !== 401 && !statusError.error?.includes('not connected')) {
                setError(`Failed to check connection status: ${statusError.error || 'Unknown error'}`);
              }
            } catch (parseError) {
              // If we can't parse the error response, just log it
              console.error('Failed to parse connection status error:', parseError);
            }
          }
        } else {
          // No OAuth token, check for existing PAT connection
          const statusResponse = await fetch('/api/gitlab/connection-status');
          if (statusResponse.ok) {
            const statusData = await safeJsonParse(statusResponse, 'connection status');
            setIsConnected(statusData.connected);
            if (statusData.connected) {
              await fetchGitLabData();
            }
          } else {
            try {
              const statusError = await safeJsonParse(statusResponse, 'connection status error');
              console.error('Connection status check failed:', statusError);
              // Don't show error for first-time users, just show connect UI
              if (statusResponse.status !== 401 && !statusError.error?.includes('not connected')) {
                setError(`Failed to check connection status: ${statusError.error || 'Unknown error'}`);
              }
            } catch (parseError) {
              // If we can't parse the error response, just log it
              console.error('Failed to parse connection status error:', parseError);
            }
          }
        }
      } else {
        // OAuth check failed, try to check PAT connection status
        console.warn('OAuth check failed, checking for existing PAT connection');
        try {
          const statusResponse = await fetch('/api/gitlab/connection-status');
          if (statusResponse.ok) {
            const statusData = await safeJsonParse(statusResponse, 'connection status');
            setIsConnected(statusData.connected);
            if (statusData.connected) {
              await fetchGitLabData();
            }
          } else {
            // Both OAuth and PAT checks failed, but don't show error for first-time users
            console.log('No existing GitLab connection found, showing connect UI');
          }
        } catch (fallbackError) {
          console.warn('Fallback connection check also failed:', fallbackError);
        }
      }
    } catch (error) {
      console.error('Error checking GitLab connection:', error);
      // Only set error if already connected, otherwise show connect UI
      if (isConnected) {
        // Handle specific error messages
        let errorMessage = error.message;
        if (error.message.includes('Unexpected end of JSON input')) {
          errorMessage = 'Server returned an invalid response. This may be due to a timeout or connection issue. Please try again.';
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Network error. Please check your internet connection and try again.';
        }
        
        setError(`Connection check failed: ${errorMessage}`);
      } else {
        console.warn('Initial connection check failed, showing connect UI');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchGitLabData = async () => {
    try {
      const response = await fetch('/api/gitlab/intern-analytics');
      if (response.ok) {
        // First get the response as text to handle potential JSON parsing issues
        const responseText = await response.text();
        
        // Check if the response is empty
        if (!responseText || responseText.trim() === '') {
          throw new Error('Empty response from server');
        }
        
        // Try to parse the JSON
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (jsonError) {
          console.error('❌ JSON parse error:', jsonError);
          console.error('Response text:', responseText.substring(0, 200));
          throw new Error(`Invalid JSON response: ${jsonError.message}`);
        }
        
        if (data.connected === false || data.error === 'GitLab not connected') {
          setIsConnected(false);
          setGitlabData(null);
          // Do NOT set error, just show connect UI
        } else {
          setGitlabData(data);
        }
      } else {
        // Handle error response
        try {
          const errorText = await response.text();
          let errorMessage = 'Failed to fetch GitLab data';
          
          // Try to parse error as JSON
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.error || errorMessage;
          } catch (jsonError) {
            // If JSON parsing fails, use the raw text if it's not empty
            if (errorText && errorText.trim() !== '') {
              errorMessage = errorText;
            }
          }
          
          throw new Error(errorMessage);
        } catch (responseError) {
          throw new Error(`Failed to fetch GitLab data: ${responseError.message}`);
        }
      }
    } catch (error) {
      console.error('Error fetching GitLab data:', error);
      
      // Handle specific error messages
      let errorMessage = error.message;
      if (error.message.includes('Unexpected end of JSON input')) {
        errorMessage = 'Server returned an invalid response. This may be due to a timeout or connection issue. Please try again.';
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      }
      
      if (isConnected) setError(`Failed to fetch GitLab data: ${errorMessage}`);
    }
  };

  const handleTestConnection = async () => {
    if (!tokenForm.personalAccessToken || !tokenForm.gitlabUsername) {
      setTestResult({ success: false, message: 'Please fill in both username and token first' });
      return;
    }

    if (!tokenForm.personalAccessToken.startsWith('glpat-')) {
      setTestResult({ success: false, message: 'Token should start with "glpat-"' });
      return;
    }

    setTestingConnection(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/gitlab/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: tokenForm.personalAccessToken,
          username: tokenForm.gitlabUsername
        }),
      });

      if (response.ok) {
        const data = await safeJsonParse(response, 'test connection');
        setTestResult({ 
          success: true, 
          message: `✅ Connection successful! Found user: ${data.user?.name} (@${data.user?.username})`,
          user: data.user
        });
      } else {
        try {
          const errorData = await safeJsonParse(response, 'test connection error');
          setTestResult({ 
            success: false, 
            message: errorData.error || 'Connection test failed'
          });
        } catch (parseError) {
          console.error('Failed to parse test connection error:', parseError);
          setTestResult({ 
            success: false, 
            message: 'Connection test failed: Invalid server response'
          });
        }
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      
      // Handle specific error messages
      let errorMessage = `Connection test failed: ${error.message}`;
      if (error.message.includes('Unexpected end of JSON input')) {
        errorMessage = 'Server returned an invalid response. This may be due to a timeout or connection issue. Please try again.';
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      }
      
      setTestResult({ 
        success: false, 
        message: errorMessage
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleTokenSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Basic validation
    if (!tokenForm.personalAccessToken || !tokenForm.gitlabUsername) {
      setError('Please fill in both GitLab username and Personal Access Token');
      setLoading(false);
      return;
    }

    if (!tokenForm.personalAccessToken.startsWith('glpat-')) {
      setError('Personal Access Token should start with "glpat-". Please check your token.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/gitlab/connect-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tokenForm),
      });

      if (response.ok) {
        const data = await safeJsonParse(response, 'token connect');
        setIsConnected(true);
        setShowTokenForm(false);
        setSuccessMessage(`Successfully connected to GitLab as @${data.integration?.username}! Found ${data.integration?.repositoriesCount || 0} repositories.`);
        await fetchGitLabData();
        // Clear success message after 5 seconds
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        try {
          const errorData = await safeJsonParse(response, 'token connect error');
          let errorMessage = errorData.error || 'Failed to connect GitLab';
          
          // Provide more specific error messages
          if (response.status === 400) {
            if (errorMessage.includes('Invalid Personal Access Token')) {
              errorMessage = 'Invalid Personal Access Token. Please check that your token is correct and has the required permissions (read_api, read_repository, read_user).';
            } else if (errorMessage.includes('username does not match')) {
              errorMessage = 'The GitLab username does not match the token owner. Please verify both your username and token.';
            }
          } else if (response.status === 401) {
            errorMessage = 'Authentication failed. Please check your Personal Access Token and try again.';
          } else if (response.status === 403) {
            errorMessage = 'Access denied. Your token may not have the required permissions (read_api, read_repository, read_user).';
          }
          
          setError(errorMessage);
        } catch (parseError) {
          console.error('Failed to parse token connect error:', parseError);
          setError('Failed to connect GitLab: Invalid server response');
        }
      }
    } catch (error) {
      console.error('Error connecting GitLab:', error);
      
      // Handle specific error messages
      let errorMessage = `Connection failed: ${error.message}`;
      if (error.message.includes('Unexpected end of JSON input')) {
        errorMessage = 'Server returned an invalid response. This may be due to a timeout or connection issue. Please try again.';
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (fullSync = false, customDays = null) => {
    setSyncing(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      console.log('🚀 Starting GitLab sync...');
      
      // Use the simple-sync API that we know works
      const response = await fetch('/api/gitlab/simple-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        // First get the response as text to handle potential JSON parsing issues
        const responseText = await response.text();
        
        // Check if the response is empty
        if (!responseText || responseText.trim() === '') {
          throw new Error('Empty response from server');
        }
        
        // Try to parse the JSON
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (jsonError) {
          console.error('❌ JSON parse error:', jsonError);
          console.error('Response text:', responseText.substring(0, 200));
          throw new Error(`Invalid JSON response: ${jsonError.message}`);
        }
        
        console.log('✅ Sync completed:', data);
        
        // Refresh the GitLab data to show new information
        await fetchGitLabData();
        
        // Show success message with sync results
        if (data.results) {
          const { projectsFound, commitsFound, commitsStored } = data.results;
          setSuccessMessage(
            `🎉 Sync completed! Found ${commitsFound} commits from ${projectsFound} projects. ` +
            `Stored ${commitsStored} new commits in your profile.`
          );
          setTimeout(() => setSuccessMessage(null), 10000);
        } else {
          setSuccessMessage('✅ GitLab sync completed successfully!');
          setTimeout(() => setSuccessMessage(null), 5000);
        }
      } else {
        // Handle error response
        try {
          const errorText = await response.text();
          let errorMessage = 'Sync failed';
          
          // Try to parse error as JSON
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.error || errorMessage;
          } catch (jsonError) {
            // If JSON parsing fails, use the raw text
            errorMessage = errorText || errorMessage;
          }
          
          throw new Error(errorMessage);
        } catch (responseError) {
          throw new Error(`Sync failed: ${responseError.message}`);
        }
      }
    } catch (error) {
      console.error('❌ Error syncing GitLab data:', error);
      
      // Handle specific error messages
      let errorMessage = error.message;
      if (error.message.includes('Unexpected end of JSON input')) {
        errorMessage = 'Server returned an invalid response. This may be due to a timeout or connection issue. Please try again.';
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      }
      
      setError(`Failed to sync GitLab data: ${errorMessage}`);
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
        const data = await safeJsonParse(response, 'OAuth connect');
        setIsConnected(true);
        setShowOAuthConnect(false);
        setSuccessMessage(`Successfully connected to GitLab via OAuth! Found ${data.stats?.totalProjects || 0} projects with ${data.stats?.totalCommits || 0} commits.`);
        await fetchGitLabData();
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        try {
          const errorData = await safeJsonParse(response, 'OAuth connect error');
          setError(errorData.error || 'Failed to connect via OAuth');
        } catch (parseError) {
          console.error('Failed to parse OAuth connect error:', parseError);
          setError('Failed to connect via OAuth: Invalid server response');
        }
      }
    } catch (error) {
      console.error('Error connecting via OAuth:', error);
      
      // Handle specific error messages
      let errorMessage = 'Failed to connect via OAuth';
      if (error.message.includes('Unexpected end of JSON input')) {
        errorMessage = 'Server returned an invalid response. This may be due to a timeout or connection issue. Please try again.';
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      }
      
      setError(errorMessage);
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
        const data = await safeJsonParse(response, 'disconnect');
        setIsConnected(false);
        setGitlabData(null);
        setError(null);
        setShowOAuthConnect(false);
        setSuccessMessage(`GitLab account disconnected successfully. Removed ${data.removedData?.activityRecords || 0} activity records.`);
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        try {
          const errorData = await safeJsonParse(response, 'disconnect error');
          setError(errorData.error || 'Failed to disconnect GitLab account');
        } catch (parseError) {
          console.error('Failed to parse disconnect error:', parseError);
          setError('Failed to disconnect GitLab account: Invalid server response');
        }
      }
    } catch (error) {
      console.error('Error disconnecting GitLab:', error);
      
      // Handle specific error messages
      let errorMessage = 'Failed to disconnect GitLab account';
      if (error.message.includes('Unexpected end of JSON input')) {
        errorMessage = 'Server returned an invalid response. This may be due to a timeout or connection issue. Please try again.';
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      }
      
      setError(errorMessage);
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
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="text-red-400 mr-3">⚠️</div>
              <div>
                <h4 className="text-red-800 font-medium">Connection Error</h4>
                <p className="text-red-600 text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="text-green-400 mr-3">✅</div>
              <div>
                <h4 className="text-green-800 font-medium">Success!</h4>
                <p className="text-green-600 text-sm mt-1">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🦊</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Connect Your GitLab Account</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Connect your Swecha GitLab account to track your development progress, 
              commits, and contributions across your repositories.
            </p>
            
            {/* Connection Requirements */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 max-w-lg mx-auto">
              <h4 className="font-semibold text-blue-900 mb-2">📋 What You'll Need:</h4>
              <ul className="text-blue-700 text-sm text-left space-y-1">
                <li>• A Swecha GitLab account (code.swecha.org)</li>
                <li>• Personal Access Token with proper permissions</li>
                <li>• Your GitLab username</li>
              </ul>
            </div>
            
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
                {/* Step-by-step instructions */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-left">
                  <h4 className="font-semibold text-yellow-900 mb-2">🔑 How to Create a Personal Access Token:</h4>
                  <ol className="text-yellow-800 text-sm space-y-1 list-decimal list-inside">
                    <li>Go to <a href="https://code.swecha.org/-/profile/personal_access_tokens" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">Swecha GitLab → Settings → Access Tokens</a></li>
                    <li>Click "Add new token"</li>
                    <li>Give it a name (e.g., "InternLink Integration")</li>
                    <li>Select scopes: <strong>read_api</strong>, <strong>read_repository</strong>, <strong>read_user</strong></li>
                    <li>Click "Create personal access token"</li>
                    <li>Copy the token (starts with "glpat-")</li>
                  </ol>
                </div>

                <form onSubmit={handleTokenSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      GitLab Username <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={tokenForm.gitlabUsername}
                      onChange={(e) => setTokenForm({...(tokenForm || {}), gitlabUsername: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="your-gitlab-username"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Your username from code.swecha.org (not your display name)
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Personal Access Token <span className="text-red-500">*</span>
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
                      The token you created with <strong>read_api</strong>, <strong>read_repository</strong>, and <strong>read_user</strong> permissions
                    </p>
                    
                    {/* Test Connection Button */}
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={handleTestConnection}
                        disabled={testingConnection || !tokenForm.personalAccessToken || !tokenForm.gitlabUsername}
                        className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 disabled:opacity-50 transition-colors"
                      >
                        {testingConnection ? '🔄 Testing...' : '🔍 Test Connection'}
                      </button>
                    </div>
                    
                    {/* Test Result */}
                    {testResult && (
                      <div className={`mt-2 p-2 rounded text-sm ${
                        testResult.success 
                          ? 'bg-green-50 border border-green-200 text-green-700' 
                          : 'bg-red-50 border border-red-200 text-red-700'
                      }`}>
                        {testResult.message}
                      </div>
                    )}
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
      
      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start">
          <div className="text-green-500 text-xl mr-3">✅</div>
          <div>
            <p className="text-green-800 font-medium">{successMessage}</p>
            <p className="text-green-600 text-sm mt-1">
              You can now view your GitLab activity and insights below.
            </p>
          </div>
        </div>
      )}
      
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <div className="text-red-500 text-xl mr-3">⚠️</div>
          <div>
            <p className="text-red-800 font-medium">Error</p>
            <p className="text-red-600">{error}</p>
            <button 
              onClick={() => setError(null)} 
              className="text-red-600 underline text-sm mt-1"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

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
              {gitlabData?.lastSyncAt && (
                <div className="text-xs text-gray-500 mt-1">Last Sync: {formatDate(gitlabData.lastSyncAt)}</div>
              )}
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

        {/* Sync Warning */}
        {gitlabData?.warning && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start mt-2">
            <div className="text-yellow-500 text-xl mr-3">⚠️</div>
            <div>
              <p className="text-yellow-800 font-medium">Sync Warning</p>
              <p className="text-yellow-700 text-sm mt-1">{gitlabData.warning}</p>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-6">
            {[
              { id: 'overview', name: 'Overview', icon: '📊' },
              { id: 'repositories', name: 'Repositories', icon: '📁' },
              { id: 'commits', name: 'Commits', icon: '💾' },
              { id: 'merge-requests', name: 'Merge Requests', icon: '🔀' },
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

      {/* No Data State - Show when connected but no data synced yet */}
      {(!gitlabData || !gitlabData.summary || gitlabData.summary.totalCommits === 0) && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No GitLab Data Yet</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Your GitLab account is connected, but we haven't synced your data yet.<br/>
            <b>Troubleshooting:</b>
            <ul className="list-disc text-left ml-8 mt-2 text-sm text-gray-500">
              <li>Click the sync button above to fetch your commits and activity.</li>
              <li>Make sure your token has <code>read_api</code>, <code>read_repository</code>, and <code>read_user</code> permissions.</li>
              <li>If you see an error, use the Debug tool below for more info.</li>
              <li>If problems persist, contact your mentor or admin.</li>
            </ul>
          </p>
          
          <div className="flex justify-center space-x-4">
            {/* Use full sync for initial data load */}
            <button
              onClick={() => handleSync(true)}
              disabled={syncing}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium flex items-center space-x-2"
            >
              <span>{syncing ? '🔄' : '🚀'}</span>
              <span>{syncing ? 'Syncing Your Data...' : 'Sync My GitLab Data'}</span>
            </button>
          </div>
          
          {syncing && (
            <div className="mt-6 text-sm text-gray-600">
              <div className="flex justify-center mb-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
              <p>This may take a minute or two depending on your GitLab activity.</p>
              <p className="mt-1">We're fetching your commits from the past year.</p>
            </div>
          )}
          
          {!syncing && (
            <div className="mt-4 text-sm text-gray-500">
              <p>This will fetch your commits, repositories, and contribution data from GitLab.</p>
              <p className="mt-1">The initial sync may take a minute to complete.</p>
            </div>
          )}
        </div>
      )}

      {/* Content based on active view - Only show when we have data */}
      {gitlabData && gitlabData.summary && gitlabData.summary.totalCommits > 0 && activeView === 'overview' && (
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

      {activeView === 'merge-requests' && (
        <MergeRequestsView gitlabData={gitlabData} />
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

// Merge Requests View Component
function MergeRequestsView({ gitlabData }) {
  const [mergeRequests, setMergeRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, opened, merged, closed
  const [sortBy, setSortBy] = useState('updated'); // updated, created, title

  useEffect(() => {
    fetchMergeRequests();
  }, []);

  const fetchMergeRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/gitlab/merge-requests');
      if (response.ok) {
        const data = await response.json();
        setMergeRequests(data.mergeRequests || []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch merge requests');
      }
    } catch (error) {
      console.error('Error fetching merge requests:', error);
      setError('Failed to fetch merge requests');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredAndSortedMRs = () => {
    let filtered = mergeRequests;

    // Apply filter
    if (filter !== 'all') {
      filtered = filtered.filter(mr => mr.state === filter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'created':
          return new Date(b.created_at) - new Date(a.created_at);
        case 'title':
          return a.title.localeCompare(b.title);
        case 'updated':
        default:
          return new Date(b.updated_at) - new Date(a.updated_at);
      }
    });

    return filtered;
  };

  const getStatusColor = (state) => {
    switch (state) {
      case 'opened':
        return 'bg-green-100 text-green-800';
      case 'merged':
        return 'bg-blue-100 text-blue-800';
      case 'closed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (state) => {
    switch (state) {
      case 'opened':
        return '🟢';
      case 'merged':
        return '🔀';
      case 'closed':
        return '🔴';
      default:
        return '⚪';
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

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <div className="text-red-400 text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Merge Requests</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchMergeRequests}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const filteredMRs = getFilteredAndSortedMRs();
  const stats = {
    total: mergeRequests.length,
    opened: mergeRequests.filter(mr => mr.state === 'opened').length,
    merged: mergeRequests.filter(mr => mr.state === 'merged').length,
    closed: mergeRequests.filter(mr => mr.state === 'closed').length
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <span className="text-2xl">🔀</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total MRs</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-2xl">🟢</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Open</p>
              <p className="text-2xl font-semibold text-green-600">{stats.opened}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-2xl">✅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Merged</p>
              <p className="text-2xl font-semibold text-blue-600">{stats.merged}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <span className="text-2xl">🔴</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Closed</p>
              <p className="text-2xl font-semibold text-red-600">{stats.closed}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Status</option>
                <option value="opened">Open</option>
                <option value="merged">Merged</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort by</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="updated">Last Updated</option>
                <option value="created">Created Date</option>
                <option value="title">Title</option>
              </select>
            </div>
          </div>
          <button
            onClick={fetchMergeRequests}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm flex items-center space-x-2"
          >
            <span>🔄</span>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Merge Requests List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Merge Requests ({filteredMRs.length})
          </h3>
        </div>

        {filteredMRs.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">🔀</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No merge requests found</h3>
            <p className="text-gray-600">
              {filter === 'all' 
                ? "You haven't created any merge requests yet." 
                : `No ${filter} merge requests found.`}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredMRs.map((mr) => (
              <div key={mr.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-lg">{getStatusIcon(mr.state)}</span>
                      <h4 className="text-lg font-medium text-gray-900 hover:text-blue-600">
                        <a 
                          href={mr.web_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {mr.title}
                        </a>
                      </h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(mr.state)}`}>
                        {mr.state}
                      </span>
                    </div>

                    <div className="text-sm text-gray-600 mb-3">
                      <p className="line-clamp-2">{mr.description || 'No description provided'}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <span>📁</span>
                        <span>{mr.source_project?.name || 'Unknown Project'}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span>🌿</span>
                        <span>{mr.source_branch} → {mr.target_branch}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span>📅</span>
                        <span>Created {formatDate(mr.created_at)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span>🔄</span>
                        <span>Updated {formatDate(mr.updated_at)}</span>
                      </div>
                      {mr.merged_at && (
                        <div className="flex items-center space-x-1">
                          <span>✅</span>
                          <span>Merged {formatDate(mr.merged_at)}</span>
                        </div>
                      )}
                    </div>

                    {/* Additional Info */}
                    <div className="flex items-center space-x-4 mt-3 text-sm">
                      {mr.upvotes > 0 && (
                        <span className="flex items-center space-x-1 text-green-600">
                          <span>👍</span>
                          <span>{mr.upvotes}</span>
                        </span>
                      )}
                      {mr.downvotes > 0 && (
                        <span className="flex items-center space-x-1 text-red-600">
                          <span>👎</span>
                          <span>{mr.downvotes}</span>
                        </span>
                      )}
                      {mr.user_notes_count > 0 && (
                        <span className="flex items-center space-x-1 text-blue-600">
                          <span>💬</span>
                          <span>{mr.user_notes_count} comments</span>
                        </span>
                      )}
                      {mr.changes_count && (
                        <span className="flex items-center space-x-1 text-purple-600">
                          <span>📝</span>
                          <span>{mr.changes_count} changes</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="ml-4 flex-shrink-0">
                    <a
                      href={mr.web_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <span className="mr-2">🔗</span>
                      View in GitLab
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}