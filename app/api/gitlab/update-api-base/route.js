import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route.js';
import { connectToDatabase } from '../../../../utils/database.js';
import GitLabIntegration from '../../../../models/GitLabIntegration.js';

export const dynamic = 'force-dynamic';

/**
 * POST /api/gitlab/update-api-base
 * Update the GitLab API base URL for a user's integration
 */
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Get request body
    const body = await request.json();
    const { apiBase } = body;

    if (!apiBase) {
      return NextResponse.json({ 
        error: 'Missing API base URL' 
      }, { status: 400 });
    }

    // Validate URL format
    try {
      new URL(apiBase);
    } catch (e) {
      return NextResponse.json({ 
        error: 'Invalid URL format' 
      }, { status: 400 });
    }

    // Get GitLab integration
    const integration = await GitLabIntegration.findOne({ 
      userId: session.user.id,
      isActive: true 
    });

    if (!integration) {
      return NextResponse.json({ 
        error: 'GitLab not connected' 
      }, { status: 400 });
    }

    // Update API base URL
    integration.apiBase = apiBase;
    await integration.save();

    return NextResponse.json({
      success: true,
      message: 'GitLab API base URL updated successfully',
      apiBase
    });

  } catch (error) {
    console.error('Error updating GitLab API base URL:', error);
    return NextResponse.json({ 
      error: 'Failed to update API base URL',
      details: error.message 
    }, { status: 500 });
  }
}