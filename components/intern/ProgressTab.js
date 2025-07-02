'use client';

import { useState, useEffect } from 'react';
import { EnhancedLineChart, MetricCard } from '../Charts';
import { format } from 'date-fns';

export function ProgressTab({ user, tasks, loading }) {
  const [weeklyProgress, setWeeklyProgress] = useState({});
  const [taskType, setTaskType] = useState('regular');
  const [tasksByStatus, setTasksByStatus] = useState({
    not_started: 0,
    in_progress: 0,
    review: 0,
    completed: 0,
    total: 0
  });
  const [userProgress, setUserProgress] = useState(null);
  const [progressLoading, setProgressLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('all-time');

  useEffect(() => {
    // Fetch user's isolated progress data
    fetchUserProgress();
  }, [selectedPeriod]);

  useEffect(() => {
    // Check if tasks are weekly and calculate weekly progress
    if (tasks && tasks.length > 0) {
      const hasWeeklyTasks = tasks.some(task => task.weekNumber);
      if (hasWeeklyTasks) {
        setTaskType('weekly');
        calculateWeeklyProgress(tasks);
      } else {
        setTaskType('regular');
      }
      
      // Calculate tasks by status
      const statusCounts = {
        not_started: 0,
        in_progress: 0,
        review: 0,
        completed: 0,
        total: tasks.length
      };
      
      tasks.forEach(task => {
        if (statusCounts.hasOwnProperty(task.status)) {
          statusCounts[task.status]++;
        } else if (task.status === 'done') {
          statusCounts.completed++;
        }
      });
      
      setTasksByStatus(statusCounts);
    }
  }, [tasks]);

  const fetchUserProgress = async () => {
    try {
      setProgressLoading(true);
      const response = await fetch(`/api/user/progress?period=${selectedPeriod}`);
      
      if (response.ok) {
        const data = await response.json();
        setUserProgress(data.data);
      } else {
        console.error('Failed to fetch user progress');
      }
    } catch (error) {
      console.error('Error fetching user progress:', error);
    } finally {
      setProgressLoading(false);
    }
  };

  const calculateWeeklyProgress = (tasks) => {
    const weeklyStats = {};
    
    tasks.forEach(task => {
      if (task.weekNumber) {
        const week = task.weekNumber;
        if (!weeklyStats[week]) {
          weeklyStats[week] = {
            total: 0,
            completed: 0,
            inProgress: 0,
            totalPoints: 0,
            earnedPoints: 0,
            tasks: []
          };
        }
        
        weeklyStats[week].total += 1;
        weeklyStats[week].totalPoints += task.points || 0;
        weeklyStats[week].tasks.push(task);
        
        if (task.status === 'done' || task.status === 'completed') {
          weeklyStats[week].completed += 1;
          weeklyStats[week].earnedPoints += task.points || 0;
        } else if (task.status === 'in_progress') {
          weeklyStats[week].inProgress += 1;
        }
      }
    });
    
    setWeeklyProgress(weeklyStats);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Loading skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white p-6 rounded-xl shadow-sm animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm animate-pulse">
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Calculate overall progress percentage
  const overallProgress = tasksByStatus.total > 0 
    ? Math.round((tasksByStatus.completed / tasksByStatus.total) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">📊 Your Progress</h2>
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Period:</label>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all-time">All Time</option>
            <option value="this-month">This Month</option>
            <option value="this-week">This Week</option>
          </select>
        </div>
      </div>

      {/* User-Isolated Progress Metrics */}
      {progressLoading ? (
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="animate-pulse flex space-x-4">
            <div className="rounded-full bg-gray-300 h-10 w-10"></div>
            <div className="flex-1 space-y-2 py-1">
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              <div className="h-4 bg-gray-300 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      ) : userProgress && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">🎯 Your Personal Progress</h3>
            <span className="text-sm text-blue-600 font-medium">
              {userProgress.user.name} • {userProgress.user.college}
            </span>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 text-center shadow-sm">
              <div className="text-2xl font-bold text-blue-600">{userProgress.metrics.pointsEarned}</div>
              <div className="text-sm text-gray-600">Points Earned</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center shadow-sm">
              <div className="text-2xl font-bold text-green-600">{userProgress.metrics.completionRate}%</div>
              <div className="text-sm text-gray-600">Completion Rate</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center shadow-sm">
              <div className="text-2xl font-bold text-purple-600">{userProgress.metrics.totalHours}h</div>
              <div className="text-sm text-gray-600">Hours Worked</div>
            </div>
            <div className="bg-white rounded-lg p-4 text-center shadow-sm">
              <div className="text-2xl font-bold text-orange-600">{userProgress.metrics.streakDays}</div>
              <div className="text-sm text-gray-600">Day Streak</div>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600 text-center">
            🔒 <strong>Your personal data</strong> - Only you can see and modify your progress
          </div>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Tasks Completed"
          value={tasksByStatus.completed}
          icon="✅"
          color="green"
        />
        <MetricCard
          title="In Progress"
          value={tasksByStatus.in_progress}
          icon="⏳"
          color="orange"
        />
        <MetricCard
          title="In Review"
          value={tasksByStatus.review}
          icon="🔍"
          color="blue"
        />
        <MetricCard
          title="Not Started"
          value={tasksByStatus.not_started}
          icon="📋"
          color="gray"
        />
      </div>

      {/* Overall Progress */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4">📊 Overall Progress</h3>
        <div className="mb-2 flex justify-between">
          <span className="text-sm font-medium text-gray-700">
            {tasksByStatus.completed} of {tasksByStatus.total} tasks completed
          </span>
          <span className="text-sm font-medium text-gray-700">
            {overallProgress}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div 
            className={`h-4 rounded-full transition-all duration-500 ${
              overallProgress === 100 ? 'bg-green-500' : 
              overallProgress > 75 ? 'bg-green-400' : 
              overallProgress > 50 ? 'bg-blue-500' : 
              overallProgress > 25 ? 'bg-yellow-500' : 'bg-orange-500'
            }`}
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* Weekly Progress Section - Only show for weekly tasks */}
      {taskType === 'weekly' && Object.keys(weeklyProgress).length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              📅 Weekly Learning Progress
              <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                {user?.cohortName || user?.cohort_name || 'Your Cohort'}
              </span>
            </h3>
            <div className="text-sm text-gray-600">
              {Object.values(weeklyProgress).reduce((sum, week) => sum + week.earnedPoints, 0)} / {Object.values(weeklyProgress).reduce((sum, week) => sum + week.totalPoints, 0)} points earned
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(weeklyProgress)
              .sort(([a], [b]) => parseInt(a) - parseInt(b))
              .map(([week, stats]) => {
                const progressPercentage = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
                const pointsPercentage = stats.totalPoints > 0 ? (stats.earnedPoints / stats.totalPoints) * 100 : 0;
                
                return (
                  <div key={week} className="bg-gray-50 rounded-lg p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900 flex items-center">
                        Week {week}
                        {progressPercentage === 100 && (
                          <span className="ml-2 text-green-500">🎉</span>
                        )}
                      </h4>
                      <span className="text-xs text-gray-500">
                        {stats.earnedPoints}/{stats.totalPoints} pts
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tasks:</span>
                        <span className="font-medium">{stats.completed}/{stats.total}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${
                            progressPercentage === 100 ? 'bg-green-500' : 
                            progressPercentage > 50 ? 'bg-blue-500' : 'bg-orange-500'
                          }`}
                          style={{ width: `${progressPercentage}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                        Done: {stats.completed}
                      </span>
                      <span className="flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                        Active: {stats.inProgress}
                      </span>
                      <span className="flex items-center">
                        <span className="w-2 h-2 bg-gray-400 rounded-full mr-1"></span>
                        Pending: {stats.total - stats.completed - stats.inProgress}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Task Status Breakdown */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4">📊 Task Status Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Status Bars */}
          <div className="space-y-4">
            {/* Not Started */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Not Started</span>
                <span className="text-sm font-medium text-gray-700">
                  {tasksByStatus.not_started} tasks ({Math.round((tasksByStatus.not_started / tasksByStatus.total) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-gray-500 h-2.5 rounded-full" 
                  style={{ width: `${(tasksByStatus.not_started / tasksByStatus.total) * 100}%` }}
                ></div>
              </div>
            </div>
            
            {/* In Progress */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">In Progress</span>
                <span className="text-sm font-medium text-gray-700">
                  {tasksByStatus.in_progress} tasks ({Math.round((tasksByStatus.in_progress / tasksByStatus.total) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-orange-500 h-2.5 rounded-full" 
                  style={{ width: `${(tasksByStatus.in_progress / tasksByStatus.total) * 100}%` }}
                ></div>
              </div>
            </div>
            
            {/* In Review */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">In Review</span>
                <span className="text-sm font-medium text-gray-700">
                  {tasksByStatus.review} tasks ({Math.round((tasksByStatus.review / tasksByStatus.total) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-500 h-2.5 rounded-full" 
                  style={{ width: `${(tasksByStatus.review / tasksByStatus.total) * 100}%` }}
                ></div>
              </div>
            </div>
            
            {/* Completed */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Completed</span>
                <span className="text-sm font-medium text-gray-700">
                  {tasksByStatus.completed} tasks ({Math.round((tasksByStatus.completed / tasksByStatus.total) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-green-500 h-2.5 rounded-full" 
                  style={{ width: `${(tasksByStatus.completed / tasksByStatus.total) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          {/* Pie Chart Visualization */}
          <div className="flex items-center justify-center">
            <div className="relative w-48 h-48">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-800">{overallProgress}%</div>
                  <div className="text-sm text-gray-600">Complete</div>
                </div>
              </div>
              <svg viewBox="0 0 36 36" className="w-full h-full">
                {/* Background circle */}
                <circle cx="18" cy="18" r="15.91549430918954" fill="transparent" stroke="#f3f4f6" strokeWidth="3"></circle>
                
                {/* Completed segment */}
                <circle 
                  cx="18" cy="18" r="15.91549430918954" fill="transparent"
                  stroke="#10b981" strokeWidth="3"
                  strokeDasharray={`${overallProgress} ${100 - overallProgress}`}
                  strokeDashoffset="25"
                  transform="rotate(-90 18 18)"
                ></circle>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}