'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';

export function ClearGitLabTokens() {
  const [clearing, setClearing] = useState(false);
  const [result, setResult] = useState(null);

  const handleClearTokens = async () => {
    if (!confirm('This will clear your GitLab OAuth tokens and you will need to sign out and sign in again. Continue?')) {
      return;
    }

    setClearing(true);
    setResult(null);

    try {
      const response = await fetch('/api/auth/clear-gitlab-tokens', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setResult({ success: true, message: data.message });
        
        // Automatically sign out after 3 seconds
        setTimeout(() => {
          signOut({ callbackUrl: '/auth/signin' });
        }, 3000);
      } else {
        const errorData = await response.json();
        setResult({ success: false, message: errorData.error || 'Failed to clear tokens' });
      }
    } catch (error) {
      setResult({ success: false, message: `Error: ${error.message}` });
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <h4 className="font-semibold text-yellow-900 mb-2">🔧 OAuth Token Issues?</h4>
      <p className="text-yellow-800 text-sm mb-4">
        If you're experiencing OAuth token refresh errors, you can clear your GitLab tokens and re-authenticate.
      </p>
      
      {result && (
        <div className={`mb-4 p-3 rounded ${
          result.success 
            ? 'bg-green-50 border border-green-200 text-green-700' 
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {result.message}
          {result.success && (
            <div className="mt-2 text-sm">
              You will be signed out automatically in a few seconds...
            </div>
          )}
        </div>
      )}
      
      <button
        onClick={handleClearTokens}
        disabled={clearing}
        className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 disabled:opacity-50 transition-colors text-sm"
      >
        {clearing ? 'Clearing...' : 'Clear GitLab Tokens'}
      </button>
    </div>
  );
}