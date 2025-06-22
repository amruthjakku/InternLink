'use client';

import { GitLabTestComponent } from '../../components/test/GitLabTestComponent';

export default function TestGitLabPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">GitLab Integration Test Page</h1>
        <GitLabTestComponent />
        
        <div className="mt-8 max-w-2xl mx-auto p-6 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Instructions:</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Click the "Test GitLab Connection" button</li>
            <li>Fill in your GitLab username</li>
            <li>Enter your Personal Access Token (create one at GitLab → Settings → Access Tokens)</li>
            <li>Optionally specify repositories to track</li>
            <li>Click "Test Connection" to verify the integration works</li>
          </ol>
          
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> This is a standalone test page to verify GitLab integration works independently of the main dashboard.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}