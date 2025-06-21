'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { signOut } from 'next-auth/react';
import GitLabIntegration from '../../../components/dashboard/GitLabIntegration.js';

export default function InternDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [joinRequests, setJoinRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    // Check if this is demo mode from URL or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const isDemoMode = urlParams.get('demo') === 'true' || localStorage.getItem('demoMode') === 'true';
    setDemoMode(isDemoMode);

    if (isDemoMode) {
      // Load demo data
      setJoinRequests([
        {
          _id: 'demo_request_1',
          collegeName: 'Sreenidhi Institute of Science and Technology',
          cohortName: 'Summer 2025 Batch',
          message: 'I am excited to join this internship program!',
          status: 'approved',
          createdAt: new Date()
        }
      ]);
      setLoading(false);
      return;
    }

    if (status === 'loading') return;

    if (!session) {
      router.push('/');
      return;
    }

    fetchDashboardData();
  }, [session, status]);

  const fetchDashboardData = async () => {
    try {
      // Fetch intern's join requests
      const requestsResponse = await fetch('/api/join-requests');
      const requestsData = await requestsResponse.json();
      
      if (requestsResponse.ok) {
        setJoinRequests(requestsData.joinRequests || []);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const approvedRequests = joinRequests.filter(req => req.status === 'approved');
  const pendingRequests = joinRequests.filter(req => req.status === 'pending');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo Mode Banner */}
      {demoMode && (
        <div className="bg-yellow-100 border-b border-yellow-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <div className="flex items-center justify-center">
              <span className="text-yellow-800 text-sm font-medium">
                🎭 Demo Mode - Intern Dashboard Experience
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Intern Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <img 
                  src={demoMode ? 'https://via.placeholder.com/32' : session?.user?.image} 
                  alt={demoMode ? 'Demo Intern' : session?.user?.name}
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-sm text-gray-700">
                  {demoMode ? 'John Smith (Demo)' : session?.user?.name}
                </span>
              </div>
              <button
                onClick={() => {
                  if (demoMode) {
                    localStorage.removeItem('demoMode');
                    localStorage.removeItem('demoRole');
                    window.location.href = '/';
                  } else {
                    signOut();
                  }
                }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                {demoMode ? 'Exit Demo' : 'Sign Out'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: '📊' },
              { id: 'progress', name: 'My Progress', icon: '📈' },
              { id: 'tasks', name: 'Tasks', icon: '✅' },
              { id: 'gitlab', name: 'GitLab', icon: '🦊' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Welcome Message */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
              <h2 className="text-2xl font-bold mb-2">Welcome to your internship journey! 🎉</h2>
              <p className="text-blue-100">
                Track your progress, complete tasks, and collaborate with your mentor.
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">📝</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Join Requests</p>
                    <p className="text-2xl font-semibold text-gray-900">{joinRequests.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">✅</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Approved</p>
                    <p className="text-2xl font-semibold text-gray-900">{approvedRequests.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">⏳</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Pending</p>
                    <p className="text-2xl font-semibold text-gray-900">{pendingRequests.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">🔥</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Streak Days</p>
                    <p className="text-2xl font-semibold text-gray-900">0</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Join Request Status */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">My Applications</h3>
              </div>
              <div className="p-6">
                {joinRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <span className="text-6xl text-gray-300">📝</span>
                    <h3 className="mt-4 text-lg font-medium text-gray-900">No applications yet</h3>
                    <p className="mt-2 text-gray-500">
                      You haven't submitted any join requests yet. Complete the onboarding process to get started.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {joinRequests.map((request) => (
                      <div key={request._id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-gray-900">{request.collegeName}</h4>
                            <p className="text-sm text-gray-600">{request.cohortName}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Applied on {new Date(request.createdAt).toLocaleDateString()}
                            </p>
                            {request.message && (
                              <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                                <strong>Your message:</strong> {request.message}
                              </div>
                            )}
                          </div>
                          <span className={`px-3 py-1 text-sm rounded-full ${
                            request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            request.status === 'approved' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {request.status === 'pending' ? '⏳ Pending Review' :
                             request.status === 'approved' ? '✅ Approved' :
                             '❌ Rejected'}
                          </span>
                        </div>
                        
                        {request.status === 'approved' && (
                          <div className="mt-3 p-3 bg-green-50 rounded-md">
                            <p className="text-sm text-green-800">
                              🎉 Congratulations! You've been accepted into this cohort. Your internship journey begins now!
                            </p>
                          </div>
                        )}
                        
                        {request.status === 'pending' && (
                          <div className="mt-3 p-3 bg-yellow-50 rounded-md">
                            <p className="text-sm text-yellow-800">
                              ⏳ Your application is under review. You'll be notified once the mentor makes a decision.
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            {approvedRequests.length > 0 && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
                      <div className="text-2xl mb-2">📝</div>
                      <h4 className="font-medium text-gray-900">View Tasks</h4>
                      <p className="text-sm text-gray-600">Check your assigned tasks</p>
                    </button>
                    
                    <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
                      <div className="text-2xl mb-2">🦊</div>
                      <h4 className="font-medium text-gray-900">Connect GitLab</h4>
                      <p className="text-sm text-gray-600">Link your repositories</p>
                    </button>
                    
                    <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
                      <div className="text-2xl mb-2">📊</div>
                      <h4 className="font-medium text-gray-900">View Progress</h4>
                      <p className="text-sm text-gray-600">Track your achievements</p>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'progress' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">My Progress</h2>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-center py-12">
                <span className="text-6xl text-gray-300">📈</span>
                <h3 className="mt-4 text-lg font-medium text-gray-900">Progress Tracking</h3>
                <p className="mt-2 text-gray-500">
                  Your progress will be displayed here once you start completing tasks.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">My Tasks</h2>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-center py-12">
                <span className="text-6xl text-gray-300">✅</span>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No Tasks Yet</h3>
                <p className="mt-2 text-gray-500">
                  Your mentor will assign tasks once you're approved for a cohort.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'gitlab' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">GitLab Integration</h2>
            <GitLabIntegration demoMode={demoMode} />
          </div>
        )}
      </div>
    </div>
  );
}