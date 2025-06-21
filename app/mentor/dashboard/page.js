'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { signOut } from 'next-auth/react';
import TeamActivity from '../../../components/dashboard/TeamActivity.js';

export default function MentorDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [colleges, setColleges] = useState([]);
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
      setColleges([
        {
          _id: 'demo_college_1',
          name: 'Sreenidhi Institute of Science and Technology',
          description: 'Premier engineering college in Hyderabad',
          location: 'Hyderabad, Telangana',
          website: 'https://sreenidhi.edu.in',
          createdAt: new Date()
        }
      ]);
      setJoinRequests([
        {
          _id: 'demo_request_1',
          internName: 'John Smith',
          internEmail: 'john@demo.com',
          collegeName: 'Sreenidhi Institute of Science and Technology',
          cohortName: 'Summer 2025 Batch',
          message: 'I am excited to join this internship program!',
          status: 'pending',
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
      // Fetch mentor's colleges
      const collegesResponse = await fetch('/api/colleges?mentorOnly=true');
      const collegesData = await collegesResponse.json();
      
      if (collegesResponse.ok) {
        setColleges(collegesData.colleges || []);
      }

      // Fetch join requests
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

  const handleApproveRequest = async (requestId) => {
    try {
      const response = await fetch('/api/join-requests', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId,
          status: 'approved'
        }),
      });

      if (response.ok) {
        // Refresh join requests
        fetchDashboardData();
        alert('Join request approved successfully!');
      } else {
        throw new Error('Failed to approve request');
      }
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Failed to approve request. Please try again.');
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      const response = await fetch('/api/join-requests', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId,
          status: 'rejected'
        }),
      });

      if (response.ok) {
        // Refresh join requests
        fetchDashboardData();
        alert('Join request rejected.');
      } else {
        throw new Error('Failed to reject request');
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Failed to reject request. Please try again.');
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

  const pendingRequests = joinRequests.filter(req => req.status === 'pending');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo Mode Banner */}
      {demoMode && (
        <div className="bg-yellow-100 border-b border-yellow-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <div className="flex items-center justify-center">
              <span className="text-yellow-800 text-sm font-medium">
                🎭 Demo Mode - Mentor Dashboard Experience
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
              <h1 className="text-2xl font-bold text-gray-900">Mentor Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <img 
                  src={demoMode ? 'https://via.placeholder.com/32' : session?.user?.image} 
                  alt={demoMode ? 'Demo Mentor' : session?.user?.name}
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-sm text-gray-700">
                  {demoMode ? 'Dr. Sarah Wilson (Demo)' : session?.user?.name}
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
              { id: 'colleges', name: 'My Colleges', icon: '🏫' },
              { id: 'requests', name: `Join Requests ${pendingRequests.length > 0 ? `(${pendingRequests.length})` : ''}`, icon: '📝' },
              { id: 'analytics', name: 'Analytics', icon: '📈' }
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
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">🏫</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Colleges</p>
                    <p className="text-2xl font-semibold text-gray-900">{colleges.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">👥</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Active Cohorts</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {colleges.reduce((total, college) => total + (college.cohorts?.length || 0), 0)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">📝</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Pending Requests</p>
                    <p className="text-2xl font-semibold text-gray-900">{pendingRequests.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">👨‍🎓</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Interns</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {joinRequests.filter(req => req.status === 'approved').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
              </div>
              <div className="p-6">
                {joinRequests.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No recent activity</p>
                ) : (
                  <div className="space-y-4">
                    {joinRequests.slice(0, 5).map((request) => (
                      <div key={request._id} className="flex items-center justify-between py-2">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {request.internName} requested to join {request.cohortName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(request.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          request.status === 'approved' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {request.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'colleges' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">My Colleges</h2>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                Create New College
              </button>
            </div>

            {colleges.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-6xl text-gray-300">🏫</span>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No colleges yet</h3>
                <p className="mt-2 text-gray-500">Get started by creating your first college.</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {colleges.map((college) => (
                  <div key={college._id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{college.name}</h3>
                        {college.description && (
                          <p className="mt-1 text-gray-600">{college.description}</p>
                        )}
                        {college.location && (
                          <p className="mt-1 text-sm text-gray-500">📍 {college.location}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          Created {new Date(college.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Join Requests</h2>

            {joinRequests.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-6xl text-gray-300">📝</span>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No join requests</h3>
                <p className="mt-2 text-gray-500">Join requests will appear here when interns apply.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {joinRequests.map((request) => (
                  <div key={request._id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-medium text-gray-900">{request.internName}</h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            request.status === 'approved' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {request.status}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-2">
                          <strong>Email:</strong> {request.internEmail}
                        </p>
                        <p className="text-gray-600 mb-2">
                          <strong>College:</strong> {request.collegeName}
                        </p>
                        <p className="text-gray-600 mb-2">
                          <strong>Cohort:</strong> {request.cohortName}
                        </p>
                        {request.message && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-md">
                            <p className="text-sm text-gray-700">
                              <strong>Message:</strong> {request.message}
                            </p>
                          </div>
                        )}
                        <p className="text-xs text-gray-500 mt-3">
                          Submitted on {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      
                      {request.status === 'pending' && (
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => handleApproveRequest(request._id)}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectRequest(request._id)}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Team Analytics</h2>
            <TeamActivity demoMode={demoMode} />
          </div>
        )}
      </div>
    </div>
  );
}