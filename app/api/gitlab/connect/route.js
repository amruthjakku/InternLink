import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route.js';
import { encrypt } from '../../../../utils/encryption.js';
import { connectToDatabase } from '../../../../utils/database.js';
import GitLabIntegration from '../../../../models/GitLabIntegration.js';
import { GitLabAPI } from '../../../../utils/gitlab-api.js';

/**
 * POST /api/gitlab/connect
 * Connect GitLab account and store OAuth tokens
 */
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Connect to database
    await connectToDatabase();

    const { code, state } = await request.json();
    
    if (!code) {
      return NextResponse.json({ error: 'Authorization code required' }, { status: 400 });
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://gitlab.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.GITLAB_CLIENT_ID,
        client_secret: process.env.GITLAB_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/callback/gitlab`
      })
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('GitLab token exchange failed:', error);
      return NextResponse.json({ error: 'Failed to exchange authorization code' }, { status: 400 });
    }

    const tokens = await tokenResponse.json();
    
    // Get GitLab user profile
    const gitlab = new GitLabAPI(tokens.access_token);
    const gitlabUser = await gitlab.getUserProfile();

    // Check if integration already exists
    const existingIntegration = await GitLabIntegration.findOne({ 
      userId: session.user.id 
    });

    const integrationData = {
      userId: session.user.id,
      gitlabUserId: gitlabUser.id,
      gitlabUsername: gitlabUser.username,
      gitlabEmail: gitlabUser.email,
      accessToken: encrypt(tokens.access_token),
      refreshToken: encrypt(tokens.refresh_token),
      tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      isActive: true,
      isConnected: true,
      permissions: {
        canAccessRepositories: true,
        canTrackCommits: true,
        canManageIssues: true,
        canViewAnalytics: true
      }
    };

    if (existingIntegration) {
      // Update existing integration
      await GitLabIntegration.updateOne(
        { userId: session.user.id },
        integrationData
      );
    } else {
      // Create new integration
      await GitLabIntegration.create(integrationData);
    }

    return NextResponse.json({ 
      success: true,
      gitlabUser: {
        id: gitlabUser.id,
        username: gitlabUser.username,
        name: gitlabUser.name,
        email: gitlabUser.email,
        avatar_url: gitlabUser.avatar_url
      }
    });

  } catch (error) {
    console.error('GitLab connection error:', error);
    return NextResponse.json({ 
      error: 'Failed to connect GitLab account',
      details: error.message 
    }, { status: 500 });
  }
}

/**
 * GET /api/gitlab/connect
 * Get GitLab connection status
 */
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Connect to database
    await connectToDatabase();

    const integration = await GitLabIntegration.findOne({ 
      userId: session.user.id,
      isActive: true
    }).select('-accessToken -refreshToken');

    if (!integration) {
      return NextResponse.json({ 
        connected: false,
        message: 'GitLab account not connected'
      });
    }

    // Check if token is expired
    const isTokenExpired = integration.tokenExpiresAt < new Date();

    return NextResponse.json({
      connected: true,
      isTokenExpired,
      gitlabUser: {
        id: integration.gitlabUserId,
        username: integration.gitlabUsername,
        email: integration.gitlabEmail
      },
      lastSyncAt: integration.lastSyncAt,
      repositories: integration.repositories,
      permissions: integration.permissions
    });

  } catch (error) {
    console.error('Error checking GitLab connection:', error);
    return NextResponse.json({ 
      error: 'Failed to check connection status' 
    }, { status: 500 });
  }
}

/**
 * DELETE /api/gitlab/connect
 * Disconnect GitLab account
 */
export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Connect to database
    await connectToDatabase();

    await GitLabIntegration.updateOne(
      { userId: session.user.id },
      { 
        isActive: false,
        isConnected: false,
        updatedAt: new Date()
      }
    );

    return NextResponse.json({ 
      success: true,
      message: 'GitLab account disconnected'
    });

  } catch (error) {
    console.error('Error disconnecting GitLab:', error);
    return NextResponse.json({ 
      error: 'Failed to disconnect GitLab account' 
    }, { status: 500 });
  }
}