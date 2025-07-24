'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';

export default function TestSession() {
  const { data: session, status } = useSession();

  useEffect(() => {
    console.log('Session status:', status);
    console.log('Session data:', session);
  }, [session, status]);

  if (status === 'loading') {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Session Test</h1>
        <p>Loading session...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Session Test</h1>
      
      <div className="bg-gray-100 p-4 rounded mb-4">
        <h2 className="font-semibold mb-2">Session Status:</h2>
        <p className={`px-2 py-1 rounded text-white ${
          status === 'authenticated' ? 'bg-green-500' : 
          status === 'unauthenticated' ? 'bg-red-500' : 'bg-yellow-500'
        }`}>
          {status}
        </p>
      </div>

      {session ? (
        <div className="bg-blue-50 p-4 rounded mb-4">
          <h2 className="font-semibold mb-2">Session Data:</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(session, null, 2)}
          </pre>
        </div>
      ) : (
        <div className="bg-gray-50 p-4 rounded mb-4">
          <p>No session data available</p>
        </div>
      )}

      <div className="space-y-2">
        <a 
          href="/api/auth/signin" 
          className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Sign In
        </a>
        <br />
        <a 
          href="/api/auth/signout" 
          className="inline-block bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Sign Out
        </a>
        <br />
        <a 
          href="/admin/dashboard" 
          className="inline-block bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Admin Dashboard
        </a>
      </div>
    </div>
  );
}