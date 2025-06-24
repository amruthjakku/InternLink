import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../[...nextauth]/route';
import { connectToDatabase } from '../../../../utils/database';
import User from '../../../../models/User';
import College from '../../../../models/College';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    await connectToDatabase();
    
    // Fetch the latest user data from database
    const user = await User.findByGitLabUsername(session.user.gitlabUsername, 'college');
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Return updated user data
    const updatedUserData = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      gitlabUsername: user.gitlabUsername,
      gitlabId: user.gitlabId,
      college: user.college,
      assignedBy: user.assignedBy,
      profileImage: user.profileImage,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    return NextResponse.json({ user: updatedUserData });

  } catch (error) {
    console.error('Error refreshing session:', error);
    return NextResponse.json({ 
      error: 'Failed to refresh session' 
    }, { status: 500 });
  }
}