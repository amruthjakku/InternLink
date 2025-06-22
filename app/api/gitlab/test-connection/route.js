import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/gitlab/test-connection
 * Test GitLab API connection with a Personal Access Token
 */
export async function POST(request) {
  try {
    const { token, username } = await request.json();

    if (!token) {
      return NextResponse.json({ 
        error: 'Token is required',
        success: false 
      }, { status: 400 });
    }

    const gitlabApiBase = process.env.GITLAB_API_BASE || 'https://code.swecha.org/api/v4';
    
    console.log(`Testing GitLab connection to: ${gitlabApiBase}`);
    console.log(`Token format: ${token.substring(0, 10)}...`);

    // Test 1: Get current user
    const userResponse = await fetch(`${gitlabApiBase}/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`User API response status: ${userResponse.status}`);

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.log(`User API error: ${errorText}`);
      
      return NextResponse.json({
        success: false,
        error: `GitLab API Error (${userResponse.status}): ${errorText}`,
        details: {
          endpoint: `${gitlabApiBase}/user`,
          status: userResponse.status,
          statusText: userResponse.statusText,
          apiBase: gitlabApiBase
        }
      }, { status: 400 });
    }

    const userData = await userResponse.json();
    console.log(`User data received: ${userData.username} (${userData.name})`);

    // Test 2: Get user's projects
    const projectsResponse = await fetch(`${gitlabApiBase}/projects?membership=true&per_page=5`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`Projects API response status: ${projectsResponse.status}`);

    let projectsData = [];
    if (projectsResponse.ok) {
      projectsData = await projectsResponse.json();
      console.log(`Found ${projectsData.length} projects`);
    } else {
      console.log(`Projects API error: ${projectsResponse.status}`);
    }

    // Validate username if provided
    if (username && userData.username !== username) {
      return NextResponse.json({
        success: false,
        error: `Username mismatch: Token belongs to '${userData.username}', but you entered '${username}'`,
        details: {
          tokenUsername: userData.username,
          enteredUsername: username
        }
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'GitLab connection successful!',
      user: {
        id: userData.id,
        username: userData.username,
        name: userData.name,
        email: userData.email,
        avatar_url: userData.avatar_url,
        web_url: userData.web_url
      },
      projects: {
        count: projectsData.length,
        sample: projectsData.slice(0, 3).map(p => ({
          id: p.id,
          name: p.name,
          path: p.path_with_namespace,
          url: p.web_url
        }))
      },
      apiBase: gitlabApiBase,
      tokenScopes: userResponse.headers.get('x-oauth-scopes') || 'Unknown'
    });

  } catch (error) {
    console.error('GitLab connection test error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to test GitLab connection',
      details: error.message 
    }, { status: 500 });
  }
}

/**
 * GET /api/gitlab/test-connection
 * Get GitLab API configuration info
 */
export async function GET() {
  return NextResponse.json({
    gitlabInstance: process.env.GITLAB_ISSUER || 'https://code.swecha.org',
    apiBase: process.env.GITLAB_API_BASE || 'https://code.swecha.org/api/v4',
    requiredScopes: ['read_user', 'read_api', 'read_repository'],
    tokenUrl: 'https://code.swecha.org/-/profile/personal_access_tokens'
  });
}