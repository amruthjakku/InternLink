'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { signOut } from 'next-auth/react';
import GitLabIntegration from '../../../components/dashboard/GitLabIntegration.js';
import { ProgressTab } from '../../../components/intern/ProgressTab';
import { TasksTab } from '../../../components/intern/TasksTab';
import { PerformanceTab } from '../../../components/intern/PerformanceTab';
import { AttendanceMarker } from '../../../components/AttendanceMarker';
import { AttendanceWidget } from '../../../components/AttendanceWidget';
import { AttendanceHistory } from '../../../components/AttendanceHistory';
import { MetricCard } from '../../../components/Charts';

export default function InternDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [joinRequests, setJoinRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/');
      return;
    }

    // If user needs registration, redirect to onboarding
    if (session.user.needsRegistration || session.user.role === 'pending') {
      router.push('/onboarding');
      return;
    }

    if (session.user.role !== 'intern') {
      router.push('/unauthorized');
      return;
    }

    fetchJoinRequests();
  }, [session, status, router]);

  const fetchJoinRequests = async () => {
    try {
      const response = await fetch('/api/join-requests');
      if (response.ok) {
        const data = await response.json();
        setJoinRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Error fetching join requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  if (status === 'loading' || loading) {
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
    <div className="min-h-screen bg-gray-50">
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
                  src={session?.user?.image} 
                  alt={session?.user?.name}
                  className="w-8 h-8 rounded-full"
                />
                <span className="text-sm text-gray-700">
                  {session?.user?.name}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition-colors"
              >
                Sign Out
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
              { id: 'overview', name: 'Overview', icon: '🏠' },
              { id: 'progress', name: 'Progress', icon: '📈' },
              { id: 'tasks', name: 'Tasks', icon: '✅' },
              { id: 'performance', name: 'Performance', icon: '🎯' },
              { id: 'attendance', name: 'Attendance', icon: '📅' },
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Welcome Card */}
              <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Welcome back, {session?.user?.name?.split(' ')[0]}! 👋
                </h2>
                <p className="text-gray-600 mb-6">
                  Ready to continue your internship journey? Here's what you can do today.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <button 
                      onClick={() => setActiveTab('attendance')}
                      className="w-full text-left hover:bg-gray-100 rounded-lg p-2 transition-colors"
                    >
                      <div className="text-2xl mb-2">📅</div>
                      <h4 className="font-medium text-gray-900">Mark Attendance</h4>
                      <p className="text-sm text-gray-600">Check in/out for today</p>
                    </button>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <button 
                      onClick={() => setActiveTab('tasks')}
                      className="w-full text-left hover:bg-gray-100 rounded-lg p-2 transition-colors"
                    >
                      <div className="text-2xl mb-2">✅</div>
                      <h4 className="font-medium text-gray-900">View Tasks</h4>
                      <p className="text-sm text-gray-600">Check your assignments</p>
                    </button>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <button 
                      onClick={() => setActiveTab('progress')}
                      className="w-full text-left hover:bg-gray-100 rounded-lg p-2 transition-colors"
                    >
                      <div className="text-2xl mb-2">📈</div>
                      <h4 className="font-medium text-gray-900">Track Progress</h4>
                      <p className="text-sm text-gray-600">Monitor your growth</p>
                    </button>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <button 
                      onClick={() => setActiveTab('gitlab')}
                      className="w-full text-left hover:bg-gray-100 rounded-lg p-2 transition-colors"
                    >
                      <div className="text-2xl mb-2">🦊</div>
                      <h4 className="font-medium text-gray-900">GitLab Integration</h4>
                      <p className="text-sm text-gray-600">Connect your projects</p>
                    </button>
                  </div>
                </div>
              </div>

              {/* Attendance Widget */}
              <AttendanceWidget />

              {/* Join Request Status */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">My Applications</h3>
                </div>
                <div className="p-6">
                  {joinRequests.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-4">📝</div>
                      <h4 className="text-lg font-medium text-gray-900 mb-2">No Applications Yet</h4>
                      <p className="text-gray-600 mb-4">
                        Apply to join a cohort to start your internship journey.
                      </p>
                      <button 
                        onClick={() => router.push('/apply')}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Apply Now
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {joinRequests.map((request) => (
                        <div key={request._id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900">{request.cohortName}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              request.status === 'approved' ? 'bg-green-100 text-green-800' :
                              request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {request.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{request.collegeName}</p>
                          <p className="text-sm text-gray-500">{request.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
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

        {/* Progress Tab */}
        {activeTab === 'progress' && (
          <ProgressTab 
            user={session?.user} 
            tasks={[]} 
            loading={loading} 
          />
        )}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <TasksTab 
            user={session?.user} 
            loading={loading} 
          />
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && (
          <PerformanceTab 
            user={session?.user} 
            loading={loading} 
          />
        )}

        {/* Attendance Tab */}
        {activeTab === 'attendance' && (
          <AttendanceHistory />
        )}

        {activeTab === 'gitlab' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">GitLab Integration</h2>
            <GitLabIntegration />
          </div>
        )}
      </div>
    </div>
  );
}