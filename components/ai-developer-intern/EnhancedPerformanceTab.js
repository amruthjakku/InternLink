'use client';

import { useState, useEffect } from 'react';
import { EnhancedLineChart, EnhancedBarChart, MetricCard, ActivityHeatmap } from '../Charts';
import { format, subDays, eachDayOfInterval, eachWeekOfInterval, startOfWeek, endOfWeek, subWeeks, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';

export function EnhancedPerformanceTab({ user, loading }) {
  const [performanceData, setPerformanceData] = useState({});
  const [gitlabData, setGitlabData] = useState({});
  const [weeklyTaskData, setWeeklyTaskData] = useState([]);
  const [commitActivity, setCommitActivity] = useState([]);
  const [repositoryStats, setRepositoryStats] = useState([]);
  const [skillProgress, setSkillProgress] = useState([]);
  const [timeframe, setTimeframe] = useState('month');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAllPerformanceData();
  }, [timeframe]);

  const fetchAllPerformanceData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchTaskPerformanceData(),
        fetchGitLabData(),
        fetchWeeklyTaskData(),
        fetchSkillProgressData()
      ]);
    } catch (error) {
      console.error('Error fetching performance data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTaskPerformanceData = async () => {
    try {
      const response = await fetch(`/api/analytics/performance?timeframe=${timeframe}`);
      if (response.ok) {
        const data = await response.json();
        setPerformanceData(data.performance || {});
      }
    } catch (error) {
      console.error('Error fetching task performance:', error);
    }
  };

  const fetchGitLabData = async () => {
    try {
      const [commitsRes, reposRes, activityRes] = await Promise.all([
        fetch(`/api/gitlab/commits?days=${timeframe === 'week' ? 7 : timeframe === 'month' ? 30 : 90}`),
        fetch('/api/gitlab/repositories'),
        fetch(`/api/gitlab/unified-activity?days=${timeframe === 'week' ? 7 : timeframe === 'month' ? 30 : 90}`)
      ]);

      if (commitsRes.ok) {
        const commitsData = await commitsRes.json();
        setCommitActivity(commitsData.commits || []);
      }

      if (reposRes.ok) {
        const reposData = await reposRes.json();
        setRepositoryStats(reposData.repositories || []);
      }

      if (activityRes.ok) {
        const activityData = await activityRes.json();
        setGitlabData(activityData || {});
      }
    } catch (error) {
      console.error('Error fetching GitLab data:', error);
    }
  };

  const fetchWeeklyTaskData = async () => {
    try {
      const response = await fetch('/api/analytics/weekly-stats');
      if (response.ok) {
        const data = await response.json();
        setWeeklyTaskData(data.stats || []);
      }
    } catch (error) {
      console.error('Error fetching weekly task data:', error);
    }
  };

  const fetchSkillProgressData = async () => {
    try {
      // Calculate skill progress based on task categories and GitLab activity
      const response = await fetch('/api/tasks');
      if (response.ok) {
        const data = await response.json();
        const tasks = data.tasks || [];
        
        // Group tasks by category to determine skill areas
        const skillCategories = {};
        tasks.forEach(task => {
          const category = task.category || 'General';
          if (!skillCategories[category]) {
            skillCategories[category] = {
              total: 0,
              completed: 0,
              inProgress: 0
            };
          }
          skillCategories[category].total++;
          if (['completed', 'done'].includes(task.status)) {
            skillCategories[category].completed++;
          } else if (task.status === 'in_progress') {
            skillCategories[category].inProgress++;
          }
        });

        // Convert to skill progress format
        const skills = Object.entries(skillCategories).map(([category, stats]) => {
          const completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;
          const currentLevel = Math.min(10, Math.round(completionRate / 10));
          
          return {
            name: category,
            currentLevel,
            targetLevel: 10,
            progress: completionRate,
            icon: getSkillIcon(category),
            recentActivities: tasks
              .filter(task => task.category === category && ['completed', 'done'].includes(task.status))
              .slice(0, 3)
              .map(task => `Completed: ${task.title}`)
          };
        });

        setSkillProgress(skills);
      }
    } catch (error) {
      console.error('Error calculating skill progress:', error);
    }
  };

  const getSkillIcon = (category) => {
    const icons = {
      'Frontend': '🎨',
      'Backend': '⚙️',
      'Database': '🗄️',
      'DevOps': '🚀',
      'Testing': '🧪',
      'Documentation': '📚',
      'General': '💻',
      'API': '🔌',
      'Security': '🔒',
      'Performance': '⚡'
    };
    return icons[category] || '💻';
  };

  // Prepare chart data
  const prepareTaskTrendData = () => {
    if (!performanceData.dailyPerformance) return { labels: [], datasets: [] };

    return {
      labels: performanceData.dailyPerformance.map(d => format(new Date(d.date), 'MMM dd')),
      datasets: [
        {
          label: 'Tasks Completed',
          data: performanceData.dailyPerformance.map(d => d.tasksCompleted),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Performance Score',
          data: performanceData.dailyPerformance.map(d => d.score),
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          fill: true,
          yAxisID: 'y1'
        }
      ]
    };
  };

  const prepareCommitActivityData = () => {
    if (!commitActivity.length) return { labels: [], datasets: [] };

    // Group commits by date
    const commitsByDate = {};
    commitActivity.forEach(commit => {
      const date = format(new Date(commit.committed_date), 'MMM dd');
      commitsByDate[date] = (commitsByDate[date] || 0) + 1;
    });

    const dates = Object.keys(commitsByDate).sort();
    
    return {
      labels: dates,
      datasets: [
        {
          label: 'Commits',
          data: dates.map(date => commitsByDate[date]),
          backgroundColor: 'rgba(34, 197, 94, 0.8)',
          borderColor: 'rgb(34, 197, 94)',
          borderWidth: 1
        }
      ]
    };
  };

  const prepareWeeklyStatsData = () => {
    if (!weeklyTaskData.length) return { labels: [], datasets: [] };

    return {
      labels: weeklyTaskData.map(w => w.week),
      datasets: [
        {
          label: 'Tasks Completed',
          data: weeklyTaskData.map(w => w.tasksCompleted || 0),
          backgroundColor: 'rgba(59, 130, 246, 0.8)'
        },
        {
          label: 'Hours Worked',
          data: weeklyTaskData.map(w => w.hoursWorked || 0),
          backgroundColor: 'rgba(16, 185, 129, 0.8)'
        }
      ]
    };
  };

  const prepareRepositoryContributionData = () => {
    if (!repositoryStats.length) return { labels: [], datasets: [] };

    const repoNames = repositoryStats.map(repo => repo.name || 'Unknown');
    const commitCounts = repositoryStats.map(repo => repo.commit_count || 0);

    return {
      labels: repoNames,
      datasets: [
        {
          label: 'Commits per Repository',
          data: commitCounts,
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(139, 92, 246, 0.8)',
            'rgba(236, 72, 153, 0.8)'
          ],
          borderWidth: 1
        }
      ]
    };
  };

  const prepareSkillRadarData = () => {
    if (!skillProgress.length) return { labels: [], datasets: [] };

    return {
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
        }
      ]
    };
  };

  // Prepare activity heatmap data
  const prepareActivityHeatmapData = () => {
    const heatmapData = [];
    const startDate = subDays(new Date(), 365); // Last year
    const dateRange = eachDayOfInterval({ start: startDate, end: new Date() });

    dateRange.forEach(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      
      // Count commits for this date
      const commitsOnDate = commitActivity.filter(commit => 
        format(new Date(commit.committed_date), 'yyyy-MM-dd') === dateStr
      ).length;

      // Count tasks completed on this date
      const tasksOnDate = performanceData.dailyPerformance?.find(day => 
        format(new Date(day.date), 'yyyy-MM-dd') === dateStr
      )?.tasksCompleted || 0;

      const totalActivity = commitsOnDate + tasksOnDate;

      heatmapData.push({
        date: dateStr,
        count: totalActivity,
        level: totalActivity === 0 ? 0 : totalActivity <= 2 ? 1 : totalActivity <= 5 ? 2 : totalActivity <= 10 ? 3 : 4
      });
    });

    return heatmapData;
  };

  if (loading || isLoading) {
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

  const taskTrendData = prepareTaskTrendData();
  const commitActivityData = prepareCommitActivityData();
  const weeklyStatsData = prepareWeeklyStatsData();
  const repositoryData = prepareRepositoryContributionData();
  const skillRadarData = prepareSkillRadarData();
  const activityHeatmapData = prepareActivityHeatmapData();

  return (
    <div className="space-y-6">
      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Task Completion Rate"
          value={`${performanceData.totalTasks > 0 ? Math.round((performanceData.completedTasks / performanceData.totalTasks) * 100) : 0}%`}
          change={performanceData.improvement || 0}
          icon="✅"
          color="green"
        />
        <MetricCard
          title="Code Commits"
          value={commitActivity.length}
          change={gitlabData.commitTrend || 0}
          icon="💻"
          color="blue"
        />
        <MetricCard
          title="Repositories"
          value={repositoryStats.length}
          change={0}
          icon="📁"
          color="purple"
        />
        <MetricCard
          title="Performance Score"
          value={`${performanceData.currentScore || 0}%`}
          change={performanceData.improvement || 0}
          icon="📊"
          color="orange"
        />
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Tasks/Week</p>
              <p className="text-2xl font-bold text-blue-600">
                {weeklyTaskData.length > 0 ? 
                  Math.round(weeklyTaskData.reduce((sum, w) => sum + (w.tasksCompleted || 0), 0) / weeklyTaskData.length) : 0
                }
              </p>
            </div>
            <div className="text-2xl">📈</div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Commits/Week</p>
              <p className="text-2xl font-bold text-green-600">
                {Math.round(commitActivity.length / Math.max(1, Math.ceil((new Date() - subWeeks(new Date(), 4)) / (7 * 24 * 60 * 60 * 1000))))}
              </p>
            </div>
            <div className="text-2xl">🔥</div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">On-Time Delivery</p>
              <p className="text-2xl font-bold text-purple-600">{performanceData.onTimeDelivery || 0}%</p>
            </div>
            <div className="text-2xl">⏰</div>
          </div>
        </div>
      </div>

      {/* Activity Heatmap */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4">🔥 Activity Heatmap (Last Year)</h3>
        <ActivityHeatmap data={activityHeatmapData} />
        <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
          <span>Less</span>
          <div className="flex space-x-1">
            <div className="w-3 h-3 bg-gray-100 rounded-sm"></div>
            <div className="w-3 h-3 bg-green-200 rounded-sm"></div>
            <div className="w-3 h-3 bg-green-400 rounded-sm"></div>
            <div className="w-3 h-3 bg-green-600 rounded-sm"></div>
            <div className="w-3 h-3 bg-green-800 rounded-sm"></div>
          </div>
          <span>More</span>
        </div>
      </div>

      {/* Performance Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">📈 Task Performance Trends</h3>
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
            data={taskTrendData} 
            height={250}
            options={{
              scales: {
                y: {
                  type: 'linear',
                  display: true,
                  position: 'left',
                  title: { display: true, text: 'Tasks Completed' }
                },
                y1: {
                  type: 'linear',
                  display: true,
                  position: 'right',
                  title: { display: true, text: 'Performance Score' },
                  grid: { drawOnChartArea: false }
                }
              }
            }}
          />
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">💻 Commit Activity</h3>
          <EnhancedBarChart data={commitActivityData} height={250} />
        </div>
      </div>

      {/* Weekly Statistics */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4">📊 Weekly Task Statistics</h3>
        <EnhancedBarChart data={weeklyStatsData} height={300} />
      </div>

      {/* Repository Contributions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">📁 Repository Contributions</h3>
          <EnhancedBarChart data={repositoryData} height={250} />
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">🎯 Skills Progress</h3>
          <div className="space-y-4">
            {skillProgress.slice(0, 5).map(skill => (
              <div key={skill.name} className="flex items-center space-x-4">
                <span className="text-2xl">{skill.icon}</span>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">{skill.name}</span>
                    <span className="text-xs text-gray-600">Level {skill.currentLevel}/10</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${skill.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* GitLab Integration Status */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4">🔗 GitLab Integration</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="font-medium text-green-900">Connected</span>
            </div>
            <p className="text-sm text-green-800">
              GitLab integration is active and syncing data
            </p>
          </div>
          
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">📊 Recent Activity</h4>
            <div className="space-y-1 text-sm text-blue-800">
              <div>Commits: {commitActivity.length}</div>
              <div>Repositories: {repositoryStats.length}</div>
              <div>Last sync: {gitlabData.lastSync ? format(new Date(gitlabData.lastSync), 'MMM dd, HH:mm') : 'Never'}</div>
            </div>
          </div>
          
          <div className="p-4 bg-purple-50 rounded-lg">
            <h4 className="font-medium text-purple-900 mb-2">🏆 Achievements</h4>
            <div className="space-y-1 text-sm text-purple-800">
              <div>Total commits: {gitlabData.totalCommits || commitActivity.length}</div>
              <div>Active repos: {repositoryStats.filter(repo => repo.last_activity_at && 
                new Date(repo.last_activity_at) > subDays(new Date(), 30)).length}</div>
              <div>Contribution streak: {gitlabData.streak || 0} days</div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Repository Stats */}
      {repositoryStats.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">📁 Repository Details</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Repository
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Language
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Commits
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Activity
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {repositoryStats.slice(0, 10).map((repo, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">
                          {repo.name || 'Unknown'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {repo.default_branch || 'main'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {repo.commit_count || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {repo.last_activity_at ? format(new Date(repo.last_activity_at), 'MMM dd, yyyy') : 'Never'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Performance Insights */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-4">🔍 Performance Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">🚀 Productivity</h4>
            <p className="text-sm text-blue-800">
              {performanceData.currentScore > 80 
                ? "Excellent productivity! You're consistently completing tasks on time."
                : performanceData.currentScore > 60
                ? "Good productivity. Consider optimizing your workflow for better efficiency."
                : "Focus on completing current tasks before taking on new ones."
              }
            </p>
          </div>
          
          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">💻 Code Activity</h4>
            <p className="text-sm text-green-800">
              {commitActivity.length > 20 
                ? "Great coding activity! You're making regular commits."
                : commitActivity.length > 10
                ? "Good commit frequency. Try to maintain consistent daily commits."
                : "Increase your coding activity. Aim for daily commits to build momentum."
              }
            </p>
          </div>
          
          <div className="p-4 bg-purple-50 rounded-lg">
            <h4 className="font-medium text-purple-900 mb-2">🎯 Growth Areas</h4>
            <p className="text-sm text-purple-800">
              {skillProgress.length > 0 
                ? `Focus on improving ${skillProgress.filter(s => s.currentLevel < 7)[0]?.name || 'advanced skills'} to accelerate your learning.`
                : "Complete more tasks to identify your skill development areas."
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}