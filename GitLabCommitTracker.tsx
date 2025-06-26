import React, { useState, useEffect } from 'react';
import axios from 'axios';

type Commit = {
  id: string;
  title: string;
  author_name: string;
  created_at: string;
  web_url: string;
};

type GitLabCommitTrackerProps = {
  projectId: string;
  accessToken: string;
  branch?: string;
};

export const GitLabCommitTracker: React.FC<GitLabCommitTrackerProps> = ({
  projectId,
  accessToken,
  branch = 'main',
}) => {
  const [commits, setCommits] = useState<Commit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCommits = async () => {
      try {
        const response = await axios.get(
          `https://gitlab.com/api/v4/projects/${projectId}/repository/commits`,
          {
            params: {
              ref_name: branch,
              per_page: 20,
            },
            headers: {
              'PRIVATE-TOKEN': accessToken,
            },
          }
        );
        setCommits(response.data);
      } catch (err) {
        setError('Failed to fetch commits from GitLab');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCommits();
  }, [projectId, accessToken, branch]);

  if (loading) return <div>Loading commits...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="border rounded-lg p-4">
      <h2 className="text-xl font-bold mb-4">Recent Commits</h2>
      <ul className="space-y-2">
        {commits.map((commit) => (
          <li key={commit.id} className="border-b pb-2">
            <a
              href={commit.web_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {commit.title}
            </a>
            <div className="text-sm text-gray-500">
              {commit.author_name} • {new Date(commit.created_at).toLocaleString()}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};