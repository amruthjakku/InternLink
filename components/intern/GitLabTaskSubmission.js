'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../AuthProvider';

/**
 * GitLab Task Submission Component
 * Handles repository matching, manual submission, and template forking
 */
export function GitLabTaskSubmission({ task, onSubmissionComplete }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [repoMatches, setRepoMatches] = useState([]);
  const [strongMatch, setStrongMatch] = useState(null);
  const [manualUrl, setManualUrl] = useState('');
  const [submissionMethod, setSubmissionMethod] = useState('auto'); // 'auto', 'manual', 'template'
  const [showManualForm, setShowManualForm] = useState(false);
  const [showMatchDetails, setShowMatchDetails] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState(null);
  const [isGitLabConnected, setIsGitLabConnected] = useState(false);

  // Check if GitLab is connected
  useEffect(() => {
    checkGitLabConnection();
  }, []);

  // Check if task already has a repository
  useEffect(() => {
    if (task?.individualProgress?.repoUrl) {
      setSubmissionStatus({
        success: true,
        message: 'Repository already submitted',
        repoUrl: task.individualProgress.repoUrl,
        method: task.individualProgress.submissionMethod || 'manual',
        verified: task.individualProgress.verified
      });
    }
  }, [task]);

  const checkGitLabConnection = async () => {
    try {
      const response = await fetch('/api/gitlab/connection-status');
      if (response.ok) {
        const data = await response.json();
        setIsGitLabConnected(data.connected);
      }
    } catch (error) {
      console.error('Error checking GitLab connection:', error);
    }
  };

  const findRepositoryMatches = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/tasks/verify-submission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: task.id,
          method: 'auto'
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setRepoMatches(data.matches || []);
        setStrongMatch(data.strongMatch);
        setShowMatchDetails(true);
      } else {
        setError(data.error || 'Failed to find matching repositories');
      }
    } catch (error) {
      setError('Error searching for repositories');
    } finally {
      setLoading(false);
    }
  };

  const confirmRepository = async (repoUrl) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/tasks/verify-submission', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: task.id,
          repoUrl,
          confirm: true
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSubmissionStatus({
          success: true,
          message: 'Repository confirmed successfully',
          repoUrl,
          method: 'auto',
          verified: true
        });
        
        if (onSubmissionComplete) {
          onSubmissionComplete(data.taskProgress);
        }
      } else {
        setError(data.error || 'Failed to confirm repository');
      }
    } catch (error) {
      setError('Error confirming repository');
    } finally {
      setLoading(false);
    }
  };

  const submitManualRepository = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    if (!manualUrl || !manualUrl.includes('gitlab')) {
      setError('Please enter a valid GitLab repository URL');
      setLoading(false);
      return;
    }
    
    try {
      const response = await fetch('/api/tasks/verify-submission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: task.id,
          repoUrl: manualUrl,
          method: 'manual'
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSubmissionStatus({
          success: true,
          message: 'Repository submitted manually',
          repoUrl: manualUrl,
          method: 'manual',
          verified: false
        });
        
        if (onSubmissionComplete) {
          onSubmissionComplete(data.taskProgress);
        }
      } else {
        setError(data.error || 'Failed to submit repository');
      }
    } catch (error) {
      setError('Error submitting repository');
    } finally {
      setLoading(false);
    }
  };

  const createFromTemplate = async () => {
    if (!task.gitlabTemplateRepo?.projectId) {
      setError('No template repository available for this task');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/tasks/verify-submission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: task.id,
          method: 'template'
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSubmissionStatus({
          success: true,
          message: 'Repository created from template',
          repoUrl: data.repository.url,
          method: 'template',
          verified: true
        });
        
        if (onSubmissionComplete) {
          onSubmissionComplete(data.taskProgress);
        }
      } else {
        setError(data.error || 'Failed to create repository from template');
      }
    } catch (error) {
      setError('Error creating repository from template');
    } finally {
      setLoading(false);
    }
  };

  // If GitLab is not connected, show connection prompt
  if (!isGitLabConnected && !submissionStatus) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Submit Task with GitLab</h3>
          <div className="text-sm text-red-600 font-medium">Not Connected</div>
        </div>
        
        <p className="text-gray-600 mb-4">
          Connect your GitLab account to submit this task. GitLab integration allows you to easily submit your work and track your progress.
        </p>
        
        <a 
          href="/intern/dashboard?tab=gitlab" 
          className="inline-block bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
        >
          Connect GitLab Account
        </a>
      </div>
    );
  }

  // If submission is already complete, show status
  if (submissionStatus) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Task Submission</h3>
          <div className="text-sm text-green-600 font-medium">
            {submissionStatus.verified ? 'Verified ✓' : 'Pending Verification'}
          </div>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <div className="flex items-start">
            <div className="text-green-500 text-xl mr-3">✅</div>
            <div>
              <p className="text-green-800 font-medium">{submissionStatus.message}</p>
              <p className="text-green-700 text-sm mt-1">
                Submission method: <span className="font-medium">{submissionStatus.method}</span>
              </p>
            </div>
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Repository URL</label>
          <div className="flex items-center">
            <input
              type="text"
              value={submissionStatus.repoUrl}
              readOnly
              className="flex-1 bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-gray-700"
            />
            <a
              href={submissionStatus.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 bg-blue-100 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-200 transition-colors"
            >
              View
            </a>
          </div>
        </div>
        
        {!submissionStatus.verified && (
          <div className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded-lg">
            Your submission is pending verification by a mentor. You'll be notified when it's approved.
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Submit Task with GitLab</h3>
        <div className="text-sm text-green-600 font-medium">Connected ✓</div>
      </div>
      
      {/* Submission Method Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Submission Method</label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={() => {
              setSubmissionMethod('auto');
              setShowManualForm(false);
              findRepositoryMatches();
            }}
            className={`p-4 rounded-lg border ${
              submissionMethod === 'auto' 
                ? 'border-blue-500 bg-blue-50 text-blue-700' 
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="text-xl mb-2">🔍</div>
            <div className="font-medium">Smart Detection</div>
            <div className="text-xs text-gray-600 mt-1">
              Auto-detect matching repositories
            </div>
          </button>
          
          <button
            onClick={() => {
              setSubmissionMethod('manual');
              setShowManualForm(true);
              setShowMatchDetails(false);
            }}
            className={`p-4 rounded-lg border ${
              submissionMethod === 'manual' 
                ? 'border-blue-500 bg-blue-50 text-blue-700' 
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="text-xl mb-2">🔗</div>
            <div className="font-medium">Manual URL</div>
            <div className="text-xs text-gray-600 mt-1">
              Paste your repository URL
            </div>
          </button>
          
          {task.gitlabTemplateRepo && (
            <button
              onClick={() => {
                setSubmissionMethod('template');
                setShowManualForm(false);
                setShowMatchDetails(false);
              }}
              className={`p-4 rounded-lg border ${
                submissionMethod === 'template' 
                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="text-xl mb-2">📋</div>
              <div className="font-medium">Use Template</div>
              <div className="text-xs text-gray-600 mt-1">
                Create from task template
              </div>
            </button>
          )}
        </div>
      </div>
      
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-start">
            <div className="text-red-500 text-xl mr-3">⚠️</div>
            <div>
              <p className="text-red-800 font-medium">Error</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Loading Indicator */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">
            {submissionMethod === 'auto' ? 'Searching repositories...' : 
             submissionMethod === 'template' ? 'Creating repository...' : 
             'Processing...'}
          </span>
        </div>
      )}
      
      {/* Auto Detection Results */}
      {submissionMethod === 'auto' && showMatchDetails && !loading && (
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-3">Repository Matches</h4>
          
          {repoMatches.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800">No matching repositories found.</p>
              <p className="text-yellow-700 text-sm mt-1">
                Try submitting manually or create a new repository from the template.
              </p>
              <button
                onClick={() => {
                  setSubmissionMethod('manual');
                  setShowManualForm(true);
                  setShowMatchDetails(false);
                }}
                className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Switch to manual submission
              </button>
            </div>
          ) : (
            <>
              {strongMatch && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start">
                    <div className="text-green-500 text-xl mr-3">✨</div>
                    <div className="flex-1">
                      <p className="text-green-800 font-medium">Strong Match Detected!</p>
                      <p className="text-green-700 text-sm mt-1">
                        We found a repository that closely matches this task.
                      </p>
                      <div className="mt-3 bg-white rounded-lg border border-green-200 p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{strongMatch.name}</p>
                            <p className="text-xs text-gray-600 mt-1">{strongMatch.path}</p>
                          </div>
                          <div className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            {Math.round(strongMatch.score)}% match
                          </div>
                        </div>
                        {strongMatch.keywordsFound?.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {strongMatch.keywordsFound.map(keyword => (
                              <span key={keyword} className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                {keyword}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="mt-3 flex space-x-2">
                          <button
                            onClick={() => confirmRepository(strongMatch.url)}
                            className="flex-1 bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors text-sm"
                          >
                            Confirm & Submit
                          </button>
                          <a
                            href={strongMatch.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                          >
                            View Repo
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="space-y-3 mt-4">
                <h5 className="text-sm font-medium text-gray-700">All Matches</h5>
                {repoMatches.map(repo => (
                  <div key={repo.id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{repo.name}</p>
                        <p className="text-xs text-gray-600 mt-1">{repo.path}</p>
                      </div>
                      <div className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {Math.round(repo.score)}% match
                      </div>
                    </div>
                    <div className="mt-2 flex justify-end space-x-2">
                      <button
                        onClick={() => confirmRepository(repo.url)}
                        className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        Submit
                      </button>
                      <a
                        href={repo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                      >
                        View
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
      
      {/* Manual URL Form */}
      {submissionMethod === 'manual' && showManualForm && (
        <form onSubmit={submitManualRepository} className="mb-6">
          <div className="mb-4">
            <label htmlFor="repoUrl" className="block text-sm font-medium text-gray-700 mb-1">
              GitLab Repository URL
            </label>
            <input
              id="repoUrl"
              type="url"
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
              placeholder="https://gitlab.com/username/repository"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the full URL to your GitLab repository
            </p>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Repository'}
          </button>
        </form>
      )}
      
      {/* Template Repository */}
      {submissionMethod === 'template' && (
        <div className="mb-6">
          {task.gitlabTemplateRepo ? (
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Template Repository</h4>
              <p className="text-gray-600 text-sm mb-3">
                Create a new repository from the template provided for this task. This will create a copy of the template in your GitLab account.
              </p>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
                <p className="font-medium">{task.gitlabTemplateRepo.url}</p>
                {task.gitlabTemplateRepo.description && (
                  <p className="text-sm text-gray-600 mt-1">{task.gitlabTemplateRepo.description}</p>
                )}
              </div>
              
              <button
                onClick={createFromTemplate}
                disabled={loading}
                className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Creating Repository...' : 'Create Repository from Template'}
              </button>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800">No template repository available for this task.</p>
              <p className="text-yellow-700 text-sm mt-1">
                Try using smart detection or manual submission instead.
              </p>
              <button
                onClick={() => {
                  setSubmissionMethod('auto');
                  findRepositoryMatches();
                }}
                className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Switch to smart detection
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}