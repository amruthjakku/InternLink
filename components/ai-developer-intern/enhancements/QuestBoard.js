import React from 'react';
import { 
  TrophyIcon, 
  StarIcon, 
  FireIcon,
  BoltIcon 
} from '@heroicons/react/24/outline';

export const QuestBoard = ({ tasks = [], userStats = {} }) => {
  const calculateProgress = () => {
    if (!tasks || tasks.length === 0) return 0;
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    return Math.round((completedTasks / tasks.length) * 100);
  };

  const getStreakInfo = () => {
    // Mock streak calculation - can be enhanced with real data
    return {
      current: userStats.currentStreak || 0,
      best: userStats.bestStreak || 0
    };
  };

  const getAchievements = () => {
    const completedCount = tasks.filter(task => task.status === 'completed').length;
    const achievements = [];

    if (completedCount >= 1) achievements.push({ name: 'First Steps', icon: '🎯', description: 'Complete your first task' });
    if (completedCount >= 5) achievements.push({ name: 'Getting Started', icon: '🚀', description: 'Complete 5 tasks' });
    if (completedCount >= 10) achievements.push({ name: 'Task Master', icon: '⭐', description: 'Complete 10 tasks' });
    if (completedCount >= 25) achievements.push({ name: 'Dedicated', icon: '🏆', description: 'Complete 25 tasks' });

    return achievements;
  };

  const progress = calculateProgress();
  const streak = getStreakInfo();
  const achievements = getAchievements();

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
          <TrophyIcon className="w-5 h-5 text-yellow-500" />
          <span>Quest Board</span>
        </h3>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <FireIcon className="w-4 h-4 text-orange-500" />
          <span>{streak.current} day streak</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Progress</span>
          <span className="text-sm text-gray-600">{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-white rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {tasks.filter(t => t.status === 'completed').length}
          </div>
          <div className="text-xs text-gray-600">Completed</div>
        </div>
        <div className="text-center p-3 bg-white rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">
            {tasks.filter(t => t.status === 'in_progress').length}
          </div>
          <div className="text-xs text-gray-600">In Progress</div>
        </div>
        <div className="text-center p-3 bg-white rounded-lg">
          <div className="text-2xl font-bold text-purple-600">
            {streak.best}
          </div>
          <div className="text-xs text-gray-600">Best Streak</div>
        </div>
      </div>

      {/* Achievements */}
      {achievements.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center space-x-1">
            <StarIcon className="w-4 h-4 text-yellow-500" />
            <span>Recent Achievements</span>
          </h4>
          <div className="space-y-2">
            {achievements.slice(-3).map((achievement, index) => (
              <div key={index} className="flex items-center space-x-3 p-2 bg-white rounded-lg">
                <span className="text-lg">{achievement.icon}</span>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{achievement.name}</div>
                  <div className="text-xs text-gray-600">{achievement.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};