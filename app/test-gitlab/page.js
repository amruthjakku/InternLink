'use client';

import { SimpleGitLabTab } from '../../components/intern/SimpleGitLabTab';
import { AuthProvider } from '../../components/AuthProvider';

export default function TestGitLabPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">Simple GitLab Integration Test</h1>
        <AuthProvider>
          <SimpleGitLabTab />
        </AuthProvider>
      </div>
    </div>
  );
}