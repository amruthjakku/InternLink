import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../utils/database';
import User from '../../../../models/User';
import College from '../../../../models/College';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { username } = await request.json();
    
    if (!username) {
      return NextResponse.json({ error: 'Username required' }, { status: 400 });
    }
    
    await connectToDatabase();
    
    // Find the user and update their record to trigger JWT refresh
    const user = await User.findByGitLabUsername(username, 'college');
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Force update to trigger JWT refresh on next request
    user.lastTokenRefresh = new Date();
    user.updatedAt = new Date();
    await user.save();
    
    console.log(`🔄 Admin ${session.user.gitlabUsername} forced session refresh for user: ${username}`);
    
    return NextResponse.json({
      message: `Session refresh triggered for ${username}`,
      instruction: 'User should refresh their browser or sign out and back in',
      user: {
        gitlabUsername: user.gitlabUsername,
        role: user.role,
        isActive: user.isActive,
        college: user.college?.name,
        lastTokenRefresh: user.lastTokenRefresh
      }
    });
    
  } catch (error) {
    console.error('Force refresh session error:', error);
    return NextResponse.json({ 
      error: 'Failed to force refresh session',
      details: error.message 
    }, { status: 500 });
  }
}