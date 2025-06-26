import { useEffect, useState } from 'react';

export function GitLabCommitTracker({ gitlabData }) {
  const [commits, setCommits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (gitlabData?.recentCommits) {
      setCommits(gitlabData.recentCommits);
    }
  }, [gitlabData]);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">GitLab Commit Tracker</h2>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border-b pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">GitLab Commit Tracker</h2>
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCommitIcon = (message) => {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('fix') || lowerMessage.includes('bug')) return '🐛';
    if (lowerMessage.includes('feat') || lowerMessage.includes('add')) return '✨';
    if (lowerMessage.includes('update') || lowerMessage.includes('improve')) return '⚡';
    if (lowerMessage.includes('refactor')) return '♻️';
    if (lowerMessage.includes('docs')) return '📚';
    if (lowerMessage.includes('test')) return '🧪';
    return '💾';
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Recent Commits</h2>
        <span className="text-sm text-gray-500">{commits.length} commits</span>
      </div>
      <div className="space-y-4">
        {commits.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">💾</div>
            <p>No recent commits found</p>
            <p className="text-sm mt-1">Start coding to see your commit activity here!</p>
          </div>
        ) : (
          commits.map((commit) => (
            <div key={commit.id} className="border-l-4 border-blue-500 pl-4 py-2 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-lg">{getCommitIcon(commit.title)}</span>
                    <p className="font-medium text-gray-900 truncate">{commit.title}</p>
                  </div>
                  {commit.message && commit.message !== commit.title && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{commit.message}</p>
                  )}
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    <span>👤 {commit.author_name}</span>
                    <span>📅 {formatDate(commit.created_at)}</span>
                    {commit.project && <span>📁 {commit.project}</span>}
                    {commit.stats && (
                      <span className="flex items-center space-x-1">
                        <span className="text-green-600">+{commit.stats.additions || 0}</span>
                        <span className="text-red-600">-{commit.stats.deletions || 0}</span>
                      </span>
                    )}
                  </div>
                </div>
                {commit.web_url && (
                  <a
                    href={commit.web_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-4 text-blue-600 hover:text-blue-800 text-sm"
                  >
                    View →
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}