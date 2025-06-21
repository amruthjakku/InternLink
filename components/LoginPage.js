'use client';

import { useState } from 'react';
import { useAuth } from './AuthProvider';

export function LoginPage() {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleDemoLogin = (role) => {
    setLoading(true);
    
    const userData = {
      email: role === 'intern' ? 'intern@democollege.edu' : 'mentor@democollege.edu',
      username: role,
      name: role === 'intern' ? 'Demo Intern' : 'Demo Mentor',
      role: role,
      college: 'Demo College',
      is_demo: true,
      user_id: role === 'intern' ? 'demo_intern_1' : 'demo_mentor_1'
    };

    // Simulate login delay
    setTimeout(() => {
      login(userData);
      setLoading(false);
    }, 1000);
  };

  const handleGitLabLogin = () => {
    // In a real implementation, this would redirect to GitLab OAuth
    alert('GitLab OAuth integration would be implemented here. For now, use demo login.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Intern Progress Tracker 🚀
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Track your internship progress, access resources, and keep your mentor updated!
          </p>
          <div className="mt-4 space-y-2 text-sm text-gray-500">
            <p>• Interns: Mark tasks as done, submit links, and see your progress</p>
            <p>• Mentors: View all interns' progress and activity</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* GitLab Login */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Sign in with GitLab</h2>
            <p className="text-gray-600 mb-6">
              Use your GitLab account to access the platform with full features.
            </p>
            <button
              onClick={handleGitLabLogin}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 0 1-.3-.94l1.22-3.78 2.44-7.51A.42.42 0 0 1 4.82 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.16l2.44 7.49h8.1l2.44-7.51A.42.42 0 0 1 18.6 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.16l2.44 7.51 1.22 3.78a.84.84 0 0 1-.3.94z"/>
              </svg>
              Continue with GitLab
            </button>
            
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> GitLab OAuth is not configured in this demo. Use the demo login instead.
              </p>
            </div>
          </div>

          {/* Demo Login */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Demo Login</h2>
            <p className="text-gray-600 mb-6">
              Try the platform without creating an account. Perfect for testing and exploration.
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => handleDemoLogin('intern')}
                disabled={loading}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                ) : (
                  <span className="mr-2">👨‍💻</span>
                )}
                Login as Intern
              </button>
              
              <button
                onClick={() => handleDemoLogin('mentor')}
                disabled={loading}
                className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                ) : (
                  <span className="mr-2">👩‍🏫</span>
                )}
                Login as Mentor
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