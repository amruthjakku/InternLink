'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export function AttendanceWidget() {
  const { data: session } = useSession();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      fetchSummary();
    } else {
      setLoading(false);
    }
  }, [session]);

  // Set a timeout to stop loading after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, []);

  const fetchSummary = async () => {
    try {
      const response = await fetch('/api/attendance/summary');
      if (response.ok) {
        const data = await response.json();
        setSummary(data.summary);
      }
    } catch (error) {
      console.error('Error fetching attendance summary:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="text-center text-gray-500">
          Please log in to access attendance features
        </div>
      </div>
    );
  }

  // Show loading only for a short time, then show the component even without summary
  if (!summary && loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">📊 Attendance Summary</h3>
        {session?.user?.role && (
          <div className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
            {session.user.role}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{summary?.week?.rate || 0}%</div>
          <div className="text-xs text-gray-600">This Week</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{summary?.streak?.current || 0}</div>
          <div className="text-xs text-gray-600">Current Streak</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{summary?.streak?.best || 0}</div>
          <div className="text-xs text-gray-600">Best Streak</div>
        </div>
      </div>

      {/* Today's Status */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Today's Status:</span>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            summary?.today?.marked 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {summary?.today?.marked ? 'Present' : 'Not Marked'}
          </div>
        </div>
        {summary?.today?.markedAt && (
          <div className="text-xs text-gray-500 mt-1">
            Last activity: {new Date(summary.today.markedAt).toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Monthly Overview */}
      {summary?.month && (
        <div className="border-t border-gray-200 pt-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">This Month:</span>
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">
                {summary.month.present}/{summary.month.total} days
              </div>
              <div className="text-xs text-gray-500">
                {Math.round(summary.month.rate)}% attendance
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Call to Action */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">
            Mark your attendance in the Attendance tab
          </p>
          <div className="text-xs text-blue-600">
            📅 Go to Attendance → Check In/Out
          </div>
        </div>
      </div>
    </div>
  );
}