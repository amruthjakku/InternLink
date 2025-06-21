'use client';

import { useState, useEffect } from 'react';
import { EnhancedLineChart, EnhancedBarChart, SkillRadarChart, MetricCard, ActivityHeatmap } from '../Charts';
import { format, subDays, eachDayOfInterval, eachWeekOfInterval, startOfWeek, endOfWeek } from 'date-fns';

export function PerformanceTab({ user, loading }) {
  const [performanceData, setPerformanceData] = useState({});
  const [skillProgress, setSkillProgress] = useState([]);
  const [weeklyStats, setWeeklyStats] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [goals, setGoals] = useState([]);
  const [timeframe, setTimeframe] = useState('month'); // 'week', 'month', 'quarter'

  useEffect(() => {
    // Generate comprehensive performance data
    const generatePerformanceData = () => {
      const days = eachDayOfInterval({
        start: subDays(new Date(), 30),
        end: new Date()
      });

      const dailyPerformance = days.map(date => ({
        date,
        score: Math.floor(Math.random() * 30) + 70, // 70-100
        tasksCompleted: Math.floor(Math.random() * 5) + 1,
        hoursWorked: Math.floor(Math.random() * 6) + 2,
        codeCommits: Math.floor(Math.random() * 8) + 1,
        learningHours: Math.floor(Math.random() * 3) + 0.5
      }));

      const currentScore = 87;
      const previousScore = 82;
      const improvement = currentScore - previousScore;
      
      return {
        currentScore,
        previousScore,
        improvement,
        dailyPerformance,
        totalTasks: 45,
        completedTasks: 38,
        averageTaskTime: 2.3, // days
        onTimeDelivery: 89, // percentage
        codeQuality: 92,
        collaboration: 85,
        learning: 90
      };
    };

    // Generate skill progress data
    const generateSkillProgress = () => [
      {
        name: 'JavaScript',
        currentLevel: 8,
        previousLevel: 6,
        targetLevel: 9,
        progress: 88,
        recentActivities: [
          'Completed ES6 advanced features',
          'Built async/await project',
          'Mastered closures and prototypes'
        ],
        nextMilestone: 'Learn TypeScript basics',
        timeToTarget: '2 weeks'
      },
      {
        name: 'React',
        currentLevel: 7,
        previousLevel: 5,
        targetLevel: 9,
        progress: 77,
        recentActivities: [
          'Built component library',
          'Implemented custom hooks',
          'Optimized performance'
        ],
        nextMilestone: 'Learn React Testing Library',
        timeToTarget: '3 weeks'
      },
      {
        name: 'Node.js',
        currentLevel: 6,
        previousLevel: 4,
        targetLevel: 8,
        progress: 75,
        recentActivities: [
          'Built REST API',
          'Implemented authentication',
          'Database integration'
        ],
        nextMilestone: 'Learn GraphQL',
        timeToTarget: '4 weeks'
      },
      {
        name: 'Database Design',
        currentLevel: 5,
        previousLevel: 3,
        targetLevel: 7,
        progress: 71,
        recentActivities: [
          'Designed normalized schema',
          'Optimized queries',
          'Learned indexing'
        ],
        nextMilestone: 'Advanced query optimization',
        timeToTarget: '5 weeks'
      },
      {
        name: 'Git & Version Control',
        currentLevel: 8,
        previousLevel: 7,
        targetLevel: 9,
        progress: 88,
        recentActivities: [
          'Mastered branching strategies',
          'Resolved merge conflicts',
          'Code review best practices'
        ],
        nextMilestone: 'Advanced Git workflows',
        timeToTarget: '2 weeks'
      }
    ];

    // Generate weekly statistics
    const generateWeeklyStats = () => {
      const weeks = eachWeekOfInterval({
        start: subDays(new Date(), 84), // 12 weeks
        end: new Date()
      });

      return weeks.map(weekStart => ({
        week: format(weekStart, 'MMM dd'),
        tasksCompleted: Math.floor(Math.random() * 8) + 3,
        hoursWorked: Math.floor(Math.random() * 15) + 25,
        performanceScore: Math.floor(Math.random() * 20) + 75,
        learningHours: Math.floor(Math.random() * 8) + 2
      }));
    };

    // Generate achievements
    const generateAchievements = () => [
      {
        id: 1,
        title: 'First Sprint Champion',
        description: 'Completed all tasks in your first sprint',
        icon: '🏆',
        earnedDate: '2024-01-10',
        category: 'milestone',
        points: 100
      },
      {
        id: 2,
        title: 'Code Quality Master',
        description: 'Maintained 95%+ code quality score for 2 weeks',
        icon: '⭐',
        earnedDate: '2024-01-15',
        category: 'quality',
        points: 150
      },
      {
        id: 3,
        title: 'Learning Enthusiast',
        description: 'Completed 20+ hours of learning this month',
        icon: '📚',
        earnedDate: '2024-01-16',
        category: 'learning',
        points: 75
      },
      {
        id: 4,
        title: 'Team Player',
        description: 'Helped 3 fellow interns with their tasks',
        icon: '🤝',
        earnedDate: '2024-01-12',
        category: 'collaboration',
        points: 125
      },
      {
        id: 5,
        title: 'Consistency King',
        description: 'Maintained 7-day activity streak',
        icon: '🔥',
        earnedDate: '2024-01-14',
        category: 'consistency',
        points: 200
      }
    ];

    // Generate feedback data
    const generateFeedback = () => [
      {
        id: 1,
        mentor: 'Dr. Sarah Smith',
        date: '2024-01-15',
        rating: 4.5,
        category: 'Technical Skills',
        comment: 'Excellent progress on React components. Your code is clean and well-structured. Keep focusing on performance optimization.',
        strengths: ['Clean Code', 'Problem Solving', 'Quick Learning'],
        improvements: ['Performance Optimization', 'Testing']
      },
      {
        id: 2,
        mentor: 'Dr. Sarah Smith',
        date: '2024-01-10',
        rating: 4.2,
        category: 'Collaboration',
        comment: 'Great team player! You actively participate in discussions and help others. Work on presenting your ideas more confidently.',
        strengths: ['Team Collaboration', 'Helping Others', 'Communication'],
        improvements: ['Presentation Skills', 'Leadership']
      },
      {
        id: 3,
        mentor: 'Dr. Sarah Smith',
        date: '2024-01-05',
        rating: 4.0,
        category: 'Project Management',
        comment: 'Good progress on task completion. You meet most deadlines and deliver quality work. Focus on time estimation.',
        strengths: ['Quality Delivery', 'Attention to Detail'],
        improvements: ['Time Management', 'Estimation']
      }
    ];

    // Generate goals
    const generateGoals = () => [
      {
        id: 1,
        title: 'Master React Advanced Patterns',
        description: 'Learn and implement advanced React patterns like render props, HOCs, and compound components',
        category: 'Technical',
        priority: 'high',
        progress: 65,
        dueDate: '2024-02-15',
        milestones: [
          { id: 11, title: 'Learn render props pattern', completed: true },
          { id: 12, title: 'Implement HOC examples', completed: true },
          { id: 13, title: 'Build compound components', completed: false },
          { id: 14, title: 'Create reusable component library', completed: false }
        ]
      },
      {
        id: 2,
        title: 'Improve Code Review Skills',
        description: 'Become proficient at giving and receiving code reviews',
        category: 'Professional',
        priority: 'medium',
        progress: 40,
        dueDate: '2024-02-28',
        milestones: [
          { id: 21, title: 'Review 10 pull requests', completed: true },
          { id: 22, title: 'Learn code review best practices', completed: false },
          { id: 23, title: 'Give constructive feedback', completed: false },
          { id: 24, title: 'Lead code review session', completed: false }
        ]
      },
      {
        id: 3,
        title: 'Build Full-Stack Application',
        description: 'Create a complete web application with frontend, backend, and database',
        category: 'Project',
        priority: 'high',
        progress: 30,
        dueDate: '2024-03-15',
        milestones: [
          { id: 31, title: 'Design application architecture', completed: true },
          { id: 32, title: 'Setup development environment', completed: true },
          { id: 33, title: 'Implement backend API', completed: false },
          { id: 34, title: 'Build frontend interface', completed: false },
          { id: 35, title: 'Deploy to production', completed: false }
        ]
      }
    ];

    setPerformanceData(generatePerformanceData());
    setSkillProgress(generateSkillProgress());
    setWeeklyStats(generateWeeklyStats());
    setAchievements(generateAchievements());
    setFeedback(generateFeedback());
    setGoals(generateGoals());
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

  // Chart data
  const performanceTrendData = {
    labels: performanceData.dailyPerformance?.map(d => format(d.date, 'MMM dd')) || [],
    datasets: [
      {
        label: 'Performance Score',
        data: performanceData.dailyPerformance?.map(d => d.score) || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Tasks Completed',
        data: performanceData.dailyPerformance?.map(d => d.tasksCompleted) || [],
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true,
        yAxisID: 'y1'
      }
    ]
  };

  const skillRadarData = {
    labels: skillProgress.map(skill => skill.name),
    datasets: [
      {
        label: 'Current Level',
        data: skillProgress.map(skill => skill.currentLevel),
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgb(59, 130, 246)',
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(59, 130, 246)'
      },
      {
        label: 'Target Level',
        data: skillProgress.map(skill => skill.targetLevel),
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        borderColor: 'rgb(16, 185, 129)',
        pointBackgroundColor: 'rgb(16, 185, 129)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(16, 185, 129)'
      }
    ]
  };

  const weeklyStatsData = {
    labels: weeklyStats.map(w => w.week),
    datasets: [
      {
        label: 'Tasks Completed',
        data: weeklyStats.map(w => w.tasksCompleted),
        backgroundColor: 'rgba(59, 130, 246, 0.8)'
      },
      {
        label: 'Hours Worked',
        data: weeklyStats.map(w => w.hoursWorked),
        backgroundColor: 'rgba(16, 185, 129, 0.8)'
      }
    ]
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'milestone': return 'bg-yellow-100 text-yellow-800';
      case 'quality': return 'bg-blue-100 text-blue-800';
      case 'learning': return 'bg-green-100 text-green-800';
      case 'collaboration': return 'bg-purple-100 text-purple-800';
      case 'consistency': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'border-red-300 bg-red-50';
      case 'medium': return 'border-yellow-300 bg-yellow-50';
      case 'low': return 'border-green-300 bg-green-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Performance Score"
          value={`${performanceData.currentScore}%`}
          change={performanceData.improvement}
          icon="📊"
          color="blue"
        />
        <MetricCard
          title="Task Completion"
          value={`${Math.round((performanceData.completedTasks / performanceData.totalTasks) * 100)}%`}
          change={8.5}
          icon="✅"
          color="green"
        />
        <MetricCard
          title="Code Quality"
          value={`${performanceData.codeQuality}%`}
          change={3.2}
          icon="⭐"
          color="purple"
        />
        <MetricCard
          title="On-Time Delivery"
          value={`${performanceData.onTimeDelivery}%`}
          change={-2.1}
          icon="⏰"
          color="orange"
        />
      </div>

      {/* Performance Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">📈 Performance Trends</h3>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="quarter">Last Quarter</option>
            </select>
          </div>
          <EnhancedLineChart 
            data={performanceTrendData} 
            height={250}
            options={{
              scales: {
                y: {
                  type: 'linear',
                  display: true,
                  position: 'left',
                  title: { display: true, text: 'Performance Score' }
                },
                y1: {
                  type: 'linear',
                  display: true,
                  position: 'right',
                  title: { display: true, text: 'Tasks Completed' },
                  grid: { drawOnChartArea: false }
                }
              }
            }}
          />
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">🎯 Skills Overview</h3>
          <SkillRadarChart data={skillRadarData} height={250} />
        </div>
      </div>

      {/* Weekly Statistics */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4">📊 Weekly Statistics</h3>
        <EnhancedBarChart data={weeklyStatsData} height={300} />
      </div>

      {/* Skills Progress */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4">🚀 Skills Development</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {skillProgress.map(skill => (
            <div key={skill.name} className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium text-lg">{skill.name}</h4>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    Level {skill.currentLevel}/{skill.targetLevel}
                  </span>
                  {skill.currentLevel > skill.previousLevel && (
                    <span className="text-green-600 text-sm">
                      ↗️ +{skill.currentLevel - skill.previousLevel}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${skill.progress}%` }}
                />
              </div>
              
              <div className="text-sm text-gray-600 mb-3">
                <strong>Next milestone:</strong> {skill.nextMilestone}
                <br />
                <strong>Time to target:</strong> {skill.timeToTarget}
              </div>
              
              <div>
                <h5 className="font-medium text-sm mb-2">Recent Activities:</h5>
                <ul className="text-xs text-gray-600 space-y-1">
                  {skill.recentActivities.map((activity, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      {activity}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Goals & Achievements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Goals */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">🎯 Current Goals</h3>
          <div className="space-y-4">
            {goals.map(goal => (
              <div key={goal.id} className={`border-l-4 rounded-lg p-4 ${getPriorityColor(goal.priority)}`}>
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium">{goal.title}</h4>
                  <span className="text-sm text-gray-500">
                    Due: {format(new Date(goal.dueDate), 'MMM dd')}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mb-3">{goal.description}</p>
                
                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                  <div 
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${goal.progress}%` }}
                  />
                </div>
                
                <div className="text-sm">
                  <span className="font-medium">{goal.progress}% complete</span>
                  <span className="text-gray-500 ml-2">
                    ({goal.milestones.filter(m => m.completed).length}/{goal.milestones.length} milestones)
                  </span>
                </div>
                
                <div className="mt-3">
                  <h5 className="font-medium text-sm mb-2">Milestones:</h5>
                  <div className="space-y-1">
                    {goal.milestones.map(milestone => (
                      <div key={milestone.id} className="flex items-center text-sm">
                        <input 
                          type="checkbox" 
                          checked={milestone.completed}
                          className="mr-2 rounded"
                          readOnly
                        />
                        <span className={milestone.completed ? 'line-through text-gray-500' : ''}>
                          {milestone.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">🏆 Recent Achievements</h3>
          <div className="space-y-3">
            {achievements.map(achievement => (
              <div key={achievement.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                <div className="text-2xl">{achievement.icon}</div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-medium text-sm">{achievement.title}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(achievement.category)}`}>
                      {achievement.category}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>Earned: {format(new Date(achievement.earnedDate), 'MMM dd, yyyy')}</span>
                    <span className="font-medium text-blue-600">+{achievement.points} points</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium text-blue-900">Total Achievement Points</span>
              <span className="text-xl font-bold text-blue-600">
                {achievements.reduce((sum, a) => sum + a.points, 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Mentor Feedback */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4">💬 Mentor Feedback</h3>
        <div className="space-y-4">
          {feedback.map(item => (
            <div key={item.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-medium">{item.mentor}</h4>
                  <p className="text-sm text-gray-600">{item.category}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-1 mb-1">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={`text-sm ${i < Math.floor(item.rating) ? 'text-yellow-400' : 'text-gray-300'}`}>
                        ⭐
                      </span>
                    ))}
                    <span className="text-sm font-medium ml-1">{item.rating}</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {format(new Date(item.date), 'MMM dd, yyyy')}
                  </p>
                </div>
              </div>
              
              <p className="text-sm text-gray-700 mb-3">{item.comment}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h5 className="font-medium text-sm text-green-700 mb-2">Strengths</h5>
                  <div className="flex flex-wrap gap-1">
                    {item.strengths.map(strength => (
                      <span key={strength} className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                        {strength}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h5 className="font-medium text-sm text-orange-700 mb-2">Areas for Improvement</h5>
                  <div className="flex flex-wrap gap-1">
                    {item.improvements.map(improvement => (
                      <span key={improvement} className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs">
                        {improvement}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Insights */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4">🔍 Performance Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">🚀 Top Strength</h4>
            <p className="text-sm text-blue-800">
              Your code quality has consistently been above 90% for the past month. Keep up the excellent work!
            </p>
          </div>
          
          <div className="p-4 bg-yellow-50 rounded-lg">
            <h4 className="font-medium text-yellow-900 mb-2">⚡ Growth Opportunity</h4>
            <p className="text-sm text-yellow-800">
              Focus on improving time estimation. Your tasks often take 20% longer than estimated.
            </p>
          </div>
          
          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">🎯 Next Focus</h4>
            <p className="text-sm text-green-800">
              Consider taking on more complex tasks to challenge yourself and accelerate learning.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}