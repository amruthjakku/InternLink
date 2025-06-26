import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route.js';
import { connectToDatabase } from '../../../../utils/database.js';
import User from '../../../../models/User.js';
import { GitLabOAuthAPI } from '../../../../utils/gitlab-oauth-api.js';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    // Get user from database
    const user = await User.findById(session.user.id);
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const since = searchParams.get('since');
    const until = searchParams.get('until');
    const includeStats = searchParams.get('includeStats') === 'true';

    // Create OAuth API instance
    const oauthAPI = new GitLabOAuthAPI(user._id);

    // Get commit activity
    const activity = await oauthAPI.getUserCommitActivity({
      since: since || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      until
    });

    // Calculate additional stats if requested
    let stats = null;
    if (includeStats && activity.commits.length > 0) {
      const commitsByDate = {};
      const commitsByProject = {};
      let totalAdditions = 0;
      let totalDeletions = 0;

      activity.commits.forEach(commit => {
        const date = new Date(commit.created_at).toISOString().split('T')[0];
        commitsByDate[date] = (commitsByDate[date] || 0) + 1;
        
        const projectName = commit.project.name;
        commitsByProject[projectName] = (commitsByProject[projectName] || 0) + 1;

        if (commit.stats) {
          totalAdditions += commit.stats.additions || 0;
          totalDeletions += commit.stats.deletions || 0;
        }
      });

      stats = {
        totalCommits: activity.totalCommits,
        totalProjects: activity.projects.length,
        activeProjects: activity.activeProjects,
        totalAdditions,
        totalDeletions,
        commitsByDate,
        commitsByProject,
        averageCommitsPerDay: activity.totalCommits / Math.max(1, Object.keys(commitsByDate).length),
        mostActiveProject: Object.entries(commitsByProject).sort(([,a], [,b]) => b - a)[0]?.[0] || null
      };
    }

    return Response.json({
      success: true,
      data: {
        commits: activity.commits,
        projects: activity.projects,
        user: activity.user,
        totalCommits: activity.totalCommits,
        activeProjects: activity.activeProjects,
        errors: activity.errors
      },
      stats,
      meta: {
        since: since || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        until,
        tokenType: 'oauth'
      }
    });
  } catch (error) {
    console.error('Error fetching OAuth GitLab activity:', error);
    return Response.json({ 
      error: 'Failed to fetch GitLab activity',
      details: error.message,
      tokenType: 'oauth'
    }, { status: 500 });
  }
}