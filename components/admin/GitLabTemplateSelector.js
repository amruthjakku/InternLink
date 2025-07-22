'use client';

import { useState, useEffect } from 'react';

/**
 * GitLab Template Selector Component
 * Allows admins to search and select GitLab repositories as templates for tasks
 */
export function GitLabTemplateSelector({ value, onChange, disabled }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [repositories, setRepositories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRepo, setSelectedRepo] = useState(value || null);
  const [showResults, setShowResults] = useState(false);

  // Load repositories on mount if admin has GitLab connected
  useEffect(() => {
    checkGitLabConnection();
  }, []);

  // Set selected repo from value prop
  useEffect(() => {
    if (value && value.projectId) {
      setSelectedRepo(value);
    }
  }, [value]);

  const checkGitLabConnection = async () => {
    try {
      const response = await fetch('/api/gitlab/connection-status');
      if (response.ok) {
        const data = await response.json();
        if (data.connected) {
          fetchRepositories();
        }
      }
    } catch (error) {
      console.error('Error checking GitLab connection:', error);
    }
  };

  const fetchRepositories = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/gitlab/repositories');
      if (response.ok) {
        const data = await response.json();
        setRepositories(data.repositories || []);
      } else {
        setError('Failed to fetch repositories');
      }
    } catch (error) {
      setError('Error fetching repositories');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setShowResults(true);
  };

  const handleSelectRepo = (repo) => {
    const templateRepo = {
      url: repo.url,
      projectId: repo.id,
      description: repo.description || '',
      addedAt: new Date()
    };
    
    setSelectedRepo(templateRepo);
    setShowResults(false);
    
    if (onChange) {
      onChange(templateRepo);
    }
  };

  const handleRemoveRepo = () => {
    setSelectedRepo(null);
    
    if (onChange) {
      onChange(null);
    }
  };

  // Filter repositories based on search query
  const filteredRepos = repositories.filter(repo => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      repo.name.toLowerCase().includes(query) ||
      repo.fullName.toLowerCase().includes(query) ||
      (repo.description && repo.description.toLowerCase().includes(query))
    );
  });

  if (disabled) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <p className="text-gray-500 text-sm">
          GitLab template selection is disabled. Save the task first to enable this feature.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">GitLab Template Repository</h3>
        {loading && <span className="text-xs text-blue-600">Loading...</span>}
      </div>
      
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
          {error}
        </div>
      )}
      
      {/* Selected Repository */}
      {selectedRepo && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-medium text-blue-800">{selectedRepo.url.split('/').pop()}</h4>
              <p className="text-sm text-blue-600 mt-1">{selectedRepo.url}</p>
              {selectedRepo.description && (
                <p className="text-xs text-blue-700 mt-2">{selectedRepo.description}</p>
              )}
            </div>
            <button
              onClick={handleRemoveRepo}
              className="text-blue-600 hover:text-blue-800"
              title="Remove template"
            >
              ×
            </button>
          </div>
        </div>
      )}
      
      {/* Repository Search */}
      {!selectedRepo && (
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearch}
            onFocus={() => setShowResults(true)}
            placeholder="Search for a repository..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          {/* Search Results */}
          {showResults && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {filteredRepos.length === 0 ? (
                <div className="p-3 text-sm text-gray-500">
                  {searchQuery.trim() ? 'No repositories found' : 'Type to search repositories'}
                </div>
              ) : (
                <ul>
                  {filteredRepos.map(repo => (
                    <li 
                      key={repo.id}
                      onClick={() => handleSelectRepo(repo)}
                      className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-gray-800">{repo.name}</div>
                      <div className="text-xs text-gray-500 mt-1">{repo.fullName}</div>
                      {repo.description && (
                        <div className="text-xs text-gray-600 mt-1 line-clamp-2">{repo.description}</div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Help Text */}
      <p className="text-xs text-gray-500">
        Select a GitLab repository to use as a template for this task. AI Developer Interns will be able to fork this repository to start working on the task.
      </p>
    </div>
  );
}