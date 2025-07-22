import React from 'react';
import { 
  PlayIcon, 
  PauseIcon, 
  CheckIcon,
  ClockIcon 
} from '@heroicons/react/24/outline';

export const CommandCenter = ({ task, onStatusChange }) => {
  const handleStatusChange = (newStatus) => {
    if (onStatusChange) {
      onStatusChange(task._id, newStatus);
    }
  };

  const getActionButton = () => {
    switch (task.status) {
      case 'not_started':
        return (
          <button
            onClick={() => handleStatusChange('in_progress')}
            className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            <PlayIcon className="w-4 h-4" />
            <span>Start</span>
          </button>
        );
      case 'in_progress':
        return (
          <div className="flex space-x-2">
            <button
              onClick={() => handleStatusChange('review')}
              className="flex items-center space-x-1 px-3 py-1 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 text-sm"
            >
              <ClockIcon className="w-4 h-4" />
              <span>Submit for Review</span>
            </button>
            <button
              onClick={() => handleStatusChange('not_started')}
              className="flex items-center space-x-1 px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
            >
              <PauseIcon className="w-4 h-4" />
              <span>Pause</span>
            </button>
          </div>
        );
      case 'review':
        return (
          <button
            onClick={() => handleStatusChange('completed')}
            className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
          >
            <CheckIcon className="w-4 h-4" />
            <span>Mark Complete</span>
          </button>
        );
      case 'completed':
        return (
          <span className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-800 rounded-md text-sm">
            <CheckIcon className="w-4 h-4" />
            <span>Completed</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="text-sm text-gray-600">
        Quick Actions
      </div>
      {getActionButton()}
    </div>
  );
};