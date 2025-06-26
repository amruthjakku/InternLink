import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route.js';
import { connectToDatabase } from '../../../../utils/database.js';
import { decrypt } from '../../../../utils/encryption.js';
import { GitLabAPI } from '../../../../utils/gitlab-api.js';
import GitLabIntegration from '../../../../models/GitLabIntegration.js';

export const dynamic = 'force-dynamic';

/**
 * GET /api/gitlab/diagnostic
 * Diagnostic endpoint to troubleshoot GitLab integration issues
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
        step: 'integration_check',
        message: 'No active GitLab integration found for this user'
      }, { status: 400 });
    }

    // Decrypt access token
    const accessToken = decrypt(integration.accessToken);
    if (!accessToken) {
      return NextResponse.json({
        error: 'Token decryption failed',
        step: 'token_decryption',
        message: 'Failed to decrypt the GitLab access token'
      }, { status: 500 });
    }

    // Initialize GitLab API wrapper
    const gitlab = new GitLabAPI(accessToken);
    
    // Check token expiration
    const now = new Date();
    const tokenExpired = integration.tokenExpiresAt && new Date(integration.tokenExpiresAt) < now;
    
    // Check token scopes
    let tokenScopes = { success: false };
    try {
      const apiBase = integration.apiBase || process.env.GITLAB_API_BASE || 'https://code.swecha.org/api/v4';
      const scopesResponse = await fetch(`${apiBase}/personal_access_tokens/self`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (scopesResponse.ok) {
        const tokenData = await scopesResponse.json();
        
        // Check if we have the required scopes
        const requiredScopes = ['api', 'read_api', 'read_user', 'read_repository'];
        const missingScopes = requiredScopes.filter(scope => 
          !tokenData.scopes?.includes(scope) && 
          !tokenData.scopes?.includes('api') // 'api' includes all scopes
        );
        
        tokenScopes = {
          success: true,
          scopes: tokenData.scopes || [],
          hasRequiredScopes: missingScopes.length === 0,
          missingScopes: missingScopes
        };
      } else {
        const errorText = await scopesResponse.text();
        tokenScopes = {
          success: false,
          status: scopesResponse.status,
          error: errorText
        };
      }
    } catch (scopesError) {
      tokenScopes = {
        success: false,
        error: scopesError.message
      };
    }
    
    // Test connection
    const connectionTest = await gitlab.testConnection();
    if (!connectionTest.success) {
      return NextResponse.json({
        error: 'Connection failed',
        step: 'connection_test',
        message: connectionTest.error,
        details: connectionTest,
        tokenExpired,
        tokenScopes
      }, { status: 500 });
    }

    // Get user profile
    let userProfile;
    try {
      userProfile = await gitlab.getCurrentUser();
    } catch (error) {
      return NextResponse.json({
        error: 'User profile fetch failed',
        step: 'user_profile',
        message: error.message,
        connectionTest
      }, { status: 500 });
    }

    // Get projects
    let projects = [];
    try {
      projects = await gitlab.getUserProjects({ perPage: 10 });
    } catch (error) {
      return NextResponse.json({
        error: 'Projects fetch failed',
        step: 'projects',
        message: error.message,
        connectionTest,
        userProfile
      }, { status: 500 });
    }

    // Get sample commits from first project (if any)
    let sampleCommits = [];
    let commitError = null;
    if (projects.length > 0) {
      try {
        const firstProject = projects[0];
        sampleCommits = await gitlab.getProjectCommits(firstProject.id, {
          perPage: 5,
          since: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        });
      } catch (error) {
        commitError = {
          message: error.message,
          stack: error.stack
        };
      }
    }

    // Get user commit activity
    let commitActivity = null;
    let activityError = null;
    try {
      commitActivity = await gitlab.getUserCommitActivity({
        since: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      });
    } catch (error) {
      activityError = {
        message: error.message,
        stack: error.stack
      };
    }

    // Return diagnostic information
    return NextResponse.json({
      success: true,
      integration: {
        id: integration._id,
        gitlabUserId: integration.gitlabUserId,
        gitlabUsername: integration.gitlabUsername,
        gitlabEmail: integration.gitlabEmail,
        tokenType: integration.tokenType,
        tokenExpiresAt: integration.tokenExpiresAt,
        tokenExpired,
        hasRefreshToken: !!integration.refreshToken,
        gitlabInstance: integration.gitlabInstance,
        apiBase: integration.apiBase,
        lastSyncAt: integration.lastSyncAt,
        lastSuccessfulSyncAt: integration.lastSuccessfulSyncAt,
        syncErrors: integration.syncErrors || [],
        repositoriesCount: integration.repositories?.length || 0
      },
      tokenScopes,
      connectionTest,
      userProfile: {
        id: userProfile.id,
        username: userProfile.username,
        name: userProfile.name,
        email: userProfile.email,
        avatarUrl: userProfile.avatar_url,
        webUrl: userProfile.web_url
      },
      projects: projects.map(p => ({
        id: p.id,
        name: p.name,
        path: p.path_with_namespace,
        visibility: p.visibility,
        lastActivityAt: p.last_activity_at
      })),
      sampleCommits: sampleCommits.map(c => ({
        id: c.id,
        shortId: c.short_id,
        title: c.title,
        authorName: c.author_name,
        authorEmail: c.author_email,
        createdAt: c.created_at
      })),
      commitError,
      commitActivity: commitActivity ? {
        totalCommits: commitActivity.totalCommits,
        totalProjects: commitActivity.projects?.length || 0,
        activeProjects: commitActivity.activeProjects || 0,
        sampleCommits: (commitActivity.commits || []).slice(0, 5).map(c => ({
          id: c.id,
          title: c.title,
          projectName: c.project?.name,
          createdAt: c.created_at
        }))
      } : null,
      activityError,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in GitLab diagnostic:', error);
    return NextResponse.json({ 
      error: 'Diagnostic failed',
      message: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}