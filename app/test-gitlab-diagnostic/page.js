'use client';

import { SessionProvider } from 'next-auth/react';
import { GitLabDiagnostic } from '../../components/test/GitLabDiagnostic';

export default function TestGitLabDiagnosticPage() {
  return (
    <SessionProvider>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-center mb-8">GitLab Integration Diagnostic</h1>
          <GitLabDiagnostic />
        </div>
      </div>
    </SessionProvider>
  );
}