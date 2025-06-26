import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route.js';
import { connectToDatabase } from '../../../../utils/database.js';
import User from '../../../../models/User.js';
import { testOAuthConnection } from '../../../../utils/gitlab-oauth-api.js';

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

    // Test OAuth connection
    const testResult = await testOAuthConnection(user._id);

    return Response.json({
      ...testResult,
      tokenType: 'oauth',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error testing OAuth connection:', error);
    return Response.json({ 
      success: false,
      error: 'Failed to test OAuth connection',
      details: error.message,
      tokenType: 'oauth'
    }, { status: 500 });
  }
}