import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route.js';
import { connectToDatabase } from '../../../../utils/database.js';
import User from '../../../../models/User.js';
import GitLabIntegration from '../../../../models/GitLabIntegration.js';
import { GitLabOAuthAPI } from '../../../../utils/gitlab-oauth-api.js';
import { GitLabAPI } from '../../../../utils/gitlab-api.js';
import { decrypt } from '../../../../utils/encryption.js';

/**
 * Unified GitLab Activity Endpoint
 * Automatically uses OAuth if available, falls back to PAT
 */
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

    // Find the best available integration (OAuth preferred)
    let integration = await GitLabIntegration.findOne({
      userId: user._id,
      tokenType: 'oauth',
      isActive: true
    });

    let tokenType = 'oauth';
    let activityData;

    if (integration && session.gitlabAccessToken) {
      // Use OAuth API
      console.log(`🔐 Using OAuth integration for user: ${user.gitlabUsername}`);
      
      try {
        const oauthAPI = new GitLabOAuthAPI(user._id);
        activityData = await oauthAPI.getUserCommitActivity({
          since: since || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          until
        });
      } catch (oauthError) {
        console.warn('OAuth API failed, trying PAT fallback:', oauthError.message);
        integration = null; // Force PAT fallback
      }
    }

    // Fallback to PAT if OAuth not available or failed
    if (!integration || !activityData) {
      integration = await GitLabIntegration.findOne({
        userId: user._id,
        tokenType: 'personal_access_token',
        isActive: true
      });

      if (!integration) {
        return Response.json({ 
          error: 'No GitLab integration found',
          suggestion: 'Please connect your GitLab account via OAuth or Personal Access Token'
        }, { status: 404 });
      }

      console.log(`🔑 Using PAT integration for user: ${user.gitlabUsername}`);
      tokenType = 'pat';

      // Use PAT API
      const accessToken = decrypt(integration.accessToken);
      if (!accessToken) {
        return Response.json({ 
          error: 'Failed to decrypt access token',
          suggestion: 'Please reconnect your GitLab account'
        }, { status: 500 });
      }

      const patAPI = new GitLabAPI(accessToken);
      
      try {
        const commitActivity = await patAPI.getUserCommitActivity({
          since: since || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          until
        });

        activityData = {
          commits: commitActivity.commits || [],
          projects: commitActivity.projects || [],
          user: commitActivity.user,
          totalCommits: commitActivity.totalCommits || 0,
          activeProjects: commitActivity.activeProjects || 0,
          errors: commitActivity.errors
        };
      } catch (patError) {
        console.error('PAT API failed:', patError);
        return Response.json({ 
          error: 'Failed to fetch GitLab activity',
          details: patError.message,
          tokenType
        }, { status: 500 });
      }
    }

    // Calculate additional stats if requested
    let stats = null;
    if (includeStats && activityData.commits.length > 0) {
      const commitsByDate = {};
      const commitsByProject = {};
      let totalAdditions = 0;
      let totalDeletions = 0;

      activityData.commits.forEach(commit => {
        const date = new Date(commit.created_at).toISOString().split('T')[0];
        commitsByDate[date] = (commitsByDate[date] || 0) + 1;
        
        const projectName = commit.project?.name || commit.project_name || 'Unknown';
        commitsByProject[projectName] = (commitsByProject[projectName] || 0) + 1;

        if (commit.stats) {
          totalAdditions += commit.stats.additions || 0;
          totalDeletions += commit.stats.deletions || 0;
        }
      });

      stats = {
        totalCommits: activityData.totalCommits,
        totalProjects: activityData.projects.length,
        activeProjects: activityData.activeProjects,
        totalAdditions,
        totalDeletions,
        commitsByDate,
        commitsByProject,
        averageCommitsPerDay: activityData.totalCommits / Math.max(1, Object.keys(commitsByDate).length),
        mostActiveProject: Object.entries(commitsByProject).sort(([,a], [,b]) => b - a)[0]?.[0] || null
      };
    }

    // Update last sync time
    await GitLabIntegration.updateOne(
      { _id: integration._id },
      { 
        lastSyncAt: new Date(),
        lastSuccessfulSyncAt: new Date()
      }
    );

    return Response.json({
      success: true,
      data: activityData,
      stats,
      meta: {
        tokenType,
        since: since || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        until,
        integrationId: integration._id,
        lastSync: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error in unified GitLab activity:', error);
    return Response.json({ 
      error: 'Failed to fetch GitLab activity',
      details: error.message
    }, { status: 500 });
  }
}