import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase } from '@/lib/mongoose';
import GitLabIntegration from '@/models/GitLabIntegration';

export const dynamic = 'force-dynamic';

/**
 * GET /api/gitlab/connection-status
 * Check if user has connected their GitLab account via Personal Access Token
 */
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Check if user has GitLab integration set up
    const integration = await GitLabIntegration.findOne({ 
      userId: session.user.id,
      isActive: true 
    });

    if (!integration) {
      return NextResponse.json({ 
        connected: false,
        message: 'GitLab account not connected'
      });
    }

    return NextResponse.json({
      connected: true,
      username: integration.gitlabUsername,
      repositoriesCount: integration.repositories?.length || 0,
      lastSyncAt: integration.lastSyncAt,
      createdAt: integration.createdAt
    });

  } catch (error) {
    console.error('Error checking GitLab connection status:', error);
    return NextResponse.json({ 
      error: 'Failed to check connection status',
      details: error.message 
    }, { status: 500 });
  }
}