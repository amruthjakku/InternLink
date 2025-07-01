'use client';

import { useState, useEffect } from 'react';
import { getCollegeName } from '../../utils/helpers';
import { CollegeBadge } from '../CollegeLogo';

export function LeaderboardTab({ user }) {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('all-time');
  const [selectedMetric, setSelectedMetric] = useState('points-earned');
  const [selectedScope, setSelectedScope] = useState('college'); // 'cohort', 'college', 'global'

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Debug user data
  console.log('LeaderboardTab received user:', user);

  // Fetch data when parameters change
  useEffect(() => {
    fetchLeaderboardData();
    
    // Set up periodic refresh every 5 minutes
    const intervalId = setInterval(() => {
      fetchLeaderboardData();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [user, selectedPeriod, selectedMetric, selectedScope]);

  const fetchLeaderboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching leaderboard data with params:', {
        period: selectedPeriod,
        metric: selectedMetric,
        scope: selectedScope,
        user: user
      });
      
      const response = await fetch(
        `/api/leaderboard?period=${selectedPeriod}&metric=${selectedMetric}&scope=${selectedScope}`,
        { cache: 'no-store' }
      );
      
      const data = await response.json();
      
      if (response.ok) {
        console.log('Leaderboard data received:', data);
        setLeaderboardData(data.leaderboard || []);
      } else {
        console.error('Error response from leaderboard API:', data);
        setError(data.error || 'Failed to fetch leaderboard data');
        setLeaderboardData([]);
      }
    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
      setError('Network error while fetching leaderboard data');
      setLeaderboardData([]);
    } finally {
      setLoading(false);
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            Leaderboard
            {selectedScope === 'cohort' && user?.cohortName && (
              <span className="ml-3 bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                👥 {user.cohortName}
              </span>
            )}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {selectedScope === 'cohort' && 'Competing with your cohort peers'}
            {selectedScope === 'college' && 'Competing with your college'}
            {selectedScope === 'global' && 'Competing globally'}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            value={selectedScope}
            onChange={(e) => setSelectedScope(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="cohort">👥 My Cohort</option>
            <option value="college">🏫 My College</option>
            <option value="global">🌍 Global</option>
          </select>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all-time">All Time</option>
            <option value="this-month">This Month</option>
            <option value="this-week">This Week</option>
          </select>
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="points-earned">🏆 Points Earned</option>
            <option value="completion-rate">📊 Completion Rate</option>
            <option value="tasks-completed">✅ Tasks Completed</option>
            <option value="hours-worked">⏱️ Hours Worked</option>
            <option value="streak-days">🔥 Streak Days</option>
          </select>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Rankings</h3>
          {loading && (
            <div className="flex items-center text-sm text-blue-600">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Updating...
            </div>
          )}
          {!loading && (
            <button 
              onClick={fetchLeaderboardData}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          )}
        </div>
        
        {error && (
          <div className="px-6 py-4 bg-red-50 border-b border-red-100">
            <div className="flex items-center text-red-700">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
            <div className="mt-2 text-sm text-red-600">
              Try refreshing the page or changing the filter options.
            </div>
          </div>
        )}
        
        <div className="divide-y divide-gray-200">
          {loading && leaderboardData.length === 0 ? (
            <div className="px-6 py-8">
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="animate-pulse flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                      <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                    </div>
                    <div className="flex space-x-4">
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : leaderboardData.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <div className="text-gray-500 mb-2">No leaderboard data available</div>
              <div className="text-sm text-gray-400">
                {selectedScope === 'cohort' ? 'Try changing to a different scope or time period' : 
                 'No data found for the selected filters'}
              </div>
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
                      <CollegeBadge college={{ name: getCollegeName(intern.college) }} />
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-900 flex items-center justify-center">
                        <span className="text-yellow-500 mr-1">🏆</span> {intern.pointsEarned || 0}
                      </p>
                      <p className="text-xs text-gray-500">Points</p>
                    </div>
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
                    <div className="text-center hidden md:block">
                      <p className={`text-sm font-medium ${getStreakColor(intern.streakDays)}`}>
                        {intern.streakDays} days
                      </p>
                      <p className="text-xs text-gray-500">Streak</p>
                    </div>
                    <div className="text-center hidden md:block">
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
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Your Performance</h3>
            {loading && (
              <div className="text-sm opacity-80 flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Updating...
              </div>
            )}
          </div>
          
          {leaderboardData.some(intern => intern.isCurrentUser) ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {leaderboardData.find(intern => intern.isCurrentUser)?.rank || '-'}
                </p>
                <p className="text-sm opacity-90">Current Rank</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold flex items-center justify-center">
                  <span className="text-yellow-300 mr-2">🏆</span>
                  {leaderboardData.find(intern => intern.isCurrentUser)?.pointsEarned || 0}
                </p>
                <p className="text-sm opacity-90">Points Earned</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {leaderboardData.find(intern => intern.isCurrentUser)?.completionRate || 0}%
                </p>
                <p className="text-sm opacity-90">Completion Rate</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {leaderboardData.find(intern => intern.isCurrentUser)?.tasksCompleted || 0}
                </p>
                <p className="text-sm opacity-90">Tasks Completed</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              {loading ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-6 bg-white bg-opacity-20 rounded w-1/2 mx-auto"></div>
                  <div className="h-4 bg-white bg-opacity-20 rounded w-1/3 mx-auto"></div>
                </div>
              ) : (
                <>
                  <p className="text-lg mb-2">No performance data available</p>
                  <p className="text-sm opacity-80">
                    {error ? 'There was an error loading your data' : 'Complete tasks to see your performance metrics'}
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}