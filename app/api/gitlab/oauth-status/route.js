import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route.js';
import { connectToDatabase } from '../../../../utils/database.js';
import GitLabIntegration from '../../../../models/GitLabIntegration.js';
import User from '../../../../models/User.js';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    // Get user from database
    const user = await User.findById(session.user.id);
    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has OAuth integration
    const integration = await GitLabIntegration.findOne({
      userId: user._id,
      tokenType: 'oauth',
      isActive: true
    });

    const hasOAuthToken = !!session.gitlabAccessToken;
    const hasStoredIntegration = !!integration;
    const tokenExpired = integration?.tokenExpiresAt ? new Date(integration.tokenExpiresAt) <= new Date() : false;

    return Response.json({
      hasOAuthToken,
      hasStoredIntegration,
      tokenExpired,
      canUseOAuth: hasOAuthToken && hasStoredIntegration && !tokenExpired,
      integration: integration ? {
        gitlabUsername: integration.gitlabUsername,
        connectedAt: integration.connectedAt,
        lastSyncAt: integration.lastSyncAt,
        repositoryCount: integration.repositories?.length || 0
      } : null
    });
  } catch (error) {
    console.error('Error checking OAuth status:', error);
    return Response.json({ 
      error: 'Failed to check OAuth status',
      details: error.message 
    }, { status: 500 });
  }
}