import { useEffect, useState } from 'react';

export function GitLabCommitTracker() {
  const [commits, setCommits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCommits = async () => {
      try {
        // Simulate GitLab API call with mock data for now
        // In production, you would make an API call to your backend
        // which would then call GitLab API using server-side credentials
        
        setTimeout(() => {
          const mockCommits = [
            {
              id: '1a2b3c4d',
              title: 'Add user authentication feature',
              author_name: 'John Doe',
              created_at: '2024-01-15T10:30:00Z',
              message: 'Implemented OAuth login with GitLab'
            },
            {
              id: '2b3c4d5e',
              title: 'Fix dashboard layout issues',
              author_name: 'Jane Smith',
              created_at: '2024-01-14T15:45:00Z',
              message: 'Resolved responsive design problems'
            },
            {
              id: '3c4d5e6f',
              title: 'Update task management system',
              author_name: 'Mike Johnson',
              created_at: '2024-01-13T09:20:00Z',
              message: 'Added task priority and due date features'
            },
            {
              id: '4d5e6f7g',
              title: 'Implement real-time chat',
              author_name: 'Sarah Wilson',
              created_at: '2024-01-12T14:10:00Z',
              message: 'Added WebSocket support for live messaging'
            }
          ];
          
          setCommits(mockCommits);
          setLoading(false);
        }, 1500);
        
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchCommits();
  }, []);

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

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">GitLab Commit Tracker</h2>
      <div className="space-y-4">
        {commits.length === 0 ? (
          <p className="text-gray-500">No commits found.</p>
        ) : (
          commits.map((commit) => (
            <div key={commit.id} className="border-b pb-3 last:border-b-0">
              <p className="font-medium text-gray-900">{commit.title}</p>
              <p className="text-sm text-gray-600 mt-1">{commit.message}</p>
              <p className="text-xs text-gray-500 mt-2">
                {commit.author_name} - {new Date(commit.created_at).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}