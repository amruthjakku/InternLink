import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../utils/database.js';
import { scheduledGitLabSync } from '../../../../utils/gitlab-sync.js';

/**
 * POST /api/gitlab/sync
 * Trigger scheduled sync for all active GitLab integrations
 * This endpoint can be called by cron jobs or scheduled tasks
 */
export async function POST(request) {
  try {
    // Optional: Add authentication for scheduled tasks
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.SYNC_API_TOKEN;
    
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Connect to database
    await connectToDatabase();

    console.log('Starting scheduled GitLab sync...');
    const results = await scheduledGitLabSync();
    
    const summary = {
      totalIntegrations: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      errors: results.filter(r => !r.success).map(r => ({
        userId: r.userId,
        error: r.error
      }))
    };

    console.log('Scheduled GitLab sync completed:', summary);

    return NextResponse.json({
      success: true,
      message: 'Scheduled sync completed',
      summary,
      results
    });

  } catch (error) {
    console.error('Error in scheduled GitLab sync:', error);
    return NextResponse.json({ 
      error: 'Scheduled sync failed',
      details: error.message 
    }, { status: 500 });
  }
}

/**
 * GET /api/gitlab/sync
 * Get sync status and statistics
 */
export async function GET(request) {
  try {
    // This could return sync statistics, last run times, etc.
    return NextResponse.json({
      message: 'GitLab sync endpoint is active',
      lastSync: new Date().toISOString(),
      status: 'ready'
    });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to get sync status' 
    }, { status: 500 });
  }
}