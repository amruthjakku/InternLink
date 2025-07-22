'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export function PerformanceOverview() {
  const { data: session } = useSession();
  const [performanceData, setPerformanceData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      fetchPerformanceData();
    }
  }, [session]);

  const fetchPerformanceData = async () => {
    try {
      const response = await fetch('/api/mentor/performance');
      if (response.ok) {
        const data = await response.json();
        setPerformanceData(data);
      }
    } catch (error) {
      console.error('Error fetching performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 text-lg">👥</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Interns</p>
              <p className="text-2xl font-semibold text-gray-900">
                {performanceData?.totalInterns || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 text-lg">📈</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Performance</p>
              <p className="text-2xl font-semibold text-gray-900">
                {performanceData?.averagePerformance || 0}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-yellow-600 text-lg">✅</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tasks Completed</p>
              <p className="text-2xl font-semibold text-gray-900">
                {performanceData?.completedTasks || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Chart Placeholder */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Trends</h3>
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-4">📊</div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">Performance Analytics</h4>
            <p className="text-gray-600">
              Performance charts and analytics will be displayed here.
            </p>
          </div>
        </div>
      </div>

      {/* Individual Performance */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Individual Performance</h3>
        </div>
        <div className="p-6">
          {performanceData?.individuals?.length > 0 ? (
            <div className="space-y-4">
              {performanceData.individuals.map((intern) => (
                <div key={intern._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <img
                      src={intern.image || `/api/avatar/${intern.name?.charAt(0) || 'U'}`}
                      alt={intern.name}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <h4 className="font-medium text-gray-900">{intern.name}</h4>
                      <p className="text-sm text-gray-600">{intern.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-900">{intern.attendanceRate || 0}%</p>
                      <p className="text-xs text-gray-600">Attendance</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-900">{intern.taskCompletion || 0}%</p>
                      <p className="text-xs text-gray-600">Tasks</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-900">{intern.overallScore || 0}</p>
                      <p className="text-xs text-gray-600">Score</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">👥</div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">No Performance Data</h4>
              <p className="text-gray-600">
                Performance data will appear here once interns start working.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}