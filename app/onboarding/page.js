'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { signOut } from 'next-auth/react';

export default function Onboarding() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [colleges, setColleges] = useState([]);
  const [formData, setFormData] = useState({
    role: 'intern',
    college: '',
    assignedBy: ''
  });

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/');
      return;
    }

    // If user already has a role (not pending), redirect them
    if (session.user.role && session.user.role !== 'pending') {
      const dashboardPath = session.user.role === 'admin' ? '/admin/dashboard' :
                           session.user.role === 'mentor' ? '/mentor/dashboard' :
                           '/intern/dashboard';
      router.push(dashboardPath);
      return;
    }

    fetchColleges();
  }, [session, status, router]);

  const fetchColleges = async () => {
    try {
      const response = await fetch('/api/colleges');
      if (response.ok) {
        const data = await response.json();
        setColleges(data.colleges || []);
      }
    } catch (error) {
      console.error('Error fetching colleges:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/auth/complete-registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          gitlabUsername: session.user.gitlabUsername,
          gitlabId: session.user.gitlabId,
          name: session.user.name,
          email: session.user.email
        }),
      });

      if (response.ok) {
        // Registration successful - redirect to appropriate dashboard
        const dashboardPath = formData.role === 'admin' ? '/admin/dashboard' :
                             formData.role === 'mentor' ? '/mentor/dashboard' :
                             '/intern/dashboard';
        router.push(dashboardPath);
      } else {
        const data = await response.json();
        alert(data.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="text-6xl mb-4">🎯</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome to InternLink!</h2>
          <p className="text-gray-600 mb-8">
            Complete your profile to get started
          </p>
        </div>

        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* User Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <img
                src={session.user?.image || 'https://via.placeholder.com/48'}
                alt={session.user?.name}
                className="w-12 h-12 rounded-full"
              />
              <div>
                <h3 className="text-lg font-medium text-gray-900">{session.user?.name}</h3>
                <p className="text-sm text-gray-600">{session.user?.email}</p>
                <p className="text-xs text-gray-500">@{session.user?.gitlabUsername}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What's your role?
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="intern">Intern</option>
                <option value="mentor">Mentor</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {(formData.role === 'intern' || formData.role === 'mentor') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select your college
                </label>
                <select
                  value={formData.college}
                  onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Choose a college</option>
                  {colleges.map((college) => (
                    <option key={college._id} value={college._id}>
                      {college.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Who assigned you to this system?
              </label>
              <input
                type="text"
                value={formData.assignedBy}
                onChange={(e) => setFormData({ ...formData, assignedBy: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter the name of your supervisor/admin"
                required
              />
            </div>

            <div className="space-y-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Completing Registration...' : 'Complete Registration'}
              </button>
              
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Sign Out
              </button>
            </div>
          </form>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Your information will be reviewed by an administrator before access is granted.
          </p>
        </div>
      </div>
    </div>
  );
}