import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../[...nextauth]/route.js';
import { connectToDatabase } from '../../../../utils/database.js';
import GitLabIntegration from '../../../../models/GitLabIntegration.js';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/clear-gitlab-tokens
 * Clear invalid GitLab OAuth tokens from session and database
 */
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Clear GitLab integration from database
    const result = await GitLabIntegration.updateMany(
      { userId: session.user.id },
      {
        accessToken: null,
        refreshToken: null,
        tokenExpiresAt: null,
        isActive: false,
        updatedAt: new Date()
      }
    );

    console.log(`🧹 Cleared GitLab tokens for user ${session.user.id}, updated ${result.modifiedCount} integrations`);

    return NextResponse.json({
      success: true,
      message: 'GitLab tokens cleared successfully. Please sign out and sign in again to complete the process.',
      clearedIntegrations: result.modifiedCount
    });

  } catch (error) {
    console.error('Error clearing GitLab tokens:', error);
    return NextResponse.json({ 
      error: 'Failed to clear GitLab tokens',
      details: error.message 
    }, { status: 500 });
  }
}