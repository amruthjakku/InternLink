import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route.js';
import { connectToDatabase } from '../../../../utils/database.js';
import { encrypt } from '../../../../utils/encryption.js';
import GitLabIntegration from '../../../../models/GitLabIntegration.js';

export const dynamic = 'force-dynamic';

/**
 * POST /api/gitlab/connect-token
 * Connect GitLab account using Personal Access Token
 */
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { personalAccessToken, gitlabUsername, repositories } = await request.json();

    if (!personalAccessToken || !gitlabUsername) {
      return NextResponse.json({ 
        error: 'Personal Access Token and GitLab username are required' 
      }, { status: 400 });
    }

    // Validate token by making a test API call to Swecha GitLab
    const gitlabApiBase = process.env.GITLAB_API_BASE || 'https://code.swecha.org/api/v4';
    const testResponse = await fetch(`${gitlabApiBase}/user`, {
      headers: {
        'Authorization': `Bearer ${personalAccessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!testResponse.ok) {
      return NextResponse.json({ 
        error: 'Invalid Personal Access Token or insufficient permissions' 
      }, { status: 400 });
    }

    const gitlabUser = await testResponse.json();

    // Verify username matches
    if (gitlabUser.username !== gitlabUsername) {
      return NextResponse.json({ 
        error: 'GitLab username does not match the token owner' 
      }, { status: 400 });
    }

    await connectToDatabase();

    // Encrypt the token for secure storage
    const encryptedToken = encrypt(personalAccessToken);

    // Parse repositories list
    const repositoryList = repositories 
      ? repositories.split(',').map(repo => repo.trim()).filter(repo => repo.length > 0)
      : [];

    // Create or update GitLab integration
    const integration = await GitLabIntegration.findOneAndUpdate(
      { userId: session.user.id },
      {
        userId: session.user.id,
        gitlabUserId: gitlabUser.id,
        gitlabUsername: gitlabUser.username,
        gitlabEmail: gitlabUser.email,
        accessToken: encryptedToken,
        tokenType: 'personal_access_token',
        gitlabInstance: process.env.GITLAB_ISSUER || 'https://code.swecha.org',
        apiBase: gitlabApiBase,
        specificRepositories: repositoryList,
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
          canViewMergeRequests: true
        },
        isActive: true,
        connectedAt: new Date(),
        lastSyncAt: null
      },
      { 
        upsert: true, 
        new: true,
        setDefaultsOnInsert: true
      }
    );

    // Fetch user's repositories to populate the integration
    try {
      const reposResponse = await fetch(`${gitlabApiBase}/projects?membership=true&per_page=100`, {
        headers: {
          'Authorization': `Bearer ${personalAccessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (reposResponse.ok) {
        const repos = await reposResponse.json();
        const repositoryData = repos.map(repo => ({
          projectId: repo.id,
          name: repo.name,
          fullName: repo.path_with_namespace,
          url: repo.web_url,
          description: repo.description,
          language: repo.default_branch,
          visibility: repo.visibility,
          isTracked: repositoryList.length === 0 || repositoryList.includes(repo.name),
          lastActivity: repo.last_activity_at
        }));

        // Update integration with repository data
        integration.repositories = repositoryData;
        await integration.save();
      }
    } catch (repoError) {
      console.error('Error fetching repositories:', repoError);
      // Continue even if repository fetch fails
    }

    return NextResponse.json({
      success: true,
      message: 'GitLab account connected successfully',
      integration: {
        username: integration.gitlabUsername,
        repositoriesCount: integration.repositories?.length || 0,
        connectedAt: integration.connectedAt
      }
    });

  } catch (error) {
    console.error('Error connecting GitLab account:', error);
    return NextResponse.json({ 
      error: 'Failed to connect GitLab account',
      details: error.message 
    }, { status: 500 });
  }
}