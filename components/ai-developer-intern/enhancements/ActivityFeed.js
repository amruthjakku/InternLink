import React from 'react';
import { format } from 'date-fns';

export const ActivityFeed = ({ activities = [] }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'task_started':
        return '🚀';
      case 'task_completed':
        return '✅';
      case 'task_submitted':
        return '📤';
      case 'comment_added':
        return '💬';
      default:
        return '📝';
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'task_started':
        return 'text-blue-600';
      case 'task_completed':
        return 'text-green-600';
      case 'task_submitted':
        return 'text-yellow-600';
      case 'comment_added':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  if (!activities || activities.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="text-center py-8 text-gray-500">
          No recent activity to show.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {activities.slice(0, 10).map((activity, index) => (
          <div key={index} className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <span className="text-lg">{getActivityIcon(activity.type)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${getActivityColor(activity.type)}`}>
                {activity.title}
              </p>
              <p className="text-sm text-gray-600">{activity.description}</p>
              <p className="text-xs text-gray-500 mt-1">
                {format(new Date(activity.timestamp), 'MMM d, yyyy h:mm a')}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};