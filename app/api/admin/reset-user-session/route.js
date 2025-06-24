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
    
    // Find and update the user with aggressive session refresh triggers
    const user = await User.findByGitLabUsername(username, 'college');
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Force complete session refresh by updating multiple trigger fields
    const now = new Date();
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        lastTokenRefresh: now,
        updatedAt: now,
        sessionVersion: (user.sessionVersion || 0) + 1, // Version bump to invalidate old tokens
        lastSessionReset: now
      },
      { new: true }
    ).populate('college');
    
    console.log(`🔄 Admin ${session.user.gitlabUsername} reset session for user: ${username}`);
    console.log(`   User details: Role=${updatedUser.role}, Active=${updatedUser.isActive}, College=${updatedUser.college?.name}`);
    
    return NextResponse.json({
      message: `Complete session reset triggered for ${username}`,
      instructions: [
        'User must refresh their browser completely (F5 or Cmd+R)',
        'If that doesn\'t work, user should clear browser cache',
        'As last resort, user should sign out and back in',
        'Changes should be immediate for new sign-ins'
      ],
      user: {
        gitlabUsername: updatedUser.gitlabUsername,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
        college: updatedUser.college?.name,
        lastTokenRefresh: updatedUser.lastTokenRefresh,
        sessionVersion: updatedUser.sessionVersion,
        lastSessionReset: updatedUser.lastSessionReset
      }
    });
    
  } catch (error) {
    console.error('Reset user session error:', error);
    return NextResponse.json({ 
      error: 'Failed to reset user session',
      details: error.message 
    }, { status: 500 });
  }
}