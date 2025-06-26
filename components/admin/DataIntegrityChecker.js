'use client';

import { useState } from 'react';

export function DataIntegrityChecker() {
  const [checking, setChecking] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [results, setResults] = useState(null);
  const [syncResults, setSyncResults] = useState(null);
  const [error, setError] = useState('');

  const checkIntegrity = async () => {
    setChecking(true);
    setError('');
    setResults(null);

    try {
      const response = await fetch('/api/admin/sync-user-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'validate_data_integrity' })
      });

      const result = await response.json();

      if (response.ok) {
        setResults(result.result);
      } else {
        setError(result.error || 'Integrity check failed');
      }
    } catch (error) {
      console.error('Integrity check error:', error);
      setError(`Integrity check failed: ${error.message}`);
    } finally {
      setChecking(false);
    }
  };

  const performFullSync = async () => {
    setSyncing(true);
    setError('');
    setSyncResults(null);

    try {
      const response = await fetch('/api/admin/sync-user-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'full_sync' })
      });

      const result = await response.json();

      if (response.ok) {
        setSyncResults(result.result);
        // Re-check integrity after sync
        setTimeout(() => {
          checkIntegrity();
        }, 2000);
      } else {
        setError(result.error || 'Full sync failed');
      }
    } catch (error) {
      console.error('Full sync error:', error);
      setError(`Full sync failed: ${error.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const fixInactiveUsers = async () => {
    setSyncing(true);
    setError('');

    try {
      const response = await fetch('/api/admin/sync-user-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'fix_inactive_users' })
      });

      const result = await response.json();

      if (response.ok) {
        setSyncResults(result.result);
        setTimeout(() => {
          checkIntegrity();
        }, 1000);
      } else {
        setError(result.error || 'Fix inactive users failed');
      }
    } catch (error) {
      console.error('Fix inactive users error:', error);
      setError(`Fix inactive users failed: ${error.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const syncCohortAssignments = async () => {
    setSyncing(true);
    setError('');

    try {
      const response = await fetch('/api/admin/sync-user-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync_cohort_assignments' })
      });

      const result = await response.json();

      if (response.ok) {
        setSyncResults(result.result);
        setTimeout(() => {
          checkIntegrity();
        }, 1000);
      } else {
        setError(result.error || 'Sync cohort assignments failed');
      }
    } catch (error) {
      console.error('Sync cohort assignments error:', error);
      setError(`Sync cohort assignments failed: ${error.message}`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Data Integrity Checker</h2>
        <p className="text-gray-600 mb-6">
          Check and fix data consistency issues between users, cohorts, and assignments.
        </p>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <button
            onClick={checkIntegrity}
            disabled={checking}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {checking ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Checking...
              </div>
            ) : (
              'Check Integrity'
            )}
          </button>

          <button
            onClick={performFullSync}
            disabled={syncing}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {syncing ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Syncing...
              </div>
            ) : (
              'Full Sync'
            )}
          </button>

          <button
            onClick={fixInactiveUsers}
            disabled={syncing}
            className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Fix Inactive Users
          </button>

          <button
            onClick={syncCohortAssignments}
            disabled={syncing}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Sync Cohorts
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Sync Results */}
        {syncResults && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
            <h3 className="text-lg font-medium text-green-900 mb-3">Sync Results</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-green-800">Users Processed:</span>
                <span className="ml-2 text-green-700">{syncResults.usersProcessed || 0}</span>
              </div>
              <div>
                <span className="font-medium text-green-800">Cohorts Updated:</span>
                <span className="ml-2 text-green-700">{syncResults.cohortsUpdated || 0}</span>
              </div>
              <div>
                <span className="font-medium text-green-800">Issues Fixed:</span>
                <span className="ml-2 text-green-700">{syncResults.inconsistenciesFixed || syncResults.usersFixed || 0}</span>
              </div>
            </div>
            
            {syncResults.errors && syncResults.errors.length > 0 && (
              <div className="mt-3">
                <p className="font-medium text-red-800">Errors:</p>
                <ul className="mt-1 text-sm text-red-700">
                  {syncResults.errors.slice(0, 5).map((error, index) => (
                    <li key={index} className="truncate">{error}</li>
                  ))}
                  {syncResults.errors.length > 5 && (
                    <li className="text-gray-600">... and {syncResults.errors.length - 5} more</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Integrity Results */}
        {results && (
          <div className={`border rounded-md p-4 ${
            results.valid 
              ? 'bg-green-50 border-green-200' 
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="flex items-center mb-3">
              {results.valid ? (
                <svg className="h-5 w-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
              <h3 className={`text-lg font-medium ${
                results.valid ? 'text-green-900' : 'text-yellow-900'
              }`}>
                {results.valid ? 'Data Integrity: VALID' : 'Data Integrity: ISSUES FOUND'}
              </h3>
            </div>

            <p className={`text-sm mb-4 ${
              results.valid ? 'text-green-700' : 'text-yellow-700'
            }`}>
              {results.summary}
            </p>

            {!results.valid && results.issues && results.issues.length > 0 && (
              <div className="space-y-4">
                {results.issues.map((issue, index) => (
                  <div key={index} className="bg-white rounded-md p-4 border border-yellow-300">
                    <h4 className="font-medium text-yellow-900 mb-2">
                      {issue.type.replace(/_/g, ' ').toUpperCase()} ({issue.count} items)
                    </h4>
                    
                    {issue.type === 'invalid_cohort_references' && issue.users && (
                      <div>
                        <p className="text-sm text-yellow-700 mb-2">Users with invalid cohort references:</p>
                        <div className="max-h-32 overflow-y-auto">
                          {issue.users.slice(0, 10).map((user, userIndex) => (
                            <div key={userIndex} className="text-xs text-yellow-600 font-mono">
                              {user.gitlabUsername} ({user.name}) → Cohort: {user.cohortId}
                            </div>
                          ))}
                          {issue.users.length > 10 && (
                            <div className="text-xs text-yellow-600">
                              ... and {issue.users.length - 10} more
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {issue.type === 'incorrect_member_counts' && issue.cohorts && (
                      <div>
                        <p className="text-sm text-yellow-700 mb-2">Cohorts with incorrect member counts:</p>
                        <div className="max-h-32 overflow-y-auto">
                          {issue.cohorts.slice(0, 10).map((cohort, cohortIndex) => (
                            <div key={cohortIndex} className="text-xs text-yellow-600 font-mono">
                              {cohort.name}: Recorded {cohort.memberCount} → Actual {cohort.actualCount}
                            </div>
                          ))}
                          {issue.cohorts.length > 10 && (
                            <div className="text-xs text-yellow-600">
                              ... and {issue.cohorts.length - 10} more
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}