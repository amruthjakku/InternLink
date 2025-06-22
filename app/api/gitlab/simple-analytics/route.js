import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route.js';
import { connectToDatabase } from '../../../../utils/database.js';
import GitLabIntegration from '../../../../models/GitLabIntegration.js';
import ActivityTracking from '../../../../models/ActivityTracking.js';

export const dynamic = 'force-dynamic';

/**
 * GET /api/gitlab/simple-analytics
 * Simple, reliable GitLab analytics from stored data only
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days')) || 90;
    const userFilter = searchParams.get('userOnly') !== 'false'; // Default to true

    console.log(`📊 Getting analytics for ${integration.gitlabUsername} (last ${days} days, userOnly: ${userFilter})`);

    // Get all stored activities
    const allActivities = await ActivityTracking.find({
      userId: session.user.id,
      type: 'commit',
      activityCreatedAt: {
        $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      }
    }).sort({ activityCreatedAt: -1 });

    console.log(`📦 Found ${allActivities.length} total stored activities`);

    // Filter activities by user if requested
    let userActivities = allActivities;
    if (userFilter) {
      userActivities = allActivities.filter(activity => {
        const authorName = activity.metadata?.authorName || '';
        const authorEmail = activity.metadata?.authorEmail || '';
        
        return (
          authorName === integration.gitlabUsername ||
          authorEmail === integration.gitlabEmail ||
          authorName.toLowerCase().includes(integration.gitlabUsername.toLowerCase()) ||
          authorEmail.toLowerCase().includes(integration.gitlabUsername.toLowerCase())
        );
      });
      console.log(`👤 Filtered to ${userActivities.length} user activities`);
    }

    // Build repository stats
    const repositoryStats = {};
    userActivities.forEach(activity => {
      const projectId = activity.projectId;
      if (!repositoryStats[projectId]) {
        repositoryStats[projectId] = {
          id: projectId,
          name: activity.projectName,
          path: activity.projectPath,
          url: activity.metadata?.projectUrl,
          visibility: activity.metadata?.projectVisibility || 'private',
          commits: [],
          totalCommits: 0,
          additions: 0,
          deletions: 0,
          lastCommit: null
        };
      }
      
      repositoryStats[projectId].commits.push(activity);
      repositoryStats[projectId].totalCommits++;
      repositoryStats[projectId].additions += activity.metadata?.additions || 0;
      repositoryStats[projectId].deletions += activity.metadata?.deletions || 0;
      
      if (!repositoryStats[projectId].lastCommit || 
          new Date(activity.activityCreatedAt) > new Date(repositoryStats[projectId].lastCommit)) {
        repositoryStats[projectId].lastCommit = activity.activityCreatedAt;
      }
    });

    const repositories = Object.values(repositoryStats)
      .map(repo => ({
        name: repo.name,
        path: repo.path,
        url: repo.url,
        visibility: repo.visibility,
        commits: repo.totalCommits,
        additions: repo.additions,
        deletions: repo.deletions,
        lastCommit: repo.lastCommit
      }))
      .sort((a, b) => b.commits - a.commits);

    // Build recent commits
    const recentCommits = userActivities.slice(0, 20).map(activity => ({
      id: activity.gitlabId,
      title: activity.title,
      message: activity.message,
      author_name: activity.metadata?.authorName,
      author_email: activity.metadata?.authorEmail,
      created_at: activity.activityCreatedAt,
      web_url: activity.metadata?.webUrl || activity.url,
      project: {
        name: activity.projectName,
        path: activity.projectPath,
        url: activity.metadata?.projectUrl
      },
      stats: {
        additions: activity.metadata?.additions || 0,
        deletions: activity.metadata?.deletions || 0
      }
    }));

    // Calculate streaks (simple version)
    const commitDates = [...new Set(userActivities.map(a => 
      new Date(a.activityCreatedAt).toDateString()
    ))].sort();

    let currentStreak = 0;
    let longestStreak = 0;

    // Simple streak calculation
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
    
    if (commitDates.includes(today) || commitDates.includes(yesterday)) {
      currentStreak = 1; // Simplified
    }

    const response = {
      success: true,
      connected: true,
      username: integration.gitlabUsername,
      email: integration.gitlabEmail,
      gitlabInstance: integration.gitlabInstance,
      lastSyncAt: integration.lastSyncAt,
      
      period: {
        days: days,
        startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString()
      },

      summary: {
        totalCommits: userActivities.length,
        activeRepositories: repositories.length,
        currentStreak: currentStreak,
        longestStreak: longestStreak,
        totalProjects: Object.keys(repositoryStats).length
      },

      repositoryStats: repositories,
      recentCommits: recentCommits,

      // Debug info
      debug: {
        totalStoredActivities: allActivities.length,
        userFilteredActivities: userActivities.length,
        repositoriesFound: repositories.length,
        filterCriteria: {
          username: integration.gitlabUsername,
          email: integration.gitlabEmail
        }
      }
    };

    console.log(`✅ Analytics ready: ${response.summary.totalCommits} commits, ${response.summary.activeRepositories} repos`);

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Simple analytics error:', error);
    return NextResponse.json({ 
      error: 'Failed to get analytics',
      details: error.message 
    }, { status: 500 });
  }
}