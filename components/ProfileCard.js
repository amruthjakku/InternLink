'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { CollegeLogo } from './CollegeLogo';
import { getCohortName } from '../utils/helpers';

export function ProfileCard({ user, showMilestones = true, compact = false }) {
  const [milestones, setMilestones] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfileData();
    }
  }, [user]);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      const [milestonesRes, statsRes] = await Promise.all([
        fetch('/api/profile/milestones'),
        fetch('/api/profile/stats')
      ]);

      if (milestonesRes.ok) {
        const milestonesData = await milestonesRes.json();
        setMilestones(milestonesData.milestones || []);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats || {});
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return '👑';
      case 'POC':
        return '🌟';
      case 'Tech Lead':
        return '👨‍🏫';
      case 'AI developer Intern':
        return '🎓';
      default:
        return '👤';
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'POC':
        return 'bg-yellow-100 text-yellow-800';
      case 'Tech Lead':
        return 'bg-blue-100 text-blue-800';
      case 'AI developer Intern':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatJoinDate = (dateString) => {
    if (!dateString) return 'Recently joined';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `${diffDays} days ago`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months > 1 ? 's' : ''} ago`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `${years} year${years > 1 ? 's' : ''} ago`;
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-100 ${compact ? 'p-4' : 'p-6'}`}>
        <div className="animate-pulse">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center space-x-3">
          {user?.gitlabAvatarUrl ? (
            <img
              src={user.gitlabAvatarUrl}
              alt={user?.gitlabUsername || user?.name || 'User'}
              className="w-12 h-12 rounded-full object-cover border border-gray-200"
            />
          ) : (
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
              {user?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-semibold text-gray-900 truncate">
                {user?.name || 'Unknown User'}
              </h3>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user?.role)}`}>
                <span className="mr-1">{getRoleIcon(user?.role)}</span>
                {user?.role || 'Unknown'}
              </span>
            </div>
            <p className="text-xs text-gray-500 truncate">
              {user?.gitlabUsername ? (
                <>
                  🦊 <a href={user?.gitlabProfileUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">@{user.gitlabUsername}</a>
                </>
              ) : (
                '@unknown'
              )}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      {/* Header */}
      <div className="flex items-start space-x-4 mb-6">
        {user?.gitlabAvatarUrl ? (
          <img
            src={user.gitlabAvatarUrl}
            alt={user?.gitlabUsername || user?.name || 'User'}
            className="w-16 h-16 rounded-full object-cover border border-gray-200"
          />
        ) : (
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {user?.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3 mb-2">
            <h2 className="text-xl font-bold text-gray-900 truncate">
              {user?.name || 'Unknown User'}
            </h2>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${getRoleBadgeColor(user?.role)}`}>
              <span className="mr-1">{getRoleIcon(user?.role)}</span>
              {user?.role || 'Unknown'}
            </span>
          </div>
          <div className="space-y-1 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <span>🦊</span>
              {user?.gitlabUsername ? (
                <a href={user?.gitlabProfileUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">@{user.gitlabUsername}</a>
              ) : (
                <span>@unknown</span>
              )}
            </div>
            {(user?.gitlabEmail || user?.email) && (
              <div className="flex items-center space-x-2">
                <span>📧</span>
                <span className="truncate">{user.gitlabEmail || user.email}</span>
              </div>
            )}
            {user?.college && (
              <div>
                <CollegeLogo 
                  college={user.college} 
                  size="sm" 
                  showName={true}
                  className="py-1"
                />
                {user?.role === 'admin' && (
                  <div className="mt-1 ml-7 text-xs text-gray-500 italic">
                    Associated for oversight and coordination
                  </div>
                )}
              </div>
            )}
            {user?.cohortId && (
              <div className="flex items-center space-x-2">
                <span>👥</span>
                <span>Cohort: {getCohortName(user.cohortName || user.cohortId)}</span>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <span>📅</span>
              <span>Joined {formatJoinDate(user?.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mb-6">
        {user?.role === 'admin' && (
          <div className="mb-3 text-xs text-gray-600 flex items-center gap-2">
            <span>📊</span>
            <span>Your activity metrics demonstrate system engagement and leadership</span>
          </div>
        )}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {stats.repositoriesContributed || 0}
            </div>
            <div className="text-xs text-gray-500">Repositories</div>
            {user?.role === 'admin' && (
              <div className="text-xs text-blue-600 mt-1">System repos</div>
            )}
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {stats.commitCount || 0}
            </div>
            <div className="text-xs text-gray-500">Total Commits</div>
            {user?.role === 'admin' && (
              <div className="text-xs text-green-600 mt-1">Platform updates</div>
            )}
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {stats.currentStreak || 0}
            </div>
            <div className="text-xs text-gray-500">Day Streak</div>
            {user?.role === 'admin' && (
              <div className="text-xs text-purple-600 mt-1">Consistency</div>
            )}
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {stats.attendanceRate || 0}%
            </div>
            <div className="text-xs text-gray-500">Attendance</div>
            {user?.role === 'admin' && (
              <div className="text-xs text-orange-600 mt-1">Leadership presence</div>
            )}
          </div>
        </div>
      </div>

      {/* Task Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-900">Task Progress</h3>
          <button 
            onClick={fetchProfileData}
            disabled={loading}
            className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        {/* Admin context explanation */}
        {user?.role === 'admin' && (
          <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <span className="text-amber-600">💡</span>
              <div className="text-xs text-amber-700">
                <p className="font-medium mb-1">Why Tasks Matter for Admins:</p>
                <ul className="space-y-1 ml-2">
                  <li>• Monitor system health through task completion rates</li>
                  <li>• Identify bottlenecks in the learning process</li>
                  <li>• Ensure cohorts are progressing as expected</li>
                  <li>• Lead by example - complete admin-specific tasks</li>
                </ul>
              </div>
            </div>
          </div>
        )}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-xl font-bold text-green-600">
              {stats.tasksCompleted || 0}
            </div>
            <div className="text-xs text-gray-500">Completed</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="text-xl font-bold text-yellow-600">
              {stats.tasksInProgress || 0}
            </div>
            <div className="text-xs text-gray-500">In Progress</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-xl font-bold text-gray-600">
              {stats.totalTasks || 0}
            </div>
            <div className="text-xs text-gray-500">Total Tasks</div>
          </div>
        </div>
        {stats.totalTasks > 0 && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Completion Rate</span>
              <span>{stats.averageTaskCompletion || 0}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${stats.averageTaskCompletion || 0}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Points Breakdown */}
      {(stats.pointsEarned > 0 || stats.taskPoints > 0) && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Points Earned</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-indigo-50 rounded-lg">
              <div className="text-xl font-bold text-indigo-600">
                {stats.taskPoints || 0}
              </div>
              <div className="text-xs text-gray-500">Task Points</div>
            </div>
            <div className="text-center p-3 bg-pink-50 rounded-lg">
              <div className="text-xl font-bold text-pink-600">
                {stats.bonusPoints || 0}
              </div>
              <div className="text-xs text-gray-500">Bonus Points</div>
            </div>
          </div>
          <div className="mt-3 text-center p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200">
            <div className="text-2xl font-bold text-blue-600">
              {stats.pointsEarned || 0}
            </div>
            <div className="text-xs text-gray-500">Total Points</div>
          </div>
        </div>
      )}

      {/* Milestones */}
      {showMilestones && milestones.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <span className="mr-2">🏆</span>
            Recent Achievements
          </h3>
          <div className="space-y-3">
            {milestones.slice(0, 3).map((milestone, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl">{milestone.icon}</div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {milestone.title}
                  </div>
                  <div className="text-xs text-gray-500">
                    {milestone.description}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(milestone.achievedAt).toLocaleDateString()}
                  </div>
                </div>
                {milestone.points && (
                  <div className="text-sm font-bold text-blue-600">
                    +{milestone.points}
                  </div>
                )}
              </div>
            ))}
          </div>
          {milestones.length > 3 && (
            <div className="text-center mt-3">
              <button className="text-sm text-blue-600 hover:text-blue-800">
                View all {milestones.length} achievements →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Introduction/Bio */}
      {user?.bio && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-2">About</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            {user.bio}
          </p>
        </div>
      )}
    </div>
  );
}