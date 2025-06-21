'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

/**
 * Team Activity Component for Mentor Dashboard
 * Shows team development activity and individual intern progress
 */
export default function TeamActivity({ demoMode = false }) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({});
  const [internActivity, setInternActivity] = useState([]);
  const [dailyTrend, setDailyTrend] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (demoMode) {
      loadDemoData();
    } else {
      fetchTeamActivity();
    }
  }, [demoMode, selectedPeriod]);

  const loadDemoData = () => {
    setAnalytics({
      totalCommits: 156,
      activeInterns: 8,
      openIssues: 23,
      mergeRequests: 12,
      totalAdditions: 8947,
      totalDeletions: 3421,
      activeProjects: 12
    });

    setInternActivity([
      {
        id: 'intern1',
        name: 'Alice Johnson',
        email: 'alice@demo.com',
        gitlabUsername: 'alice_dev',
        avatarUrl: 'https://via.placeholder.com/40',
        recentActivity: {
          commits: 23,
          issues: 5,
          mergeRequests: 3,
          totalAdditions: 1456,
          totalDeletions: 623,
          activeProjects: 2
        },
        lastActiveAt: '2 hours ago',
        progressPercentage: 85,
        status: 'active'
      },
      {
        id: 'intern2',
        name: 'Bob Smith',
        email: 'bob@demo.com',
        gitlabUsername: 'bob_codes',
        avatarUrl: 'https://via.placeholder.com/40',
        recentActivity: {
          commits: 18,
          issues: 4,
          mergeRequests: 2,
          totalAdditions: 892,
          totalDeletions: 345,
          activeProjects: 1
        },
        lastActiveAt: '1 day ago',
        progressPercentage: 72,
        status: 'active'
      },
      {
        id: 'intern3',
        name: 'Carol Davis',
        email: 'carol@demo.com',
        gitlabUsername: 'carol_dev',
        avatarUrl: 'https://via.placeholder.com/40',
        recentActivity: {
          commits: 15,
          issues: 6,
          mergeRequests: 4,
          totalAdditions: 1123,
          totalDeletions: 567,
          activeProjects: 3
        },
        lastActiveAt: '3 hours ago',
        progressPercentage: 78,
        status: 'active'
      },
      {
        id: 'intern4',
        name: 'David Wilson',
        email: 'david@demo.com',
        gitlabUsername: 'david_builds',
        avatarUrl: 'https://via.placeholder.com/40',
        recentActivity: {
          commits: 12,
          issues: 3,
          mergeRequests: 1,
          totalAdditions: 678,
          totalDeletions: 234,
          activeProjects: 1
        },
        lastActiveAt: '2 days ago',
        progressPercentage: 65,
        status: 'active'
      },
      {
        id: 'intern5',
        name: 'Eva Martinez',
        email: 'eva@demo.com',
        gitlabUsername: 'eva_creates',
        avatarUrl: 'https://via.placeholder.com/40',
        recentActivity: {
          commits: 8,
          issues: 2,
          mergeRequests: 1,
          totalAdditions: 445,
          totalDeletions: 123,
          activeProjects: 1
        },
        lastActiveAt: '5 days ago',
        progressPercentage: 45,
        status: 'inactive'
      }
    ]);

    setDailyTrend([
      { date: '2024-01-15', commits: 12, issues: 3, mergeRequests: 2 },
      { date: '2024-01-16', commits: 15, issues: 4, mergeRequests: 1 },
      { date: '2024-01-17', commits: 18, issues: 2, mergeRequests: 3 },
      { date: '2024-01-18', commits: 14, issues: 5, mergeRequests: 2 },
      { date: '2024-01-19', commits: 20, issues: 3, mergeRequests: 4 }
    ]);

    setLoading(false);
  };

  const fetchTeamActivity = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/mentors/team-activity?period=${selectedPeriod}`);
      const data = await response.json();

      if (response.ok) {
        setAnalytics(data.analytics);
        setInternActivity(data.internActivity);
        setDailyTrend(data.dailyTrend);
        setError(null);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error fetching team activity:', error);
      setError('Failed to fetch team activity');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Team Analytics Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Team Development Activity</h3>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>

        {/* Team Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {analytics.totalCommits || 0}
            </div>
            <div className="text-sm text-gray-600">Total Commits</div>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {analytics.activeInterns || 0}
            </div>
            <div className="text-sm text-gray-600">Active Interns</div>
          </div>
          
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {analytics.openIssues || 0}
            </div>
            <div className="text-sm text-gray-600">Open Issues</div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {analytics.mergeRequests || 0}
            </div>
            <div className="text-sm text-gray-600">Pending MRs</div>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-semibold text-gray-700">
              {analytics.totalAdditions || 0}
            </div>
            <div className="text-xs text-gray-600">Lines Added</div>
          </div>
          
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-semibold text-gray-700">
              {analytics.totalDeletions || 0}
            </div>
            <div className="text-xs text-gray-600">Lines Removed</div>
          </div>
          
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-semibold text-gray-700">
              {analytics.activeProjects || 0}
            </div>
            <div className="text-xs text-gray-600">Active Projects</div>
          </div>
        </div>
      </div>

      {/* Individual Intern Progress */}
      <div className="bg-white rounded-lg shadow p-6">
        <h4 className="font-medium mb-4 text-gray-900">Individual Intern Progress</h4>
        
        {internActivity.length > 0 ? (
          <div className="space-y-4">
            {internActivity.map((intern) => (
              <div key={intern.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <img 
                      src={intern.avatarUrl} 
                      alt={intern.name}
                      className="w-12 h-12 rounded-full"
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <h5 className="font-medium text-gray-900">{intern.name}</h5>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(intern.status)}`}>
                          {intern.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">@{intern.gitlabUsername}</p>
                      <p className="text-xs text-gray-400">Last active: {intern.lastActiveAt}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                      <span className="flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                        {intern.recentActivity.commits} commits
                      </span>
                      <span className="flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                        {intern.recentActivity.issues} issues
                      </span>
                      <span className="flex items-center">
                        <span className="w-2 h-2 bg-purple-500 rounded-full mr-1"></span>
                        {intern.recentActivity.mergeRequests} MRs
                      </span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${getProgressColor(intern.progressPercentage)}`}
                          style={{ width: `${intern.progressPercentage}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500">{intern.progressPercentage}%</span>
                    </div>
                  </div>
                </div>
                
                {/* Detailed Activity */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Lines Added:</span>
                      <span className="ml-1 font-medium text-green-600">
                        +{intern.recentActivity.totalAdditions}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Lines Removed:</span>
                      <span className="ml-1 font-medium text-red-600">
                        -{intern.recentActivity.totalDeletions}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Projects:</span>
                      <span className="ml-1 font-medium">{intern.recentActivity.activeProjects}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Net Change:</span>
                      <span className="ml-1 font-medium">
                        {intern.recentActivity.totalAdditions - intern.recentActivity.totalDeletions > 0 ? '+' : ''}
                        {intern.recentActivity.totalAdditions - intern.recentActivity.totalDeletions}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p>No intern activity found</p>
            <p className="text-sm">Interns will appear here once they connect their GitLab accounts</p>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}