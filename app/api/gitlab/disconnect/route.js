import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route.js';
import { connectToDatabase } from '../../../../utils/database.js';
import GitLabIntegration from '../../../../models/GitLabIntegration.js';
import ActivityTracking from '../../../../models/ActivityTracking.js';

export const dynamic = 'force-dynamic';

/**
 * POST /api/gitlab/disconnect
 * Disconnect GitLab account and remove all associated data
 */
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Find and remove GitLab integration
    const integration = await GitLabIntegration.findOneAndDelete({ 
      userId: session.user.id 
    });

    if (!integration) {
      return NextResponse.json({ 
        error: 'GitLab account not connected' 
      }, { status: 400 });
    }

    // Remove all associated activity tracking data
    const deletedActivities = await ActivityTracking.deleteMany({
      userId: session.user.id,
      type: 'commit'
    });

    console.log(`Disconnected GitLab for user ${session.user.id}, removed ${deletedActivities.deletedCount} activity records`);

    return NextResponse.json({
      success: true,
      message: 'GitLab account disconnected successfully',
      removedData: {
        integration: true,
        activityRecords: deletedActivities.deletedCount,
        repositories: integration.repositories?.length || 0
      }
    });

  } catch (error) {
    console.error('Error disconnecting GitLab account:', error);
    return NextResponse.json({ 
      error: 'Failed to disconnect GitLab account',
      details: error.message 
    }, { status: 500 });
  }
}