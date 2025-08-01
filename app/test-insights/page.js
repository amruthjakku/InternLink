'use client';

import { GitLabInsightsDashboard } from '../../components/gitlab/GitLabInsightsDashboard';

export default function TestInsightsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">GitLab Insights Test</h1>
          <p className="mt-2 text-gray-600">
            Test page for the enhanced GitLab insights dashboard with comprehensive analytics.
          </p>
        </div>
        
        <GitLabInsightsDashboard />
      </div>
    </div>
  );
}