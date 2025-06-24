'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';

export default function SessionRefresh() {
  const { data: session, update } = useSession();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefreshSession = async () => {
    try {
      setRefreshing(true);
      
      // Force update the session
      const updatedSession = await update();
      
      if (updatedSession) {
        alert('Session refreshed successfully! Your latest role and permissions are now active.');
        // Optionally reload the page to apply new permissions
        window.location.reload();
      } else {
        alert('Session refresh failed. Please try signing out and back in.');
      }
    } catch (error) {
      console.error('Session refresh error:', error);
      alert('Session refresh failed. Please try signing out and back in.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleSignOutAndIn = () => {
    if (confirm('This will sign you out and you\'ll need to sign back in. Continue?')) {
      signOut({ callbackUrl: '/' });
    }
  };

  if (!session) {
    return null;
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-yellow-800">
            Having access issues?
          </h3>
          <p className="text-xs text-yellow-700 mt-1">
            If your role was recently changed, try refreshing your session.
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleRefreshSession}
            disabled={refreshing}
            className="px-3 py-1 bg-yellow-600 text-white rounded text-xs hover:bg-yellow-700 disabled:opacity-50"
          >
            {refreshing ? '⏳ Refreshing...' : '🔄 Refresh Session'}
          </button>
          <button
            onClick={handleSignOutAndIn}
            className="px-3 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700"
          >
            🚪 Sign Out & In
          </button>
        </div>
      </div>
    </div>
  );
}