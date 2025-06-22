'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { signOut } from 'next-auth/react';
import { AttendanceWidget } from '../../../components/AttendanceWidget';
import { AttendanceHistory } from '../../../components/AttendanceHistory';
import { TeamActivity } from '../../../components/mentor/TeamActivity';
import { InternManagement } from '../../../components/mentor/InternManagement';
import { TaskManagement } from '../../../components/mentor/TaskManagement';
import { PerformanceOverview } from '../../../components/mentor/PerformanceOverview';

export default function MentorDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

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

    if (session.user.role !== 'mentor') {
      router.push('/unauthorized');
      return;
    }

    setLoading(false);
  }, [session, status, router]);

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
              <h1 className="text-2xl font-bold text-gray-900">Mentor Dashboard</h1>
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
              { id: 'interns', name: 'My Interns', icon: '👥' },
              { id: 'tasks', name: 'Task Management', icon: '📋' },
              { id: 'performance', name: 'Performance', icon: '📊' },
              { id: 'attendance', name: 'Attendance', icon: '📅' }
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
                  Ready to guide your interns today? Here's your mentor dashboard.
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
                      onClick={() => setActiveTab('interns')}
                      className="w-full text-left hover:bg-gray-100 rounded-lg p-2 transition-colors"
                    >
                      <div className="text-2xl mb-2">👥</div>
                      <h4 className="font-medium text-gray-900">Manage Interns</h4>
                      <p className="text-sm text-gray-600">View your mentees</p>
                    </button>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <button 
                      onClick={() => setActiveTab('tasks')}
                      className="w-full text-left hover:bg-gray-100 rounded-lg p-2 transition-colors"
                    >
                      <div className="text-2xl mb-2">📋</div>
                      <h4 className="font-medium text-gray-900">Assign Tasks</h4>
                      <p className="text-sm text-gray-600">Create assignments</p>
                    </button>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <button 
                      onClick={() => setActiveTab('performance')}
                      className="w-full text-left hover:bg-gray-100 rounded-lg p-2 transition-colors"
                    >
                      <div className="text-2xl mb-2">📊</div>
                      <h4 className="font-medium text-gray-900">View Performance</h4>
                      <p className="text-sm text-gray-600">Track progress</p>
                    </button>
                  </div>
                </div>
              </div>

              {/* Attendance Widget */}
              <AttendanceWidget />

              {/* Quick Stats */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Active Interns</span>
                    <span className="text-lg font-semibold text-blue-600">-</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Pending Tasks</span>
                    <span className="text-lg font-semibold text-yellow-600">-</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Completed Tasks</span>
                    <span className="text-lg font-semibold text-green-600">-</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Team Activity */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Recent Team Activity</h3>
              </div>
              <TeamActivity />
            </div>
          </div>
        )}

        {activeTab === 'interns' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">My Interns</h2>
            <InternManagement />
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Task Management</h2>
            <TaskManagement />
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Performance Overview</h2>
            <PerformanceOverview />
          </div>
        )}

        {activeTab === 'attendance' && <AttendanceHistory />}
      </div>
    </div>
  );
}