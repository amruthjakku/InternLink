import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route.js';
import { connectToDatabase } from '../../../../utils/database.js';
import { decrypt } from '../../../../utils/encryption.js';
import GitLabIntegration from '../../../../models/GitLabIntegration.js';
import ActivityTracking from '../../../../models/ActivityTracking.js';
import { getUserCommitActivity, generateCommitAnalytics } from '../../../../utils/gitlab-api.js';

export const dynamic = 'force-dynamic';

/**
 * GET /api/gitlab/intern-analytics
 * Get comprehensive GitLab analytics for intern progress tracking
 */
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Get GitLab integration
    const integration = await GitLabIntegration.findOne({ 
      userId: session.user.id,
      isActive: true 
    });

    if (!integration) {
      return NextResponse.json({ 
        error: 'GitLab not connected',
        connected: false 
      }, { status: 400 });
    }

    // Get access token (try OAuth token from session first, then stored token)
    let accessToken;
    if (session.gitlabAccessToken && integration.tokenType === 'oauth') {
      // Use OAuth token from session (most current)
      accessToken = session.gitlabAccessToken;
    } else {
      // Decrypt stored token
      accessToken = decrypt(integration.accessToken);
    }

    // Get query parameters for date filtering
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days')) || 90;
    const includeStats = searchParams.get('includeStats') !== 'false';

    try {
      // Fetch commit activity using new GitLab API utility
      const commitActivity = await getUserCommitActivity(accessToken, {
        since: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
      });

      // Generate analytics
      const analytics = generateCommitAnalytics(commitActivity.commits);

      // Get stored activity tracking data for comparison
      const storedActivities = await ActivityTracking.find({
        userId: session.user.id,
        type: 'commit',
        activityCreatedAt: {
          $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        }
      }).sort({ activityCreatedAt: -1 });

      // Prepare response data
      const responseData = {
        success: true,
        connected: true,
        username: integration.gitlabUsername,
        gitlabInstance: integration.gitlabInstance,
        lastSyncAt: integration.lastSyncAt,
        period: {
          days: days,
          startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString()
        },
        
        // Summary metrics
        summary: {
          totalCommits: analytics.totalCommits,
          activeRepositories: commitActivity.activeProjects,
          currentStreak: analytics.streak,
          longestStreak: analytics.longestStreak,
          totalProjects: commitActivity.projects.length
        },

        // Recent commits (last 10)
        recentCommits: analytics.recentCommits.map(commit => ({
          id: commit.id,
          title: commit.title,
          message: commit.message,
          author_name: commit.author_name,
          author_email: commit.author_email,
          created_at: commit.created_at,
          web_url: commit.web_url,
          project: commit.project ? {
            name: commit.project.name,
            path: commit.project.path,
            url: commit.project.url
          } : null,
          stats: commit.stats || null
        })),

        // Commit heatmap for visualization
        commitHeatmap: analytics.commitHeatmap,

        // Weekly activity
        weeklyActivity: Object.entries(analytics.commitsByWeek)
          .map(([week, commits]) => ({ week, commits }))
          .sort((a, b) => a.week.localeCompare(b.week))
          .slice(-12), // Last 12 weeks

        // Repository stats
        repositoryStats: commitActivity.projects
          .filter(project => commitActivity.commits.some(c => c.project?.id === project.id))
          .map(project => {
            const projectCommits = commitActivity.commits.filter(c => c.project?.id === project.id);
            const totalStats = projectCommits.reduce((acc, commit) => ({
              additions: acc.additions + (commit.stats?.additions || 0),
              deletions: acc.deletions + (commit.stats?.deletions || 0)
            }), { additions: 0, deletions: 0 });

            return {
              name: project.name,
              path: project.path_with_namespace,
              url: project.web_url,
              description: project.description,
              commits: projectCommits.length,
              additions: totalStats.additions,
              deletions: totalStats.deletions,
              lastCommit: projectCommits[0]?.created_at,
              visibility: project.visibility
            };
          })
          .sort((a, b) => b.commits - a.commits)
          .slice(0, 10), // Top 10 repositories

        // Language usage (if available)
        languages: analytics.languages
      };

      // Add detailed stats if requested
      if (includeStats) {
        responseData.detailedStats = {
          commitsByDay: analytics.commitsByDay,
          commitsByMonth: analytics.commitsByMonth,
          storedActivitiesCount: storedActivities.length,
          dataSource: integration.tokenType === 'oauth' ? 'OAuth API' : 'Stored Token'
        };
      }

      return NextResponse.json(responseData);

    } catch (apiError) {
      console.error('GitLab API error:', apiError);
      
      // Fallback to stored data if API fails
      const storedActivities = await ActivityTracking.find({
        userId: session.user.id,
        type: 'commit',
        activityCreatedAt: {
          $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        }
      }).sort({ activityCreatedAt: -1 });

      if (storedActivities.length > 0) {
        // Generate analytics from stored data
        const fallbackAnalytics = generateFallbackAnalytics(storedActivities);
        
        return NextResponse.json({
          success: true,
          connected: true,
          username: integration.gitlabUsername,
          gitlabInstance: integration.gitlabInstance,
          lastSyncAt: integration.lastSyncAt,
          dataSource: 'stored',
          warning: 'Using stored data due to API connectivity issues',
          period: {
            days: days,
            startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
            endDate: new Date().toISOString()
          },
          ...fallbackAnalytics
        });
      }

      return NextResponse.json({ 
        error: 'Failed to fetch GitLab data',
        details: apiError.message,
        connected: true,
        canRetry: true
      }, { status: 503 });
    }

  } catch (error) {
    console.error('Error fetching GitLab analytics:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch GitLab analytics',
      details: error.message 
    }, { status: 500 });
  }
}

/**
 * Generate fallback analytics from stored ActivityTracking data
 */
function generateFallbackAnalytics(activities) {
  const commits = activities.map(activity => ({
    id: activity.gitlabId,
    title: activity.title,
    message: activity.message,
    author_name: activity.metadata?.authorName,
    author_email: activity.metadata?.authorEmail,
    created_at: activity.activityCreatedAt,
    web_url: activity.metadata?.webUrl,
    project: {
      name: activity.projectName,
      id: activity.projectId
    },
    stats: {
      additions: activity.metadata?.additions || 0,
      deletions: activity.metadata?.deletions || 0
    }
  }));

  const analytics = generateCommitAnalytics(commits);

  return {
    summary: {
      totalCommits: analytics.totalCommits,
      activeRepositories: new Set(activities.map(a => a.projectId)).size,
      currentStreak: analytics.streak,
      longestStreak: analytics.longestStreak
    },
    recentCommits: analytics.recentCommits,
    commitHeatmap: analytics.commitHeatmap,
    weeklyActivity: Object.entries(analytics.commitsByWeek)
      .map(([week, commits]) => ({ week, commits }))
      .sort((a, b) => a.week.localeCompare(b.week))
      .slice(-12)
  };
}