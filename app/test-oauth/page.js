'use client';

import { useEffect, useState } from 'react';

export default function TestOAuth() {
  const [config, setConfig] = useState(null);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    // Fetch debug info
    fetch('/api/auth/debug')
      .then(res => res.json())
      .then(data => setConfig(data))
      .catch(err => console.error('Error:', err));
  }, []);

  const testOAuthEndpoint = async () => {
    try {
      const response = await fetch('https://code.swecha.org/oauth/authorize?client_id=d43453fb6c1a46dc611d0a3d83c501771cbbf16abcaf3721805d14abf05ae859&redirect_uri=http://localhost:3000/api/auth/callback/gitlab&response_type=code&scope=read_user+api+read_repository', {
        method: 'HEAD',
        mode: 'no-cors'
      });
      setTestResult('OAuth endpoint is accessible');
    } catch (error) {
      setTestResult(`OAuth endpoint error: ${error.message}`);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">OAuth Configuration Test</h1>
      
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-3">Current Configuration:</h2>
        {config ? (
          <pre className="text-sm">{JSON.stringify(config, null, 2)}</pre>
        ) : (
          <p>Loading...</p>
        )}
      </div>

      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-3">Expected GitLab OAuth Settings:</h2>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li><strong>Application Name:</strong> AI Developer InternLink</li>
          <li><strong>Redirect URI:</strong> http://localhost:3000/api/auth/callback/gitlab</li>
          <li><strong>Client ID:</strong> d43453fb6c1a46dc611d0a3d83c501771cbbf16abcaf3721805d14abf05ae859</li>
          <li><strong>Scopes:</strong> read_user, api, read_repository</li>
          <li><strong>Confidential:</strong> Yes</li>
        </ul>
      </div>

      <div className="bg-yellow-50 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-3">Steps to Fix:</h2>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>Go to <a href="https://code.swecha.org" target="_blank" className="text-blue-600 underline">https://code.swecha.org</a></li>
          <li>Sign in and go to User Settings → Applications</li>
          <li>Look for an application with Client ID: d43453fb6c1a46dc611d0a3d83c501771cbbf16abcaf3721805d14abf05ae859</li>
          <li>If it doesn't exist, create a new application with the settings above</li>
          <li>If it exists, verify the Redirect URI matches exactly</li>
          <li>Make sure the application is not revoked or disabled</li>
        </ol>
      </div>

      <button 
        onClick={testOAuthEndpoint}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Test OAuth Endpoint
      </button>
      
      {testResult && (
        <div className="mt-4 p-3 bg-gray-100 rounded">
          <strong>Test Result:</strong> {testResult}
        </div>
      )}

      <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-lg">
        <h3 className="font-semibold text-red-800 mb-2">Common Issues:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
          <li>OAuth application doesn't exist on GitLab</li>
          <li>Client ID or Client Secret is incorrect</li>
          <li>Redirect URI doesn't match exactly (including http vs https)</li>
          <li>Application is disabled or revoked</li>
          <li>Insufficient scopes selected</li>
        </ul>
      </div>
    </div>
  );
}