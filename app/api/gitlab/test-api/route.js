import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route.js';
import { connectToDatabase } from '../../../../utils/database.js';
import { decrypt } from '../../../../utils/encryption.js';
import GitLabIntegration from '../../../../models/GitLabIntegration.js';

export const dynamic = 'force-dynamic';

/**
 * GET /api/gitlab/test-api
 * Test GitLab API connection with direct fetch calls
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
        message: 'No active GitLab integration found for this user'
      }, { status: 400 });
    }

    // Decrypt access token
    const accessToken = decrypt(integration.accessToken);
    if (!accessToken) {
      return NextResponse.json({
        error: 'Token decryption failed',
        message: 'Failed to decrypt the GitLab access token'
      }, { status: 500 });
    }

    // Get GitLab API base URL
    const apiBase = integration.apiBase || process.env.GITLAB_API_BASE || 'https://code.swecha.org/api/v4';
    
    // Test 0: Check token scopes
    const scopesResponse = await fetch(`${apiBase}/personal_access_tokens/self`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    let tokenScopes = null;
    let tokenScopesError = null;
    
    if (scopesResponse.ok) {
      const tokenData = await scopesResponse.json();
      
      // Check if we have the required scopes
      const requiredScopes = ['api', 'read_api', 'read_user', 'read_repository'];
      const missingScopes = requiredScopes.filter(scope => 
        !tokenData.scopes?.includes(scope) && 
        !tokenData.scopes?.includes('api') // 'api' includes all scopes
      );
      
      tokenScopes = {
        scopes: tokenData.scopes || [],
        hasRequiredScopes: missingScopes.length === 0,
        missingScopes: missingScopes
      };
    } else {
      try {
        const errorText = await scopesResponse.text();
        tokenScopesError = {
          status: scopesResponse.status,
          statusText: scopesResponse.statusText,
          body: errorText
        };
      } catch (e) {
        tokenScopesError = {
          status: scopesResponse.status,
          statusText: scopesResponse.statusText,
          parseError: e.message
        };
      }
    }
    
    // Test 1: Get user profile
    const userResponse = await fetch(`${apiBase}/user`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    let userProfile = null;
    let userError = null;
    
    if (userResponse.ok) {
      userProfile = await userResponse.json();
    } else {
      try {
        const errorText = await userResponse.text();
        userError = {
          status: userResponse.status,
          statusText: userResponse.statusText,
          body: errorText
        };
      } catch (e) {
        userError = {
          status: userResponse.status,
          statusText: userResponse.statusText,
          parseError: e.message
        };
      }
    }
    
    // Test 2: Get projects
    const projectsResponse = await fetch(`${apiBase}/projects?membership=true&per_page=5`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    let projects = null;
    let projectsError = null;
    
    if (projectsResponse.ok) {
      projects = await projectsResponse.json();
    } else {
      try {
        const errorText = await projectsResponse.text();
        projectsError = {
          status: projectsResponse.status,
          statusText: projectsResponse.statusText,
          body: errorText
        };
      } catch (e) {
        projectsError = {
          status: projectsResponse.status,
          statusText: projectsResponse.statusText,
          parseError: e.message
        };
      }
    }
    
    // Test 3: Get commits from first project (if available)
    let commits = null;
    let commitsError = null;
    
    if (projects && projects.length > 0) {
      const firstProject = projects[0];
      const commitsResponse = await fetch(
        `${apiBase}/projects/${firstProject.id}/repository/commits?per_page=5`, 
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (commitsResponse.ok) {
        commits = await commitsResponse.json();
      } else {
        try {
          const errorText = await commitsResponse.text();
          commitsError = {
            status: commitsResponse.status,
            statusText: commitsResponse.statusText,
            body: errorText,
            projectId: firstProject.id
          };
        } catch (e) {
          commitsError = {
            status: commitsResponse.status,
            statusText: commitsResponse.statusText,
            parseError: e.message,
            projectId: firstProject.id
          };
        }
      }
    }
    
    // Return test results
    return NextResponse.json({
      success: true,
      apiBase,
      integration: {
        id: integration._id,
        gitlabUserId: integration.gitlabUserId,
        gitlabUsername: integration.gitlabUsername,
        gitlabEmail: integration.gitlabEmail,
        tokenType: integration.tokenType,
        tokenExpiresAt: integration.tokenExpiresAt,
        gitlabInstance: integration.gitlabInstance
      },
      tests: {
        tokenScopes: {
          success: !!tokenScopes,
          error: tokenScopesError,
          data: tokenScopes
        },
        user: {
          success: !!userProfile,
          error: userError,
          data: userProfile ? {
            id: userProfile.id,
            username: userProfile.username,
            name: userProfile.name,
            email: userProfile.email
          } : null
        },
        projects: {
          success: !!projects,
          error: projectsError,
          count: projects ? projects.length : 0,
          data: projects ? projects.map(p => ({
            id: p.id,
            name: p.name,
            path: p.path_with_namespace
          })) : null
        },
        commits: {
          success: !!commits,
          error: commitsError,
          count: commits ? commits.length : 0,
          data: commits ? commits.map(c => ({
            id: c.id,
            title: c.title,
            author: c.author_name,
            created_at: c.created_at
          })) : null
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error in GitLab API test:', error);
    return NextResponse.json({ 
      error: 'API test failed',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}