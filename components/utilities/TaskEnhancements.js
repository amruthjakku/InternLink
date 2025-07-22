import React from 'react';
import { format, subWeeks } from 'date-fns';

// Badge for displaying completion rate and streak counts
export function CompletionBadge({ completionRate, streak }) {
  return (
    <div className="flex space-x-4">
      <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full">
        Completion: {completionRate}%
      </div>
      <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full">
        Streak: {streak} days
      </div>
    </div>
  );
}

// Command Center with quick actions
export function CommandCenter({ tasks, onSubmitQuick }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="font-semibold text-lg mb-4">Command Center</h3>
      <ul className="space-y-2">
        {tasks.map(task => (
          <li key={task.id} className="p-3 bg-gray-50 rounded shadow">
            <div className="flex justify-between">
              <span>{task.title}</span>
              <button 
                onClick={() => onSubmitQuick(task.id)}
                className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
              >
                Submit
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Activity feed displaying recent task submissions
export function ActivityFeed({ submissions }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="font-semibold text-lg mb-4">Recent Activity</h3>
      <ul className="space-y-2">
        {submissions.map(sub => (
          <li key={sub.id} className="p-3 bg-gray-50 rounded shadow-md">
            
            <div className="flex justify-between">
              <span>{sub.title}</span>
              <span>{format(new Date(sub.date), 'MMM dd, yyyy')}</span>
            </div>
            <p className="text-sm text-gray-600">Submitted by {sub.author}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Quest system for displaying available tasks as quests
export function QuestBoard({ quests, onAcceptQuest }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="font-semibold text-lg mb-4">Quest Board</h3>
      <ul className="space-y-2">
        {quests.map(quest => (
          <li key={quest.id} className="p-3 bg-gray-50 rounded">
            <div className="flex justify-between">
              <span>{quest.title}</span>
              <button 
                onClick={() => onAcceptQuest(quest.id)}
                className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
              >
                Accept
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Function for animated confetti celebration upon completion
export function ConfettiCelebration({ message }) {
  return (
    <div className="fixed inset-0 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="font-bold text-2xl mb-2 text-center text-blue-700">{message}</h2>
        <p className="text-center text-gray-600">Congratulations on your achievement!</p>
      </div>
    </div>
  );
}

// Simulate route handling or shifted content
export function SimulateRouteHandling() {
  // Placeholder for additional actions or components
}

