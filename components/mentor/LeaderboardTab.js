'use client';

import { useState, useEffect } from 'react';
import { mockData } from '../../utils/mockData';

export function LeaderboardTab() {
  const [interns, setInterns] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('all-time');
  const [selectedMetric, setSelectedMetric] = useState('performance');

  useEffect(() => {
    setInterns(mockData.interns);
    setColleges(mockData.colleges);
    setCategories(mockData.categories);
  }, []);

  const getLeaderboardData = () => {
    let sortedInterns = [...interns];
    
    switch (selectedMetric) {
      case 'performance':
        sortedInterns.sort((a, b) => b.performance_score - a.performance_score);
        break;
      case 'completion':
        sortedInterns.sort((a, b) => b.completion_rate - a.completion_rate);
        break;
      case 'commits':
        sortedInterns.sort((a, b) => b.total_commits - a.total_commits);
        break;
      case 'attendance':
        sortedInterns.sort((a, b) => b.attendance_rate - a.attendance_rate);
        break;
      default:
        sortedInterns.sort((a, b) => b.performance_score - a.performance_score);
    }
    
    return sortedInterns;
  };

  const getMetricValue = (intern, metric) => {
    switch (metric) {
      case 'performance':
        return intern.performance_score.toFixed(1);
      case 'completion':
        return intern.completion_rate.toFixed(1) + '%';
      case 'commits':
        return intern.total_commits;
      case 'attendance':
        return intern.attendance_rate.toFixed(1) + '%';
      default:
        return intern.performance_score.toFixed(1);
    }
  };

  const getMetricLabel = (metric) => {
    switch (metric) {
      case 'performance':
        return 'Performance Score';
      case 'completion':
        return 'Task Completion';
      case 'commits':
        return 'GitLab Commits';
      case 'attendance':
        return 'Attendance Rate';
      default:
        return 'Performance Score';
    }
  };

  const InternLeaderboard = () => {
    const leaderboardData = getLeaderboardData();

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Intern Leaderboard</h3>
          <div className="flex space-x-3">
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="performance">Performance Score</option>
              <option value="completion">Task Completion</option>
              <option value="commits">GitLab Commits</option>
              <option value="attendance">Attendance Rate</option>
            </select>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="all-time">All Time</option>
              <option value="this-month">This Month</option>
              <option value="this-week">This Week</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {leaderboardData.map((intern, index) => (
            <div
              key={intern.id}
              className={`p-4 rounded-lg border transition-all duration-200 ${
                index === 0 ? 'border-yellow-200 bg-yellow-50' :
                index === 1 ? 'border-gray-300 bg-gray-50' :
                index === 2 ? 'border-orange-200 bg-orange-50' :
                'border-gray-200 bg-white hover:shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {index === 0 ? (
                      <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xl">🥇</span>
                      </div>
                    ) : index === 1 ? (
                      <div className="w-12 h-12 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xl">🥈</span>
                      </div>
                    ) : index === 2 ? (
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xl">🥉</span>
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-lg font-bold">{index + 1}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">{intern.name}</h4>
                    <p className="text-sm text-gray-600">{intern.college_name}</p>
                    <p className="text-xs text-gray-500">{intern.cohort_name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">
                    {getMetricValue(intern, selectedMetric)}
                  </div>
                  <div className="text-sm text-gray-500">{getMetricLabel(selectedMetric)}</div>
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-medium text-gray-900">{intern.completed_tasks}</div>
                  <div className="text-gray-500">Tasks Done</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-gray-900">{intern.completion_rate.toFixed(1)}%</div>
                  <div className="text-gray-500">Completion</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-gray-900">{intern.total_commits}</div>
                  <div className="text-gray-500">Commits</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-gray-900">{intern.attendance_rate.toFixed(1)}%</div>
                  <div className="text-gray-500">Attendance</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const CollegeRankings = () => {
    const collegeStats = colleges.map(college => {
      const collegeInterns = interns.filter(intern => intern.college_id === college.id);
      const avgPerformance = collegeInterns.length > 0 
        ? collegeInterns.reduce((sum, intern) => sum + intern.performance_score, 0) / collegeInterns.length 
        : 0;
      const totalTasks = collegeInterns.reduce((sum, intern) => sum + intern.total_tasks, 0);
      const completedTasks = collegeInterns.reduce((sum, intern) => sum + intern.completed_tasks, 0);
      const avgCompletion = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      return {
        ...college,
        avgPerformance,
        avgCompletion,
        totalInterns: collegeInterns.length,
        activeInterns: collegeInterns.filter(intern => intern.status === 'active').length
      };
    }).sort((a, b) => b.avgPerformance - a.avgPerformance);

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">College Rankings</h3>
        
        <div className="space-y-4">
          {collegeStats.map((college, index) => (
            <div
              key={college.id}
              className={`p-4 rounded-lg border ${
                index === 0 ? 'border-yellow-200 bg-yellow-50' :
                index === 1 ? 'border-gray-300 bg-gray-50' :
                index === 2 ? 'border-orange-200 bg-orange-50' :
                'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : 
                     <span className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
                       {index + 1}
                     </span>
                    }
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-gray-900">{college.name}</h4>
                    <p className="text-sm text-gray-600">{college.location}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">{college.avgPerformance.toFixed(1)}</div>
                  <div className="text-sm text-gray-500">Avg Performance</div>
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-medium text-gray-900">{college.totalInterns}</div>
                  <div className="text-gray-500">Total Interns</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-gray-900">{college.activeInterns}</div>
                  <div className="text-gray-500">Active Interns</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-gray-900">{college.avgCompletion.toFixed(1)}%</div>
                  <div className="text-gray-500">Avg Completion</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-gray-900">
                    {((college.activeInterns / college.totalInterns) * 100 || 0).toFixed(1)}%
                  </div>
                  <div className="text-gray-500">Active Rate</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const AchievementBadges = () => {
    const achievements = [
      {
        id: 1,
        title: "Perfect Attendance",
        description: "100% attendance for the month",
        icon: "🎯",
        color: "bg-green-100 text-green-800",
        recipients: interns.filter(intern => intern.attendance_rate >= 98).length
      },
      {
        id: 2,
        title: "Task Master",
        description: "Completed all assigned tasks",
        icon: "✅",
        color: "bg-blue-100 text-blue-800",
        recipients: interns.filter(intern => intern.completion_rate >= 95).length
      },
      {
        id: 3,
        title: "Code Warrior",
        description: "Most GitLab commits this week",
        icon: "💻",
        color: "bg-purple-100 text-purple-800",
        recipients: 1
      },
      {
        id: 4,
        title: "Rising Star",
        description: "Highest performance improvement",
        icon: "⭐",
        color: "bg-yellow-100 text-yellow-800",
        recipients: 1
      },
      {
        id: 5,
        title: "Team Player",
        description: "Most helpful to peers",
        icon: "🤝",
        color: "bg-pink-100 text-pink-800",
        recipients: 2
      },
      {
        id: 6,
        title: "Innovation Award",
        description: "Most creative solution",
        icon: "💡",
        color: "bg-orange-100 text-orange-800",
        recipients: 1
      }
    ];

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Achievement Badges</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map(achievement => (
            <div key={achievement.id} className="border border-gray-200 rounded-lg p-4 text-center">
              <div className="text-3xl mb-2">{achievement.icon}</div>
              <h4 className="font-medium text-gray-900 mb-1">{achievement.title}</h4>
              <p className="text-sm text-gray-600 mb-3">{achievement.description}</p>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${achievement.color}`}>
                {achievement.recipients} recipient{achievement.recipients !== 1 ? 's' : ''}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const PerformanceInsights = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance Insights</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-4">Top Performers This Month</h4>
          <div className="space-y-3">
            {getLeaderboardData().slice(0, 5).map((intern, index) => (
              <div key={intern.id} className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {intern.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-900">{intern.name}</span>
                    <span className="text-gray-500">{intern.performance_score.toFixed(1)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                    <div
                      className="h-1.5 bg-blue-500 rounded-full"
                      style={{ width: `${intern.performance_score}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-4">Improvement Opportunities</h4>
          <div className="space-y-3">
            {getLeaderboardData().slice(-5).reverse().map((intern, index) => (
              <div key={intern.id} className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {intern.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-900">{intern.name}</span>
                    <span className="text-gray-500">{intern.performance_score.toFixed(1)}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Needs support in task completion
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <InternLeaderboard />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CollegeRankings />
        <PerformanceInsights />
      </div>
      <AchievementBadges />
    </div>
  );
}