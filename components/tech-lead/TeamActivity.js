'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export function TeamActivity() {
  const { data: session } = useSession();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      fetchTeamActivity();
    }
  }, [session]);

  const fetchTeamActivity = async () => {
    try {
      const response = await fetch('/api/mentor/team-activity');
      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities || []);
      }
    } catch (error) {
      console.error('Error fetching team activity:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="text-4xl mb-4">👥</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Team Activity</h3>
        <p className="text-gray-600">
          Team activity will appear here once your interns start working.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="space-y-4">
        {activities.map((activity, index) => (
          <div key={index} className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <img
                src={activity.user?.image || `/api/avatar/${activity.user?.name?.charAt(0) || 'U'}`}
                alt={activity.user?.name}
                className="w-8 h-8 rounded-full"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm">
                <span className="font-medium text-gray-900">{activity.user?.name}</span>
                <span className="text-gray-600"> {activity.action}</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {new Date(activity.timestamp).toLocaleString()}
              </div>
            </div>
            <div className="flex-shrink-0">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                activity.type === 'attendance' ? 'bg-green-100 text-green-800' :
                activity.type === 'task' ? 'bg-blue-100 text-blue-800' :
                activity.type === 'gitlab' ? 'bg-orange-100 text-orange-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {activity.type}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}