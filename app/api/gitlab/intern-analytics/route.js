import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route.js';
import { connectToDatabase } from '../../../../utils/database.js';
import { decrypt } from '../../../../utils/encryption.js';
import GitLabIntegration from '../../../../models/GitLabIntegration.js';
import ActivityTracking from '../../../../models/ActivityTracking.js';

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

    // Decrypt access token
    const accessToken = decrypt(integration.accessToken);

    // Get query parameters for date filtering
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days')) || 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch commits from GitLab API
    const commits = await fetchUserCommits(accessToken, integration.gitlabUsername, startDate);
    
    // Generate analytics
    const analytics = generateAnalytics(commits, integration);

    return NextResponse.json({
      success: true,
      username: integration.gitlabUsername,
      lastSyncAt: integration.lastSyncAt,
      period: {
        days: days,
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString()
      },
      ...analytics
    });

  } catch (error) {
    console.error('Error fetching GitLab intern analytics:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch GitLab analytics',
      details: error.message 
    }, { status: 500 });
  }
}

/**
 * Fetch commits for a user from GitLab API
 */
async function fetchUserCommits(accessToken, username, since) {
  const commits = [];
  let page = 1;
  const perPage = 100;

  try {
    while (page <= 10) { // Limit to 10 pages (1000 commits max)
      const response = await fetch(
        `https://gitlab.com/api/v4/projects?membership=true&per_page=${perPage}&page=${page}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        console.error('Failed to fetch projects:', response.status);
        break;
      }

      const projects = await response.json();
      if (projects.length === 0) break;

      // Fetch commits for each project
      for (const project of projects) {
        try {
          const commitsResponse = await fetch(
            `https://gitlab.com/api/v4/projects/${project.id}/repository/commits?author=${username}&since=${since.toISOString()}&per_page=100`,
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              }
            }
          );

          if (commitsResponse.ok) {
            const projectCommits = await commitsResponse.json();
            commits.push(...projectCommits.map(commit => ({
              ...commit,
              project: project.name,
              projectId: project.id,
              projectUrl: project.web_url,
              branch: 'main' // Default branch, could be enhanced
            })));
          }
        } catch (commitError) {
          console.error(`Error fetching commits for project ${project.name}:`, commitError);
        }
      }

      page++;
    }
  } catch (error) {
    console.error('Error fetching commits:', error);
  }

  return commits;
}

/**
 * Generate comprehensive analytics from commits data
 */
function generateAnalytics(commits, integration) {
  const now = new Date();
  const analytics = {
    summary: {
      totalCommits: commits.length,
      activeRepositories: [...new Set(commits.map(c => c.project))].length,
      currentStreak: 0,
      weeklyCommits: 0,
      monthlyCommits: 0
    },
    recentCommits: commits
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 20)
      .map(commit => ({
        id: commit.id,
        title: commit.title,
        message: commit.message,
        created_at: commit.created_at,
        author_name: commit.author_name,
        author_email: commit.author_email,
        web_url: commit.web_url,
        project: commit.project,
        branch: commit.branch || 'main',
        stats: commit.stats || { additions: 0, deletions: 0 }
      })),
    commitHeatmap: [],
    weeklyActivity: [],
    repositoryStats: [],
    languages: {}
  };

  // Calculate weekly commits
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  analytics.summary.weeklyCommits = commits.filter(
    c => new Date(c.created_at) >= oneWeekAgo
  ).length;

  // Calculate monthly commits
  const oneMonthAgo = new Date();
  oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
  analytics.summary.monthlyCommits = commits.filter(
    c => new Date(c.created_at) >= oneMonthAgo
  ).length;

  // Generate commit heatmap (last 90 days)
  const heatmapData = {};
  for (let i = 89; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    heatmapData[dateStr] = 0;
  }

  commits.forEach(commit => {
    const dateStr = commit.created_at.split('T')[0];
    if (heatmapData.hasOwnProperty(dateStr)) {
      heatmapData[dateStr]++;
    }
  });

  analytics.commitHeatmap = Object.entries(heatmapData).map(([date, count]) => ({
    date,
    count
  }));

  // Calculate current streak
  let streak = 0;
  const sortedDates = Object.keys(heatmapData).sort().reverse();
  for (const date of sortedDates) {
    if (heatmapData[date] > 0) {
      streak++;
    } else if (streak > 0) {
      break;
    }
  }
  analytics.summary.currentStreak = streak;

  // Generate weekly activity
  const weeklyData = {};
  commits.forEach(commit => {
    const date = new Date(commit.created_at);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const weekKey = weekStart.toISOString().split('T')[0];
    
    if (!weeklyData[weekKey]) {
      weeklyData[weekKey] = 0;
    }
    weeklyData[weekKey]++;
  });

  analytics.weeklyActivity = Object.entries(weeklyData)
    .sort(([a], [b]) => new Date(b) - new Date(a))
    .slice(0, 12)
    .map(([week, commits]) => ({
      week: new Date(week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      commits
    }));

  // Generate repository stats
  const repoStats = {};
  commits.forEach(commit => {
    if (!repoStats[commit.project]) {
      repoStats[commit.project] = {
        name: commit.project,
        commits: 0,
        additions: 0,
        deletions: 0,
        lastCommit: commit.created_at,
        description: ''
      };
    }
    repoStats[commit.project].commits++;
    if (commit.stats) {
      repoStats[commit.project].additions += commit.stats.additions || 0;
      repoStats[commit.project].deletions += commit.stats.deletions || 0;
    }
    if (new Date(commit.created_at) > new Date(repoStats[commit.project].lastCommit)) {
      repoStats[commit.project].lastCommit = commit.created_at;
    }
  });

  analytics.repositoryStats = Object.values(repoStats)
    .sort((a, b) => b.commits - a.commits)
    .slice(0, 10);

  // Mock language data (would need additional API calls to get accurate data)
  const projectNames = [...new Set(commits.map(c => c.project))];
  if (projectNames.length > 0) {
    analytics.languages = {
      'JavaScript': Math.floor(Math.random() * 40) + 20,
      'Python': Math.floor(Math.random() * 30) + 15,
      'HTML': Math.floor(Math.random() * 20) + 10,
      'CSS': Math.floor(Math.random() * 15) + 5,
      'Other': Math.floor(Math.random() * 10) + 5
    };
  }

  return analytics;
}