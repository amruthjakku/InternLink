'use client';

import { useState } from 'react';
import { useAuth } from './AuthProvider';
import { GitLabLogin } from './auth/GitLabLogin';

export function LoginPage() {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleGitLabLogin = () => {
    // In a real implementation, this would redirect to GitLab OAuth
    alert('GitLab OAuth integration would be implemented here. For now, use demo login.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            AI Developer Intern Progress Tracker 🚀
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Track your internship progress, access resources, and keep your mentor updated!
          </p>
          <div className="mt-4 space-y-2 text-sm text-gray-500">
            <p>• AI Developer Interns: Mark tasks as done, submit links, and see your progress</p>
            <p>• Tech Leads: View all interns' progress and activity</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* GitLab Login */}
          <GitLabLogin />

          {/* Demo Login */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Demo Login</h2>
            <p className="text-gray-600 mb-6">
              Try the platform without creating an account. Perfect for testing and exploration.
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => handleGitLabLogin()}
                disabled={loading}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                ) : (
                  <span className="mr-2">👨‍💻</span>
                )}
                Login as AI Developer Intern
              </button>
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                Demo accounts come with sample data to showcase all features.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Made with 🚀 by Progress Tracker Team
          </p>
        </div>
      </div>
    </div>
  );
}