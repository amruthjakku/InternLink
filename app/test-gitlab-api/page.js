'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function TestGitLabAPI() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [testType, setTestType] = useState('connection');
  const [apiBase, setApiBase] = useState('');
  const [customApiBase, setCustomApiBase] = useState('');

  useEffect(() => {
    // Get API base from localStorage if available
    const savedApiBase = localStorage.getItem('gitlabApiBase');
    if (savedApiBase) {
      setCustomApiBase(savedApiBase);
    }
  }, []);

  const updateApiBase = async () => {
    if (!customApiBase || customApiBase.trim() === '') {
      setError('Please enter a valid API base URL');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/gitlab/update-api-base', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ apiBase: customApiBase })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResults({
          success: true,
          message: 'API base URL updated successfully',
          apiBase: customApiBase
        });
        // Save to localStorage for future use
        localStorage.setItem('gitlabApiBase', customApiBase);
      } else {
        setError(data.error || 'Failed to update API base URL');
        setResults(data);
      }
    } catch (error) {
      console.error('Update error:', error);
      setError(`Failed to update API base URL: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const runTest = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      let endpoint = '/api/gitlab/test-api';
      
      if (testType === 'sync') {
        endpoint = '/api/gitlab/simple-sync';
      } else if (testType === 'diagnostic') {
        endpoint = '/api/gitlab/diagnostic';
      } else if (testType === 'sync-v2') {
        endpoint = '/api/gitlab/sync-v2';
      }
      
      const response = await fetch(endpoint, {
        method: testType === 'connection' ? 'GET' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        setResults(data);
      } else {
        setError(data.error || 'Test failed');
        setResults(data);
      }
    } catch (error) {
      console.error('Test error:', error);
      setError(`Test failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">GitLab API Test</h1>
        <p>Please sign in to use this tool.</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">GitLab API Test Tool</h1>
      
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Test Configuration</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Test Type</label>
          <div className="flex space-x-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio"
                name="testType"
                value="connection"
                checked={testType === 'connection'}
                onChange={() => setTestType('connection')}
              />
              <span className="ml-2">Connection Test</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio"
                name="testType"
                value="diagnostic"
                checked={testType === 'diagnostic'}
                onChange={() => setTestType('diagnostic')}
              />
              <span className="ml-2">Full Diagnostic</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio"
                name="testType"
                value="sync"
                checked={testType === 'sync'}
                onChange={() => setTestType('sync')}
              />
              <span className="ml-2">Simple Sync</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio"
                name="testType"
                value="sync-v2"
                checked={testType === 'sync-v2'}
                onChange={() => setTestType('sync-v2')}
              />
              <span className="ml-2">Sync V2</span>
            </label>
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Custom API Base URL</label>
          <div className="flex">
            <input
              type="text"
              className="flex-1 p-2 border rounded-l"
              placeholder="e.g., https://code.swecha.org/api/v4"
              value={customApiBase}
              onChange={(e) => setCustomApiBase(e.target.value)}
            />
            <button
              onClick={updateApiBase}
              disabled={loading}
              className={`px-4 py-2 rounded-r font-medium ${
                loading
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              Update API Base
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Set this to match your GitLab instance API URL. For Swecha GitLab, use: https://code.swecha.org/api/v4
          </p>
        </div>
        
        <button
          onClick={runTest}
          disabled={loading}
          className={`px-4 py-2 rounded font-medium ${
            loading
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          {loading ? 'Running Test...' : 'Run Test'}
        </button>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          <h3 className="font-bold">Error</h3>
          <p>{error}</p>
          {results && results.details && (
            <pre className="mt-2 text-xs overflow-auto max-h-40 bg-red-100 p-2 rounded">
              {JSON.stringify(results.details, null, 2)}
            </pre>
          )}
        </div>
      )}
      
      {results && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          
          <div className="overflow-auto max-h-96">
            <pre className="text-xs bg-gray-100 p-4 rounded">
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}