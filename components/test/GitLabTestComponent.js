'use client';

import { useState } from 'react';

export function GitLabTestComponent() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    token: '',
    repos: ''
  });
  const [status, setStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Testing connection...');
    
    try {
      const response = await fetch('/api/gitlab/connect-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalAccessToken: formData.token,
          gitlabUsername: formData.username,
          repositories: formData.repos
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setStatus(`✅ Success: Connected as @${data.integration?.username}`);
      } else {
        const errorData = await response.json();
        setStatus(`❌ Error: ${errorData.error}`);
      }
    } catch (error) {
      setStatus(`❌ Error: ${error.message}`);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">GitLab Integration Test</h2>
      
      <div className="mb-4 p-3 bg-gray-50 rounded">
        <p><strong>Debug Info:</strong></p>
        <p>showForm: {showForm.toString()}</p>
        <p>formData: {JSON.stringify(formData)}</p>
      </div>

      {!showForm ? (
        <div className="text-center">
          <p className="mb-4">Click the button below to test GitLab connection form:</p>
          <button
            onClick={() => {
              console.log('Test button clicked');
              setShowForm(true);
            }}
            className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors font-medium"
          >
            🦊 Test GitLab Connection
          </button>
        </div>
      ) : (
        <div>
          <h3 className="text-lg font-semibold mb-4">GitLab Connection Form</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GitLab Username
              </label>
              <input
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="your-gitlab-username"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Personal Access Token
              </label>
              <input
                type="password"
                required
                value={formData.token}
                onChange={(e) => setFormData({...formData, token: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="glpat-xxxxxxxxxxxxxxxxxxxx"
              />
              <p className="text-xs text-gray-500 mt-1">
                Create at GitLab → Settings → Access Tokens with 'read_api' and 'read_repository' scopes
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Repository Names (Optional)
              </label>
              <input
                type="text"
                value={formData.repos}
                onChange={(e) => setFormData({...formData, repos: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="repo1, repo2, repo3 (leave empty for all repos)"
              />
            </div>
            
            {status && (
              <div className={`p-3 rounded ${
                status.includes('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {status}
              </div>
            )}
            
            <div className="flex space-x-3">
              <button
                type="submit"
                className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 transition-colors"
              >
                Test Connection
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}