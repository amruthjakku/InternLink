import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route.js';
import { connectToDatabase } from '../../../../utils/database.js';
import { GitLabSyncService } from '../../../../utils/gitlab-sync.js';
import GitLabIntegration from '../../../../models/GitLabIntegration.js';

/**
 * GET /api/gitlab/analytics
 * Get comprehensive GitLab analytics for the user
 */
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Connect to database
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const period = searchParams.get('period') || '30d'; // 7d, 30d, 90d, 1y

    // Check GitLab integration
    const integration = await GitLabIntegration.findOne({ 
      userId: session.user.id, 
      isActive: true 
    });

    if (!integration) {
      return NextResponse.json({ 
        error: 'GitLab not connected',
        connected: false 
      }, { status: 400 });
    }

    // Calculate date range based on period if not provided
    let dateRange = {};
    if (startDate && endDate) {
      dateRange = { startDate, endDate };
    } else {
      const now = new Date();
      const periodDays = {
        '7d': 7,
        '30d': 30,
        '90d': 90,
        '1y': 365
      };
      
      const days = periodDays[period] || 30;
      dateRange = {
        startDate: new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString(),
        endDate: now.toISOString()
      };
    }

    // Get analytics from sync service
    const analytics = await GitLabSyncService.getUserAnalytics(session.user.id, dateRange);

    // Add integration metadata
    const response = {
      ...analytics,
      integration: {
        gitlabUsername: integration.gitlabUsername,
        lastSyncAt: integration.lastSyncAt,
        repositoriesCount: integration.repositories.length,
        trackedRepositories: integration.repositories.filter(r => r.isTracked).length
      },
      period: {
        type: period,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching GitLab analytics:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch analytics',
      details: error.message 
    }, { status: 500 });
  }
}

/**
 * POST /api/gitlab/analytics/sync
 * Trigger manual sync of GitLab data
 */
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Connect to database
    await connectToDatabase();

    // Trigger sync for the user
    const syncResult = await GitLabSyncService.syncUserActivity(session.user.id);

    if (!syncResult.success) {
      return NextResponse.json({ 
        error: 'Sync failed',
        details: syncResult.error 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'GitLab data synced successfully',
      syncResults: syncResult.syncResults,
      totalActivities: syncResult.totalActivities
    });

  } catch (error) {
    console.error('Error syncing GitLab data:', error);
    return NextResponse.json({ 
      error: 'Failed to sync GitLab data',
      details: error.message 
    }, { status: 500 });
  }
}