import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route.js';
import { connectToDatabase } from '../../../../utils/database.js';
import GitLabIntegration from '../../../../models/GitLabIntegration.js';
import { testGitLabConnection, getUserCommitActivity } from '../../../../utils/gitlab-api.js';
import { GitLabOAuthAPI } from '../../../../utils/gitlab-oauth-api.js';
import { encryptToken } from '../../../../utils/encryption.js';

export const dynamic = 'force-dynamic';

/**
 * POST /api/gitlab/oauth-connect
 * Connect GitLab account using OAuth token from session
 */
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has GitLab access token from OAuth
    if (!session.gitlabAccessToken) {
      return NextResponse.json({ 
        error: 'No GitLab access token found. Please sign in with GitLab first.' 
      }, { status: 400 });
    }

    await connectToDatabase();

    // Test the GitLab connection
    const connectionTest = await testGitLabConnection(session.gitlabAccessToken);
    if (!connectionTest.success) {
      return NextResponse.json({ 
        error: `GitLab connection failed: ${connectionTest.error}` 
      }, { status: 400 });
    }

    // Check if integration already exists
    let integration = await GitLabIntegration.findOne({ userId: session.user.id });

    const gitlabUser = connectionTest.user;
    const encryptedToken = encryptToken(session.gitlabAccessToken);

    if (integration) {
      // Update existing integration
      integration.gitlabUserId = gitlabUser.id;
      integration.gitlabUsername = gitlabUser.username;
      integration.gitlabEmail = gitlabUser.email;
      integration.accessToken = encryptedToken;
      integration.refreshToken = session.gitlabRefreshToken ? encryptToken(session.gitlabRefreshToken) : null;
      integration.tokenType = 'oauth';
      integration.tokenExpiresAt = session.gitlabTokenExpires ? new Date(session.gitlabTokenExpires * 1000) : null;
      integration.gitlabInstance = process.env.GITLAB_ISSUER || 'https://code.swecha.org';
      integration.apiBase = process.env.GITLAB_API_BASE || 'https://code.swecha.org/api/v4';
      integration.userProfile = {
        name: gitlabUser.name,
        email: gitlabUser.email,
        avatarUrl: gitlabUser.avatar_url,
        webUrl: gitlabUser.web_url
      };
      integration.isActive = true;
      integration.isConnected = true;
      integration.connectedAt = new Date();
    } else {
      // Create new integration
      integration = new GitLabIntegration({
        userId: session.user.id,
        gitlabUserId: gitlabUser.id,
        gitlabUsername: gitlabUser.username,
        gitlabEmail: gitlabUser.email,
        accessToken: encryptedToken,
        refreshToken: session.gitlabRefreshToken ? encryptToken(session.gitlabRefreshToken) : null,
        tokenType: 'oauth',
        tokenExpiresAt: session.gitlabTokenExpires ? new Date(session.gitlabTokenExpires * 1000) : null,
        gitlabInstance: process.env.GITLAB_ISSUER || 'https://code.swecha.org',
        apiBase: process.env.GITLAB_API_BASE || 'https://code.swecha.org/api/v4',
        userProfile: {
          name: gitlabUser.name,
          email: gitlabUser.email,
          avatarUrl: gitlabUser.avatar_url,
          webUrl: gitlabUser.web_url
        },
        permissions: {
          canAccessRepositories: true,
          canTrackCommits: true,
          canViewIssues: true,
          canViewMergeRequests: true,
          canViewAnalytics: true
        }
      });
    }

    await integration.save();

    // Fetch initial commit activity to populate repositories
    try {
      const commitActivity = await getUserCommitActivity(session.gitlabAccessToken);
      
      // Update repositories list
      const repositories = commitActivity.projects.map(project => ({
        projectId: project.id,
        name: project.name,
        fullName: project.path_with_namespace,
        nameWithNamespace: project.name_with_namespace,
        url: project.web_url,
        description: project.description,
        language: project.default_branch, // GitLab doesn't provide language in project list
        visibility: project.visibility,
        isTracked: true,
        lastActivity: project.last_activity_at ? new Date(project.last_activity_at) : null,
        addedAt: new Date()
      }));

      integration.repositories = repositories;
      integration.lastSyncAt = new Date();
      integration.lastSuccessfulSyncAt = new Date();
      await integration.save();

      // Trigger initial sync after successful connection
      let syncWarning = null;
      let lastSyncAt = null;
      try {
        const syncResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/gitlab/simple-sync`, {
          method: 'POST',
          headers: { 'Cookie': request.headers.get('cookie') || '' },
        });
        if (syncResponse.ok) {
          const syncData = await syncResponse.json();
          lastSyncAt = syncData.lastSyncAt || null;
        } else {
          syncWarning = 'Initial sync failed. Please try syncing manually.';
        }
      } catch (syncError) {
        syncWarning = 'Initial sync failed. Please try syncing manually.';
      }

      console.log(`GitLab OAuth integration successful for user ${session.user.id}: @${gitlabUser.username}`);

      return NextResponse.json({
        success: true,
        message: 'GitLab account connected successfully via OAuth',
        integration: {
          username: gitlabUser.username,
          name: gitlabUser.name,
          email: gitlabUser.email,
          repositoriesCount: repositories.length,
          instance: integration.gitlabInstance,
          connectedAt: integration.connectedAt,
          lastSyncAt
        },
        stats: {
          totalProjects: commitActivity.projects.length,
          totalCommits: commitActivity.totalCommits,
          activeProjects: commitActivity.activeProjects
        },
        warning: syncWarning
      });

    } catch (syncError) {
      console.warn('Initial sync failed, but connection successful:', syncError.message);
      
      return NextResponse.json({
        success: true,
        message: 'GitLab account connected successfully via OAuth',
        warning: 'Initial data sync failed, but you can sync manually later',
        integration: {
          username: gitlabUser.username,
          name: gitlabUser.name,
          email: gitlabUser.email,
          repositoriesCount: 0,
          instance: integration.gitlabInstance,
          connectedAt: integration.connectedAt
        }
      });
    }

  } catch (error) {
    console.error('Error connecting GitLab via OAuth:', error);
    return NextResponse.json({ 
      error: 'Failed to connect GitLab account',
      details: error.message 
    }, { status: 500 });
  }
}

/**
 * GET /api/gitlab/oauth-connect
 * Check if user can connect via OAuth (has valid session token)
 */
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hasOAuthToken = !!session.gitlabAccessToken;
    const tokenExpired = session.gitlabTokenExpires ? 
      (session.gitlabTokenExpires * 1000) < Date.now() : false;

    return NextResponse.json({
      canConnectViaOAuth: hasOAuthToken && !tokenExpired,
      hasToken: hasOAuthToken,
      tokenExpired,
      gitlabUsername: session.user.gitlabUsername,
      gitlabInstance: process.env.GITLAB_ISSUER || 'https://code.swecha.org'
    });

  } catch (error) {
    console.error('Error checking OAuth status:', error);
    return NextResponse.json({ 
      error: 'Failed to check OAuth status',
      details: error.message 
    }, { status: 500 });
  }
}