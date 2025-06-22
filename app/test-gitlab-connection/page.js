'use client';

import { useState } from 'react';

export default function TestGitLabConnection() {
  const [token, setToken] = useState('');
  const [username, setUsername] = useState('');
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState(null);

  const testConnection = async () => {
    if (!token.trim()) {
      setResult({
        success: false,
        error: 'Please enter a Personal Access Token'
      });
      return;
    }

    setTesting(true);
    setResult(null);

    try {
      const response = await fetch('/api/gitlab/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token.trim(),
          username: username.trim() || undefined
        })
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: 'Network error: ' + error.message
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-6">🧪 GitLab Connection Test</h1>
          
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">How to create a Personal Access Token:</h3>
            <ol className="list-decimal list-inside text-sm text-blue-700 space-y-1">
              <li>Go to <a href="https://code.swecha.org/-/profile/personal_access_tokens" target="_blank" rel="noopener noreferrer" className="underline">Swecha GitLab → Settings → Access Tokens</a></li>
              <li>Click "Add new token"</li>
              <li>Give it a name (e.g., "InternLink Integration")</li>
              <li>Select scopes: <code className="bg-blue-100 px-1 rounded">read_user</code>, <code className="bg-blue-100 px-1 rounded">read_api</code>, <code className="bg-blue-100 px-1 rounded">read_repository</code></li>
              <li>Click "Create personal access token"</li>
              <li>Copy the token (starts with <code className="bg-blue-100 px-1 rounded">glpat-</code>)</li>
            </ol>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GitLab Username (optional)
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="your-gitlab-username"
              />
              <p className="text-xs text-gray-500 mt-1">
                Optional: We'll verify the token belongs to this username
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Personal Access Token *
              </label>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="glpat-xxxxxxxxxxxxxxxxxxxx"
              />
              <p className="text-xs text-gray-500 mt-1">
                Your Personal Access Token from Swecha GitLab
              </p>
            </div>
          </div>

          <button
            onClick={testConnection}
            disabled={testing || !token.trim()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {testing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                Testing Connection...
              </>
            ) : (
              '🔍 Test Connection'
            )}
          </button>

          {result && (
            <div className={`mt-6 p-4 rounded-lg border ${
              result.success 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {result.success ? (
                    <div className="text-green-600 text-xl">✅</div>
                  ) : (
                    <div className="text-red-600 text-xl">❌</div>
                  )}
                </div>
                <div className="ml-3 flex-1">
                  <h3 className={`font-semibold ${
                    result.success ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {result.success ? 'Connection Successful!' : 'Connection Failed'}
                  </h3>
                  
                  {result.success ? (
                    <div className="mt-2 space-y-2">
                      <p className="text-green-700">{result.message}</p>
                      
                      {result.user && (
                        <div className="bg-green-100 p-3 rounded">
                          <h4 className="font-medium text-green-900">User Information:</h4>
                          <ul className="text-sm text-green-700 mt-1">
                            <li><strong>Username:</strong> {result.user.username}</li>
                            <li><strong>Name:</strong> {result.user.name}</li>
                            <li><strong>Email:</strong> {result.user.email}</li>
                            <li><strong>ID:</strong> {result.user.id}</li>
                          </ul>
                        </div>
                      )}
                      
                      {result.projects && (
                        <div className="bg-green-100 p-3 rounded">
                          <h4 className="font-medium text-green-900">Projects Access:</h4>
                          <p className="text-sm text-green-700">
                            Found {result.projects.count} accessible projects
                          </p>
                          {result.projects.sample && result.projects.sample.length > 0 && (
                            <ul className="text-sm text-green-700 mt-1">
                              {result.projects.sample.map(project => (
                                <li key={project.id}>• {project.name} ({project.path})</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                      
                      <div className="text-xs text-green-600">
                        <p><strong>API Base:</strong> {result.apiBase}</p>
                        {result.tokenScopes && (
                          <p><strong>Token Scopes:</strong> {result.tokenScopes}</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2">
                      <p className="text-red-700">{result.error}</p>
                      
                      {result.details && (
                        <div className="mt-2 bg-red-100 p-3 rounded">
                          <h4 className="font-medium text-red-900">Debug Information:</h4>
                          <pre className="text-xs text-red-700 mt-1 overflow-x-auto">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </div>
                      )}
                      
                      <div className="mt-3 text-sm text-red-700">
                        <p><strong>Common Issues:</strong></p>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          <li>Token doesn't have required scopes (read_user, read_api, read_repository)</li>
                          <li>Token has expired or been revoked</li>
                          <li>Username mismatch (token belongs to different user)</li>
                          <li>Network connectivity issues</li>
                          <li>GitLab instance is not accessible</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Next Steps:</h3>
            <div className="text-sm text-gray-700 space-y-1">
              {result?.success ? (
                <>
                  <p>✅ Your token is working correctly!</p>
                  <p>🔗 You can now use this token in the GitLab tab of your intern dashboard</p>
                  <p>📊 Go to your dashboard and connect your GitLab account to start tracking progress</p>
                </>
              ) : (
                <>
                  <p>1. Verify your token has the correct scopes</p>
                  <p>2. Make sure you're using a token from <strong>code.swecha.org</strong></p>
                  <p>3. Check that your token hasn't expired</p>
                  <p>4. Try creating a new token if the current one doesn't work</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}