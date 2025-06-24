'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export function GitLabDiagnostic() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const [diagnostics, setDiagnostics] = useState({});
  const [testResults, setTestResults] = useState([]);
  const [timestamp, setTimestamp] = useState('');
  const [localTime, setLocalTime] = useState('');

  useEffect(() => {
    runDiagnostics();
    // Set timestamps only on client side to avoid hydration mismatch
    setTimestamp(new Date().toISOString());
    setLocalTime(new Date().toLocaleString());
  }, []);

  const addTestResult = (test, status, message) => {
    setTestResults(prev => [...prev, { test, status, message, timestamp: new Date() }]);
  };

  const runDiagnostics = async () => {
    const results = {};
    
    // Test 1: User Authentication
    try {
      results.userAuth = {
        status: user ? 'PASS' : 'FAIL',
        data: user ? { id: user.id, name: user.name, email: user.email } : null,
        message: user ? 'User is authenticated' : 'User not authenticated'
      };
      addTestResult('User Authentication', user ? 'PASS' : 'FAIL', results.userAuth.message);
    } catch (error) {
      results.userAuth = { status: 'ERROR', message: error.message };
      addTestResult('User Authentication', 'ERROR', error.message);
    }

    // Test 2: API Endpoints Accessibility
    try {
      const response = await fetch('/api/gitlab/connection-status');
      results.apiAccess = {
        status: response.status === 401 ? 'PASS' : response.ok ? 'PASS' : 'FAIL',
        statusCode: response.status,
        message: `API endpoint accessible (${response.status})`
      };
      addTestResult('API Access', results.apiAccess.status, results.apiAccess.message);
    } catch (error) {
      results.apiAccess = { status: 'ERROR', message: error.message };
      addTestResult('API Access', 'ERROR', error.message);
    }

    // Test 3: Environment Variables
    const envTest = {
      status: 'INFO',
      message: 'Environment check (client-side limited)'
    };
    results.environment = envTest;
    addTestResult('Environment', 'INFO', envTest.message);

    // Test 4: Local Storage / Session
    try {
      localStorage.setItem('gitlab-test', 'test');
      const testValue = localStorage.getItem('gitlab-test');
      localStorage.removeItem('gitlab-test');
      results.localStorage = {
        status: testValue === 'test' ? 'PASS' : 'FAIL',
        message: testValue === 'test' ? 'Local storage working' : 'Local storage not working'
      };
      addTestResult('Local Storage', results.localStorage.status, results.localStorage.message);
    } catch (error) {
      results.localStorage = { status: 'ERROR', message: error.message };
      addTestResult('Local Storage', 'ERROR', error.message);
    }

    setDiagnostics(results);
  };

  const testButtonClick = () => {
    addTestResult('Button Click', 'PASS', 'Button click handler working');
    alert('Button click test successful!');
  };

  const testStateUpdate = () => {
    const [testState, setTestState] = useState(false);
    setTestState(true);
    addTestResult('State Update', 'PASS', `State update test: ${testState}`);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">GitLab Integration Diagnostics</h2>
      
      {/* System Information */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">System Information</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>User Agent:</strong><br />
            <code className="text-xs">{navigator.userAgent}</code>
          </div>
          <div>
            <strong>Current URL:</strong><br />
            <code className="text-xs">{window.location.href}</code>
          </div>
          <div>
            <strong>Timestamp:</strong><br />
            {timestamp}
          </div>
          <div>
            <strong>Local Time:</strong><br />
            {localTime}
          </div>
        </div>
      </div>

      {/* Diagnostic Results */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Diagnostic Results</h3>
        <div className="space-y-3">
          {Object.entries(diagnostics).map(([key, result]) => (
            <div key={key} className={`p-3 rounded-lg border ${
              result.status === 'PASS' ? 'bg-green-50 border-green-200' :
              result.status === 'FAIL' ? 'bg-red-50 border-red-200' :
              result.status === 'ERROR' ? 'bg-red-50 border-red-200' :
              'bg-blue-50 border-blue-200'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-medium">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  result.status === 'PASS' ? 'bg-green-100 text-green-800' :
                  result.status === 'FAIL' ? 'bg-red-100 text-red-800' :
                  result.status === 'ERROR' ? 'bg-red-100 text-red-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {result.status}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">{result.message}</p>
              {result.data && (
                <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-x-auto">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Tests */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Interactive Tests</h3>
        <div className="flex space-x-4">
          <button
            onClick={testButtonClick}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Test Button Click
          </button>
          <button
            onClick={() => window.location.reload()}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            Reload Page
          </button>
          <button
            onClick={runDiagnostics}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Re-run Diagnostics
          </button>
        </div>
      </div>

      {/* Test Results Log */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Test Results Log</h3>
        <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
          {testResults.length === 0 ? (
            <p className="text-gray-500 text-sm">No test results yet...</p>
          ) : (
            <div className="space-y-2">
              {testResults.map((result, index) => (
                <div key={index} className="text-sm">
                  <span className="text-gray-500">{result.timestamp.toLocaleTimeString()}</span>
                  <span className={`ml-2 px-2 py-1 rounded text-xs ${
                    result.status === 'PASS' ? 'bg-green-100 text-green-800' :
                    result.status === 'FAIL' ? 'bg-red-100 text-red-800' :
                    result.status === 'ERROR' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {result.status}
                  </span>
                  <span className="ml-2 font-medium">{result.test}</span>
                  <span className="ml-2 text-gray-600">{result.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h4 className="font-semibold text-yellow-800 mb-2">Next Steps:</h4>
        <ol className="list-decimal list-inside text-sm text-yellow-700 space-y-1">
          <li>Review the diagnostic results above</li>
          <li>Check for any FAIL or ERROR statuses</li>
          <li>Test the interactive buttons to verify functionality</li>
          <li>If all tests pass, the issue may be specific to the GitLab tab context</li>
          <li>Try the standalone GitLab test at <code>/test-gitlab</code></li>
        </ol>
      </div>
    </div>
  );
}