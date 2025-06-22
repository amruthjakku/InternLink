'use client';

import { useState } from 'react';

export function GitLabDebugInfo({ gitlabData, integration }) {
  const [showDebug, setShowDebug] = useState(false);
  const [debugData, setDebugData] = useState(null);

  const runDebugCheck = async () => {
    try {
      // Check what's in the database
      const [analyticsResponse, debugResponse] = await Promise.all([
        fetch('/api/gitlab/intern-analytics?includeDebug=true'),
        fetch('/api/gitlab/debug-commits')
      ]);
      
      const analyticsData = await analyticsResponse.json();
      const debugCommitsData = await debugResponse.json();
      
      setDebugData({
        analytics: analyticsData,
        commits: debugCommitsData
      });
    } catch (error) {
      setDebugData({ error: error.message });
    }
  };

  if (!showDebug) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-yellow-800">Debug Information</h3>
            <p className="text-sm text-yellow-700">
              Not seeing your repositories or commits? Click to debug the issue.
            </p>
          </div>
          <button
            onClick={() => {
              setShowDebug(true);
              runDebugCheck();
            }}
            className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700"
          >
            Debug
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Debug Information</h3>
        <button
          onClick={() => setShowDebug(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      <div className="space-y-4 text-sm">
        {/* Connection Info */}
        <div className="bg-white p-3 rounded border">
          <h4 className="font-medium text-gray-900 mb-2">Connection Status</h4>
          <div className="space-y-1 text-gray-600">
            <div>GitLab Username: <span className="font-mono">{debugData?.commits?.user?.username || integration?.gitlabUsername || 'N/A'}</span></div>
            <div>GitLab Email: <span className="font-mono">{debugData?.commits?.user?.email || integration?.gitlabEmail || 'N/A'}</span></div>
            <div>API Base: <span className="font-mono">{debugData?.commits?.user?.apiBase || integration?.apiBase || 'Default'}</span></div>
            <div>Projects Found: <span className="font-mono">{debugData?.commits?.projects || 0}</span></div>
          </div>
        </div>

        {/* Data Summary */}
        <div className="bg-white p-3 rounded border">
          <h4 className="font-medium text-gray-900 mb-2">Data Summary</h4>
          <div className="space-y-1 text-gray-600">
            <div>Total Commits: <span className="font-mono">{gitlabData?.summary?.totalCommits || 0}</span></div>
            <div>Active Repositories: <span className="font-mono">{gitlabData?.summary?.activeRepositories || 0}</span></div>
            <div>Repository Stats: <span className="font-mono">{gitlabData?.repositoryStats?.length || 0}</span></div>
            <div>Recent Commits: <span className="font-mono">{gitlabData?.recentCommits?.length || 0}</span></div>
          </div>
        </div>

        {/* Commit Samples */}
        {debugData?.commits?.projectSamples && (
          <div className="bg-white p-3 rounded border">
            <h4 className="font-medium text-gray-900 mb-2">Sample Commits from Your Projects</h4>
            <div className="space-y-3">
              {debugData.commits.projectSamples.map((project, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-3">
                  <div className="font-medium text-gray-900">{project.projectName}</div>
                  {project.error ? (
                    <div className="text-red-600 text-xs">Error: {project.error}</div>
                  ) : (
                    <div className="space-y-1">
                      <div className="text-xs text-gray-600">Found {project.commitsFound} commits</div>
                      {project.sampleCommits?.map((commit, commitIndex) => (
                        <div key={commitIndex} className={`text-xs p-2 rounded ${commit.matchesUser ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                          <div className="font-medium">{commit.title}</div>
                          <div className="text-gray-600">
                            By: {commit.author_name} ({commit.author_email})
                            {commit.matchesUser && <span className="text-green-600 font-medium"> ✓ MATCHES YOU</span>}
                          </div>
                          <div className="text-gray-500">{new Date(commit.created_at).toLocaleDateString()}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Debug Data */}
        {debugData && (
          <div className="bg-white p-3 rounded border">
            <h4 className="font-medium text-gray-900 mb-2">API Response Debug</h4>
            {debugData.error ? (
              <div className="text-red-600">Error: {debugData.error}</div>
            ) : (
              <div className="space-y-2">
                <div>Connected: <span className="font-mono">{debugData.analytics?.connected ? 'Yes' : 'No'}</span></div>
                <div>Period: <span className="font-mono">{debugData.analytics?.period?.days} days</span></div>
                {debugData.analytics?.summary && (
                  <div className="mt-2">
                    <div className="font-medium">Summary:</div>
                    <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                      {JSON.stringify(debugData.analytics.summary, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Troubleshooting Steps */}
        <div className="bg-blue-50 p-3 rounded border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-2">Troubleshooting Steps</h4>
          <div className="space-y-2 text-blue-800 text-sm">
            <div className="flex items-start space-x-2">
              <span>1.</span>
              <span>Try the <strong>"Full Sync"</strong> button to sync commits from the past year</span>
            </div>
            <div className="flex items-start space-x-2">
              <span>2.</span>
              <span>Check if your GitLab username matches exactly (case-sensitive)</span>
            </div>
            <div className="flex items-start space-x-2">
              <span>3.</span>
              <span>Verify you have commits in your GitLab repositories</span>
            </div>
            <div className="flex items-start space-x-2">
              <span>4.</span>
              <span>Check browser console (F12) for any error messages</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex space-x-2">
          <button
            onClick={runDebugCheck}
            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
          >
            Refresh Debug Info
          </button>
          <a
            href="/debug-gitlab"
            target="_blank"
            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
          >
            Open Full Debug Page
          </a>
        </div>
      </div>
    </div>
  );
}