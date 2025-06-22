'use client';

import { useState, useEffect } from 'react';
import { getCollegeName } from '../../utils/helpers';

export function LeaderboardTab({ user }) {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('all-time');
  const [selectedMetric, setSelectedMetric] = useState('completion-rate');

  useEffect(() => {
    fetchLeaderboardData();
  }, [user, selectedPeriod, selectedMetric]);

  const fetchLeaderboardData = async () => {
    try {
      const response = await fetch(`/api/leaderboard?period=${selectedPeriod}&metric=${selectedMetric}`);
      if (response.ok) {
        const data = await response.json();
        setLeaderboardData(data.leaderboard || []);
      } else {
        setLeaderboardData([]);
      }
    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
      setLeaderboardData([]);
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const getProgressColor = (rate) => {
    if (rate >= 80) return 'bg-green-500';
    if (rate >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStreakColor = (days) => {
    if (days >= 10) return 'text-green-600';
    if (days >= 5) return 'text-yellow-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Leaderboard</h2>
        <div className="flex space-x-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all-time">All Time</option>
            <option value="this-month">This Month</option>
            <option value="this-week">This Week</option>
          </select>
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="completion-rate">Completion Rate</option>
            <option value="tasks-completed">Tasks Completed</option>
            <option value="hours-worked">Hours Worked</option>
            <option value="streak-days">Streak Days</option>
          </select>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Rankings</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {leaderboardData.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No leaderboard data available
            </div>
          ) : (
            leaderboardData.map((intern) => (
              <div
                key={intern.id}
                className={`px-6 py-4 hover:bg-gray-50 ${
                  intern.isCurrentUser ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="text-2xl font-bold text-gray-600">
                        {getRankIcon(intern.rank)}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                        {intern.avatar}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {intern.name}
                        {intern.isCurrentUser && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            You
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {getCollegeName(intern.college)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-900">
                        {intern.tasksCompleted}/{intern.totalTasks}
                      </p>
                      <p className="text-xs text-gray-500">Tasks</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${getProgressColor(intern.completionRate)}`}
                            style={{ width: `${intern.completionRate}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {intern.completionRate}%
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">Completion</p>
                    </div>
                    <div className="text-center">
                      <p className={`text-sm font-medium ${getStreakColor(intern.streakDays)}`}>
                        {intern.streakDays} days
                      </p>
                      <p className="text-xs text-gray-500">Streak</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-900">{intern.totalHours}h</p>
                      <p className="text-xs text-gray-500">Hours</p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Your Stats */}
      {user && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg text-white p-6">
          <h3 className="text-lg font-medium mb-4">Your Performance</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">
                {leaderboardData.find(intern => intern.isCurrentUser)?.rank || '-'}
              </p>
              <p className="text-sm opacity-90">Current Rank</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">
                {leaderboardData.find(intern => intern.isCurrentUser)?.completionRate || 0}%
              </p>
              <p className="text-sm opacity-90">Completion Rate</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">
                {leaderboardData.find(intern => intern.isCurrentUser)?.streakDays || 0}
              </p>
              <p className="text-sm opacity-90">Day Streak</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">
                {leaderboardData.find(intern => intern.isCurrentUser)?.totalHours || 0}h
              </p>
              <p className="text-sm opacity-90">Total Hours</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}