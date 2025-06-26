import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route.js';
import { connectToDatabase } from '../../../../utils/database.js';
import User from '../../../../models/User.js';
import GitLabIntegration from '../../../../models/GitLabIntegration.js';

/**
 * Unified GitLab Status Endpoint
 * Shows comprehensive status of all GitLab integrations
 */
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

    // Check OAuth integration
    const oauthIntegration = await GitLabIntegration.findOne({
      userId: user._id,
      tokenType: 'oauth',
      isActive: true
    });

    // Check PAT integration
    const patIntegration = await GitLabIntegration.findOne({
      userId: user._id,
      tokenType: 'personal_access_token',
      isActive: true
    });

    // OAuth status
    const hasOAuthToken = !!session.gitlabAccessToken;
    const hasOAuthIntegration = !!oauthIntegration;
    const oauthTokenExpired = session.gitlabTokenExpires ? 
      (session.gitlabTokenExpires * 1000) < Date.now() : false;
    const canUseOAuth = hasOAuthToken && hasOAuthIntegration && !oauthTokenExpired;

    // PAT status
    const hasPATIntegration = !!patIntegration;

    // Determine preferred method and overall status
    const preferredMethod = canUseOAuth ? 'oauth' : (hasPATIntegration ? 'pat' : null);
    const connected = canUseOAuth || hasPATIntegration;

    // Migration status
    const needsOAuthUpgrade = hasPATIntegration && !canUseOAuth;
    const migrationStatus = patIntegration?.migrationStatus || 'none';

    // Integration details
    const activeIntegration = canUseOAuth ? oauthIntegration : patIntegration;
    const integrationDetails = activeIntegration ? {
      gitlabUsername: activeIntegration.gitlabUsername,
      connectedAt: activeIntegration.connectedAt,
      lastSyncAt: activeIntegration.lastSyncAt,
      repositoryCount: activeIntegration.repositories?.length || 0,
      tokenType: activeIntegration.tokenType,
      gitlabInstance: activeIntegration.gitlabInstance || 'https://code.swecha.org'
    } : null;

    return Response.json({
      // Overall status
      connected,
      preferredMethod,
      
      // OAuth details
      oauth: {
        hasToken: hasOAuthToken,
        hasIntegration: hasOAuthIntegration,
        tokenExpired: oauthTokenExpired,
        canUse: canUseOAuth,
        tokenExpires: session.gitlabTokenExpires ? new Date(session.gitlabTokenExpires * 1000) : null
      },
      
      // PAT details
      pat: {
        hasIntegration: hasPATIntegration,
        canUse: hasPATIntegration
      },
      
      // Migration info
      migration: {
        needsUpgrade: needsOAuthUpgrade,
        status: migrationStatus,
        requestedAt: patIntegration?.migrationRequestedAt || null
      },
      
      // Active integration details
      integration: integrationDetails,
      
      // Recommendations
      recommendations: generateRecommendations({
        connected,
        canUseOAuth,
        hasPATIntegration,
        needsOAuthUpgrade,
        hasOAuthToken
      }),
      
      // Metadata
      meta: {
        timestamp: new Date().toISOString(),
        userId: user._id,
        gitlabUsername: user.gitlabUsername
      }
    });
  } catch (error) {
    console.error('Error checking unified GitLab status:', error);
    return Response.json({ 
      error: 'Failed to check GitLab status',
      details: error.message 
    }, { status: 500 });
  }
}

/**
 * Generate user-friendly recommendations based on current status
 */
function generateRecommendations(status) {
  const recommendations = [];

  if (!status.connected) {
    recommendations.push({
      type: 'connect',
      priority: 'high',
      title: 'Connect GitLab Account',
      description: 'Connect your GitLab account to start tracking your commits and projects.',
      action: 'oauth_connect',
      actionText: 'Connect via OAuth'
    });
  } else if (status.needsOAuthUpgrade) {
    recommendations.push({
      type: 'upgrade',
      priority: 'medium',
      title: 'Upgrade to OAuth',
      description: 'Switch to OAuth for better security and automatic token management.',
      action: 'oauth_upgrade',
      actionText: 'Upgrade to OAuth'
    });
  } else if (status.canUseOAuth) {
    recommendations.push({
      type: 'success',
      priority: 'low',
      title: 'OAuth Connected',
      description: 'Your GitLab account is connected via OAuth with automatic token management.',
      action: 'sync',
      actionText: 'Sync Data'
    });
  }

  if (!status.hasOAuthToken && status.hasPATIntegration) {
    recommendations.push({
      type: 'info',
      priority: 'low',
      title: 'OAuth Available',
      description: 'You can upgrade to OAuth authentication for a better experience.',
      action: 'oauth_info',
      actionText: 'Learn More'
    });
  }

  return recommendations;
}