'use client';

import { useState, useEffect } from 'react';

export function LeaderboardTab({ user, loading }) {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('overall');
  const [timeframe, setTimeframe] = useState('weekly');

  useEffect(() => {
    // Simulate leaderboard data
    const mockData = [
      {
        id: 1,
        name: 'Alice Johnson',
        college: 'MIT',
        avatar: 'AJ',
        tasksCompleted: 15,
        totalTasks: 18,
        completionRate: 83.3,
        streakDays: 12,
        totalHours: 45,
        rank: 1,
        isCurrentUser: false
      },
      {
        id: 2,
        name: user?.name || 'Demo Intern',
        college: user?.college || 'Demo College',
        avatar: user?.name?.charAt(0) || 'D',
        tasksCompleted: 12,
        totalTasks: 16,
        completionRate: 75.0,
        streakDays: 5,
        totalHours: 38,
        rank: 2,
        isCurrentUser: true
      },
      {
        id: 3,
        name: 'Bob Smith',
        college: 'Stanford',
        avatar: 'BS',
        tasksCompleted: 10,
        totalTasks: 15,
        completionRate: 66.7,
        streakDays: 8,
        totalHours: 32,
        rank: 3,
        isCurrentUser: false
      },
      {
        id: 4,
        name: 'Carol Davis',
        college: 'Harvard',
        avatar: 'CD',
        tasksCompleted: 9,
        totalTasks: 14,
        completionRate: 64.3,
        streakDays: 3,
        totalHours: 28,
        rank: 4,
        isCurrentUser: false
      },
      {
        id: 5,
        name: 'David Wilson',
        college: 'UC Berkeley',
        avatar: 'DW',
        tasksCompleted: 8,
        totalTasks: 13,
        completionRate: 61.5,
        streakDays: 6,
        totalHours: 25,
        rank: 5,
        isCurrentUser: false
      },
      {
        id: 6,
        name: 'Eva Martinez',
        college: 'Caltech',
        avatar: 'EM',
        tasksCompleted: 7,
        totalTasks: 12,
        completionRate: 58.3,
        streakDays: 2,
        totalHours: 22,
        rank: 6,
        isCurrentUser: false
      }
    ];

    setLeaderboardData(mockData);
  }, [user]);

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const getRankColor = (rank) => {
    switch (rank) {
      case 1: return 'text-yellow-600 bg-yellow-50';
      case 2: return 'text-gray-600 bg-gray-50';
      case 3: return 'text-orange-600 bg-orange-50';
      default: return 'text-blue-600 bg-blue-50';
    }
  };

  const getProgressColor = (rate) => {
    if (rate >= 80) return 'bg-green-500';
    if (rate >= 60) return 'bg-blue-500';
    if (rate >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const categories = [
    { id: 'overall', name: 'Overall Performance' },
    { id: 'completion', name: 'Task Completion' },
    { id: 'streak', name: 'Streak Days' },
    { id: 'hours', name: 'Hours Worked' }
  ];

  const timeframes = [
    { id: 'weekly', name: 'This Week' },
    { id: 'monthly', name: 'This Month' },
    { id: 'alltime', name: 'All Time' }
  ];

  const sortedData = [...leaderboardData].sort((a, b) => {
    switch (selectedCategory) {
      case 'completion':
        return b.completionRate - a.completionRate;
      case 'streak':
        return b.streakDays - a.streakDays;
      case 'hours':
        return b.totalHours - a.totalHours;
      default:
        return a.rank - b.rank;
    }
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="flex space-x-2">
            <div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded w-24 animate-pulse"></div>
          </div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Leaderboard</h2>
          <p className="text-gray-600">See how you rank among your peers</p>
        </div>
        
        <div className="flex space-x-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {timeframes.map(tf => (
              <option key={tf.id} value={tf.id}>
                {tf.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Top 3 Podium */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Top Performers</h3>
        <div className="flex justify-center items-end space-x-4">
          {/* Second Place */}
          {sortedData[1] && (
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-400 rounded-full flex items-center justify-center text-white font-bold text-lg mb-2">
                {sortedData[1].avatar}
              </div>
              <div className="bg-gray-100 px-3 py-2 rounded-lg">
                <div className="text-2xl mb-1">🥈</div>
                <div className="font-medium text-sm">{sortedData[1].name}</div>
                <div className="text-xs text-gray-600">{sortedData[1].college}</div>
                <div className="text-sm font-bold text-gray-700 mt-1">
                  {sortedData[1].completionRate.toFixed(1)}%
                </div>
              </div>
            </div>
          )}

          {/* First Place */}
          {sortedData[0] && (
            <div className="text-center">
              <div className="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center text-white font-bold text-xl mb-2">
                {sortedData[0].avatar}
              </div>
              <div className="bg-yellow-50 px-4 py-3 rounded-lg border-2 border-yellow-200">
                <div className="text-3xl mb-1">🥇</div>
                <div className="font-bold text-sm">{sortedData[0].name}</div>
                <div className="text-xs text-gray-600">{sortedData[0].college}</div>
                <div className="text-sm font-bold text-yellow-700 mt-1">
                  {sortedData[0].completionRate.toFixed(1)}%
                </div>
              </div>
            </div>
          )}

          {/* Third Place */}
          {sortedData[2] && (
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-400 rounded-full flex items-center justify-center text-white font-bold text-lg mb-2">
                {sortedData[2].avatar}
              </div>
              <div className="bg-orange-50 px-3 py-2 rounded-lg">
                <div className="text-2xl mb-1">🥉</div>
                <div className="font-medium text-sm">{sortedData[2].name}</div>
                <div className="text-xs text-gray-600">{sortedData[2].college}</div>
                <div className="text-sm font-bold text-orange-700 mt-1">
                  {sortedData[2].completionRate.toFixed(1)}%
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Full Leaderboard */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Full Rankings</h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {sortedData.map((intern, index) => (
            <div 
              key={intern.id} 
              className={`p-6 hover:bg-gray-50 transition-colors ${
                intern.isCurrentUser ? 'bg-blue-50 border-l-4 border-blue-500' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${getRankColor(index + 1)}`}>
                    {getRankIcon(index + 1)}
                  </div>
                  
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                    {intern.avatar}
                  </div>
                  
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-gray-900">{intern.name}</h4>
                      {intern.isCurrentUser && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          You
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{intern.college}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-900">
                      {intern.tasksCompleted}/{intern.totalTasks}
                    </div>
                    <div className="text-xs text-gray-500">Tasks</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-900">
                      {intern.completionRate.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500">Completion</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-900">
                      {intern.streakDays}
                    </div>
                    <div className="text-xs text-gray-500">Streak</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-900">
                      {intern.totalHours}h
                    </div>
                    <div className="text-xs text-gray-500">Hours</div>
                  </div>

                  <div className="w-24">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${getProgressColor(intern.completionRate)}`}
                        style={{ width: `${intern.completionRate}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Your Stats Summary */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Your Performance Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">#{sortedData.findIndex(s => s.isCurrentUser) + 1}</div>
            <div className="text-sm text-gray-600">Current Rank</div>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {sortedData.find(s => s.isCurrentUser)?.completionRate.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Completion Rate</div>
          </div>
          
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {sortedData.find(s => s.isCurrentUser)?.streakDays}
            </div>
            <div className="text-sm text-gray-600">Day Streak</div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {sortedData.find(s => s.isCurrentUser)?.totalHours}h
            </div>
            <div className="text-sm text-gray-600">Total Hours</div>
          </div>
        </div>
      </div>
    </div>
  );
}