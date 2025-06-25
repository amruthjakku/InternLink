import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export function AttendanceDebugger() {
  const { data: session } = useSession();
  const [debugData, setDebugData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState([]);

  const runDebugCheck = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug/attendance-debug');
      const data = await response.json();
      setDebugData(data);
    } catch (error) {
      setDebugData({
        success: false,
        error: `Network error: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const testCheckin = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug/attendance-debug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testAction: 'test_checkin' })
      });
      const data = await response.json();
      setTestResults(prev => [...prev, {
        timestamp: new Date().toLocaleString(),
        action: 'Test Check-in',
        result: data
      }]);
    } catch (error) {
      setTestResults(prev => [...prev, {
        timestamp: new Date().toLocaleString(),
        action: 'Test Check-in',
        result: { success: false, error: error.message }
      }]);
    } finally {
      setLoading(false);
    }
  };

  const testActualAttendance = async (action) => {
    setLoading(true);
    try {
      const response = await fetch('/api/attendance/checkin-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action,
          location: 'Debug Test Location',
          deviceInfo: { source: 'debug-panel' }
        })
      });
      const data = await response.json();
      setTestResults(prev => [...prev, {
        timestamp: new Date().toLocaleString(),
        action: `Actual ${action}`,
        result: data
      }]);
    } catch (error) {
      setTestResults(prev => [...prev, {
        timestamp: new Date().toLocaleString(),
        action: `Actual ${action}`,
        result: { success: false, error: error.message }
      }]);
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
    setDebugData(null);
  };

  useEffect(() => {
    if (session) {
      runDebugCheck();
    }
  }, [session]);

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">🔧 Attendance System Debugger</h2>
        <div className="flex gap-2">
          <button
            onClick={runDebugCheck}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '⏳' : '🔍'} Debug Check
          </button>
          <button
            onClick={clearResults}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            🗑️ Clear
          </button>
        </div>
      </div>

      {/* Session Status */}
      <div className="bg-white p-4 rounded-lg border">
        <h3 className="font-medium mb-2">🔐 Authentication Status</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Logged In:</span>
            <span className={`ml-2 px-2 py-1 rounded text-xs ${session ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {session ? '✅ Yes' : '❌ No'}
            </span>
          </div>
          {session && (
            <>
              <div>
                <span className="font-medium">Username:</span>
                <span className="ml-2">{session.user?.gitlabUsername || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium">Role:</span>
                <span className="ml-2">{session.user?.role || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium">User ID:</span>
                <span className="ml-2 text-xs">{session.user?.id || 'N/A'}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Debug Results */}
      {debugData && (
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="font-medium mb-2">🔍 System Diagnostics</h3>
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-medium">Database:</span>
                <span className={`ml-2 px-2 py-1 rounded text-xs ${debugData.debug?.databaseCheck?.connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {debugData.debug?.databaseCheck?.connected ? '✅ Connected' : '❌ Failed'}
                </span>
              </div>
              <div>
                <span className="font-medium">Environment:</span>
                <span className="ml-2">{debugData.debug?.databaseCheck?.nodeEnv || 'Unknown'}</span>
              </div>
              <div>
                <span className="font-medium">Attendance Records:</span>
                <span className="ml-2">{debugData.debug?.databaseCheck?.attendanceRecords || 0}</span>
              </div>
              <div>
                <span className="font-medium">Today's Records:</span>
                <span className="ml-2">{debugData.debug?.todayAttendance?.recordsFound || 0}</span>
              </div>
            </div>

            {debugData.debug?.todayAttendance?.records?.length > 0 && (
              <div>
                <h4 className="font-medium mb-1">Today's Attendance:</h4>
                <div className="bg-gray-50 p-2 rounded">
                  {debugData.debug.todayAttendance.records.map((record, index) => (
                    <div key={index} className="flex justify-between text-xs">
                      <span>{record.action}</span>
                      <span>{new Date(record.timestamp).toLocaleTimeString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Test Controls */}
      {session && (
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="font-medium mb-3">🧪 Test Attendance Functions</h3>
          <div className="flex flex-wrap gap-3 mb-4">
            <button
              onClick={testCheckin}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? '⏳' : '🧪'} Test Database Write
            </button>
            <button
              onClick={() => testActualAttendance('checkin')}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '⏳' : '📥'} Test Real Check-in
            </button>
            <button
              onClick={() => testActualAttendance('checkout')}
              disabled={loading}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? '⏳' : '📤'} Test Real Check-out
            </button>
          </div>

          {/* Test Results */}
          {testResults.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">📋 Test Results:</h4>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {testResults.map((result, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded text-sm">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium">{result.action}</span>
                      <span className="text-xs text-gray-500">{result.timestamp}</span>
                    </div>
                    <div className={`p-2 rounded text-xs ${result.result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {result.result.success ? (
                        <div>
                          <div>✅ {result.result.message || 'Success'}</div>
                          {result.result.attendanceId && <div>ID: {result.result.attendanceId}</div>}
                        </div>
                      ) : (
                        <div>❌ {result.result.error || 'Failed'}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Fix Guide */}
      <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
        <h3 className="font-medium text-blue-900 mb-2">💡 Quick Fix Guide</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <p><strong>If you see "Failed to process attendance":</strong></p>
          <ol className="list-decimal list-inside ml-4 space-y-1">
            <li><strong>Not Logged In:</strong> Go to <code>http://localhost:3000</code> and login first</li>
            <li><strong>Session Expired:</strong> Refresh page and login again</li>
            <li><strong>Database Issues:</strong> Check MongoDB connection</li>
            <li><strong>IP Restrictions:</strong> Development mode should bypass IP checks</li>
            <li><strong>Missing Fields:</strong> Ensure user has all required profile data</li>
          </ol>
        </div>
      </div>
    </div>
  );
}