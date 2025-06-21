import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route.js';
import { getUserByGitLabId, getCohortsByMentor, connectToDatabase } from '../../../../utils/database.js';
import ActivityTracking from '../../../../models/ActivityTracking.js';
import GitLabIntegration from '../../../../models/GitLabIntegration.js';

/**
 * GET /api/mentors/team-activity
 * Get team activity overview for mentors
 */
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Connect to database
    await connectToDatabase();

    // Verify user is a mentor
    const user = await getUserByGitLabId(session.user.gitlabId);
    if (!user || user.role !== 'mentor') {
      return NextResponse.json({ error: 'Access denied - Mentor role required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';
    const cohortId = searchParams.get('cohortId');

    // Calculate date range
    const now = new Date();
    const periodDays = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    };
    
    const days = periodDays[period] || 30;
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // Get mentor's cohorts
    const cohorts = await getCohortsByMentor(user._id);
    const cohortIds = cohortId ? [cohortId] : cohorts.map(c => c._id);

    if (cohorts.length === 0) {
      return NextResponse.json({
        analytics: {
          totalCommits: 0,
          activeInterns: 0,
          openIssues: 0,
          mergeRequests: 0
        },
        internActivity: [],
        cohorts: []
      });
    }

    // Get all interns in mentor's cohorts
    // This would need to be implemented based on your user-cohort relationship
    // For now, we'll get all GitLab integrations and filter by activity
    const allIntegrations = await GitLabIntegration.find({ 
      isActive: true 
    }).populate('userId');

    // Get team activity data
    const teamActivity = await ActivityTracking.aggregate([
      {
        $match: {
          activityCreatedAt: { $gte: startDate },
          userId: { $in: allIntegrations.map(i => i.userId) }
        }
      },
      {
        $group: {
          _id: '$userId',
          commits: { $sum: { $cond: [{ $eq: ['$type', 'commit'] }, 1, 0] } },
          issues: { $sum: { $cond: [{ $eq: ['$type', 'issue'] }, 1, 0] } },
          mergeRequests: { $sum: { $cond: [{ $eq: ['$type', 'merge_request'] }, 1, 0] } },
          totalAdditions: { $sum: '$metadata.additions' },
          totalDeletions: { $sum: '$metadata.deletions' },
          lastActivity: { $max: '$activityCreatedAt' },
          projects: { $addToSet: '$projectName' }
        }
      }
    ]);

    // Get overall team analytics
    const teamAnalytics = await ActivityTracking.aggregate([
      {
        $match: {
          activityCreatedAt: { $gte: startDate },
          userId: { $in: allIntegrations.map(i => i.userId) }
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userId' }
        }
      }
    ]);

    // Format intern activity data
    const internActivity = await Promise.all(
      teamActivity.map(async (activity) => {
        const integration = allIntegrations.find(i => 
          i.userId.toString() === activity._id.toString()
        );
        
        if (!integration) return null;

        // Calculate progress percentage (this is a simple example)
        const progressPercentage = Math.min(
          Math.round((activity.commits * 10 + activity.issues * 15 + activity.mergeRequests * 20) / 10),
          100
        );

        return {
          id: activity._id,
          name: integration.userId.name || integration.gitlabUsername,
          email: integration.gitlabEmail,
          gitlabUsername: integration.gitlabUsername,
          avatarUrl: integration.userId.avatarUrl || `https://gitlab.com/${integration.gitlabUsername}.png`,
          recentActivity: {
            commits: activity.commits,
            issues: activity.issues,
            mergeRequests: activity.mergeRequests,
            totalAdditions: activity.totalAdditions,
            totalDeletions: activity.totalDeletions,
            activeProjects: activity.projects.length
          },
          lastActiveAt: activity.lastActivity ? 
            new Date(activity.lastActivity).toLocaleDateString() : 'Never',
          progressPercentage,
          status: activity.lastActivity > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) ? 
            'active' : 'inactive'
        };
      })
    );

    // Filter out null values and sort by activity
    const validInternActivity = internActivity
      .filter(intern => intern !== null)
      .sort((a, b) => b.recentActivity.commits - a.recentActivity.commits);

    // Calculate team analytics summary
    const analytics = {
      totalCommits: teamAnalytics.find(t => t._id === 'commit')?.count || 0,
      activeInterns: teamAnalytics.find(t => t._id === 'commit')?.uniqueUsers.length || 0,
      openIssues: teamAnalytics.find(t => t._id === 'issue')?.count || 0,
      mergeRequests: teamAnalytics.find(t => t._id === 'merge_request')?.count || 0,
      totalAdditions: teamActivity.reduce((sum, a) => sum + (a.totalAdditions || 0), 0),
      totalDeletions: teamActivity.reduce((sum, a) => sum + (a.totalDeletions || 0), 0),
      activeProjects: [...new Set(teamActivity.flatMap(a => a.projects))].length
    };

    // Get daily activity trend
    const dailyTrend = await ActivityTracking.aggregate([
      {
        $match: {
          activityCreatedAt: { $gte: startDate },
          userId: { $in: allIntegrations.map(i => i.userId) }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$activityCreatedAt' } },
            type: '$type'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    return NextResponse.json({
      analytics,
      internActivity: validInternActivity,
      cohorts: cohorts.map(c => ({
        id: c._id,
        name: c.name,
        description: c.description,
        internCount: c.currentInterns || 0
      })),
      dailyTrend,
      period: {
        type: period,
        startDate: startDate.toISOString(),
        endDate: now.toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching team activity:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch team activity',
      details: error.message 
    }, { status: 500 });
  }
}