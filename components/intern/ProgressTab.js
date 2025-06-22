'use client';

import { useState, useEffect } from 'react';
import { EnhancedLineChart, SkillRadarChart, ActivityHeatmap, ProgressRing, MetricCard } from '../Charts';
import { AttendanceWidget } from '../AttendanceWidget';
import { format, subDays, eachDayOfInterval } from 'date-fns';

export function ProgressTab({ user, tasks, loading }) {
  const [progressData, setProgressData] = useState([]);
  const [skillData, setSkillData] = useState([]);
  const [activityData, setActivityData] = useState([]);
  const [streakData, setStreakData] = useState({ current: 0, longest: 0, history: [] });
  const [milestones, setMilestones] = useState([]);

  useEffect(() => {
    // Generate mock progress data
    const generateProgressData = () => {
      const days = eachDayOfInterval({
        start: subDays(new Date(), 30),
        end: new Date()
      });

      return days.map((day, index) => ({
        date: day,
        tasksCompleted: Math.floor(Math.random() * 5) + 1,
        cumulativeProgress: Math.min(index * 2 + Math.random() * 10, 100),
        timeSpent: Math.floor(Math.random() * 8) + 1
      }));
    };

    // Generate mock skill data
    const generateSkillData = () => [
      { name: 'Frontend', currentLevel: 7, targetLevel: 10, recentActivity: 'Completed React project' },
      { name: 'Backend', currentLevel: 5, targetLevel: 8, recentActivity: 'Learning Node.js' },
      { name: 'Database', currentLevel: 6, targetLevel: 9, recentActivity: 'MongoDB practice' },
      { name: 'DevOps', currentLevel: 3, targetLevel: 7, recentActivity: 'Docker basics' },
      { name: 'Testing', currentLevel: 4, targetLevel: 8, recentActivity: 'Jest unit tests' },
      { name: 'UI/UX', currentLevel: 6, targetLevel: 8, recentActivity: 'Figma designs' }
    ];

    // Generate mock activity data
    const generateActivityData = () => {
      const days = eachDayOfInterval({
        start: subDays(new Date(), 365),
        end: new Date()
      });

      return days.map(day => ({
        date: day,
        count: Math.floor(Math.random() * 5)
      }));
    };

    // Generate mock streak data
    const generateStreakData = () => {
      const history = Array.from({ length: 30 }, (_, i) => ({
        date: format(subDays(new Date(), 29 - i), 'yyyy-MM-dd'),
        active: Math.random() > 0.3
      }));

      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;

      // Calculate streaks from the end (most recent)
      for (let i = history.length - 1; i >= 0; i--) {
        if (history[i].active) {
          tempStreak++;
          if (i === history.length - 1 || history[i + 1].active) {
            currentStreak = tempStreak;
          }
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 0;
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak);

      return {
        current: currentStreak,
        longest: longestStreak,
        history
      };
    };

    // Generate mock milestones
    const generateMilestones = () => [
      {
        id: 1,
        title: 'First Steps',
        description: 'Complete your first 5 tasks',
        icon: '🎯',
        progress: 100,
        current: 5,
        target: 5,
        unit: 'tasks',
        completed: true,
        reward: 'Achievement Badge'
      },
      {
        id: 2,
        title: 'Consistency Champion',
        description: 'Maintain a 7-day streak',
        icon: '🔥',
        progress: 85,
        current: 6,
        target: 7,
        unit: 'days',
        completed: false,
        reward: 'Streak Master Badge'
      },
      {
        id: 3,
        title: 'Skill Builder',
        description: 'Reach level 8 in any skill',
        icon: '📚',
        progress: 62,
        current: 7,
        target: 8,
        unit: 'level',
        completed: false,
        reward: 'Expert Badge'
      },
      {
        id: 4,
        title: 'Team Player',
        description: 'Complete 3 collaborative tasks',
        icon: '🤝',
        progress: 33,
        current: 1,
        target: 3,
        unit: 'tasks',
        completed: false,
        reward: 'Collaboration Badge'
      }
    ];

    setProgressData(generateProgressData());
    setSkillData(generateSkillData());
    setActivityData(generateActivityData());
    setStreakData(generateStreakData());
    setMilestones(generateMilestones());
  }, []);

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

  // Calculate metrics
  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
  const totalTimeSpent = progressData.reduce((sum, day) => sum + day.timeSpent, 0);
  const avgSkillLevel = skillData.reduce((sum, skill) => sum + skill.currentLevel, 0) / skillData.length;

  // Progress chart data
  const progressChartData = {
    labels: progressData.map(d => format(d.date, 'MMM dd')),
    datasets: [
      {
        label: 'Tasks Completed',
        data: progressData.map(d => d.tasksCompleted),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Cumulative Progress',
        data: progressData.map(d => d.cumulativeProgress),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  // Skill radar data
  const skillRadarData = {
    labels: skillData.map(skill => skill.name),
    datasets: [
      {
        label: 'Current Level',
        data: skillData.map(skill => skill.currentLevel),
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgb(59, 130, 246)',
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(59, 130, 246)'
      },
      {
        label: 'Target Level',
        data: skillData.map(skill => skill.targetLevel),
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        borderColor: 'rgb(16, 185, 129)',
        pointBackgroundColor: 'rgb(16, 185, 129)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(16, 185, 129)'
      }
    ]
  };

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Tasks Completed"
          value={completedTasks}
          icon="✅"
          color="green"
        />
        <MetricCard
          title="In Progress"
          value={inProgressTasks}
          icon="⏳"
          color="orange"
        />
        <MetricCard
          title="Current Streak"
          value={`${streakData.current} days`}
          icon="🔥"
          color="red"
        />
        <MetricCard
          title="Avg Skill Level"
          value={avgSkillLevel.toFixed(1)}
          icon="📊"
          color="purple"
        />
      </div>

      {/* Progress Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4">📈 Progress Over Time</h3>
        <EnhancedLineChart 
          data={progressChartData} 
          height={300}
          options={{
            plugins: {
              tooltip: {
                mode: 'index',
                intersect: false,
              }
            },
            scales: {
              x: { 
                display: true, 
                title: { display: true, text: 'Date' } 
              },
              y: { 
                display: true, 
                title: { display: true, text: 'Tasks' }, 
                beginAtZero: true 
              }
            }
          }}
        />
      </div>

      {/* Skill Development */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4">🎯 Skill Development</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <SkillRadarChart data={skillRadarData} height={300} />
          </div>
          <div className="space-y-3">
            {skillData.map(skill => (
              <div key={skill.name} className="p-3 border rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{skill.name}</span>
                  <span className="text-sm text-gray-600">
                    {skill.currentLevel}/{skill.targetLevel}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(skill.currentLevel / skill.targetLevel) * 100}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500">
                  {skill.recentActivity}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Attendance Overview */}
      <AttendanceWidget />

      {/* Activity Heatmap */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4">🔥 Activity Heatmap</h3>
        <ActivityHeatmap 
          data={activityData}
          startDate={subDays(new Date(), 365)}
          endDate={new Date()}
        />
      </div>

      {/* Streak Tracking */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4">🔥 Streak Tracking</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Current Streak */}
          <div className="text-center">
            <div className="text-4xl font-bold text-orange-600 mb-2">
              {streakData.current}
            </div>
            <div className="text-sm text-gray-600">Current Streak</div>
            <div className="text-xs text-gray-500 mt-1">
              {streakData.current > 0 ? 'Keep it up!' : 'Start your streak today!'}
            </div>
          </div>

          {/* Longest Streak */}
          <div className="text-center">
            <div className="text-4xl font-bold text-purple-600 mb-2">
              {streakData.longest}
            </div>
            <div className="text-sm text-gray-600">Longest Streak</div>
            <div className="text-xs text-gray-500 mt-1">Personal best</div>
          </div>

          {/* Streak Goal */}
          <div className="text-center">
            <div className="text-4xl font-bold text-green-600 mb-2">30</div>
            <div className="text-sm text-gray-600">Streak Goal</div>
            <div className="text-xs text-gray-500 mt-1">
              {30 - streakData.current} days to go
            </div>
          </div>
        </div>

        {/* Streak History */}
        <div>
          <h4 className="font-medium mb-3">Recent Streak History</h4>
          <div className="flex space-x-1 overflow-x-auto">
            {streakData.history.slice(-30).map((day, index) => (
              <div
                key={index}
                className={`w-4 h-4 rounded-sm flex-shrink-0 ${
                  day.active ? 'bg-green-500' : 'bg-gray-200'
                }`}
                title={`${day.date}: ${day.active ? 'Active' : 'Inactive'}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Milestone Tracking */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4">🏆 Milestones</h3>
        
        <div className="space-y-4">
          {milestones.map(milestone => (
            <div key={milestone.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`text-2xl ${milestone.completed ? 'grayscale-0' : 'grayscale'}`}>
                    {milestone.icon}
                  </div>
                  <div>
                    <h4 className="font-medium">{milestone.title}</h4>
                    <p className="text-sm text-gray-600">{milestone.description}</p>
                  </div>
                </div>
                {milestone.completed && (
                  <div className="text-green-600 font-medium">✓ Completed</div>
                )}
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    milestone.completed ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${milestone.progress}%` }}
                />
              </div>
              
              <div className="flex justify-between text-sm text-gray-600">
                <span>{milestone.current}/{milestone.target} {milestone.unit}</span>
                <span>{milestone.progress}% complete</span>
              </div>
              
              {milestone.reward && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                  🎁 Reward: {milestone.reward}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}