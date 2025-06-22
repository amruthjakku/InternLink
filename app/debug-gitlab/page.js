'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { GitLabDebugger } from '../../components/test/GitLabDebugger';

export default function DebugGitLabPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/');
      return;
    }

    // Allow access for all authenticated users for debugging
    setLoading(false);
  }, [session, status, router]);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">GitLab Integration Debug</h1>
          <p className="text-gray-600 mt-2">
            Debug and troubleshoot GitLab integration issues. User: {session.user.name} ({session.user.role})
          </p>
        </div>
        
        <GitLabDebugger />
        
        <div className="mt-8 text-center">
          <button
            onClick={() => router.back()}
            className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}