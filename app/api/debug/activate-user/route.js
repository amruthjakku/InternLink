import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../utils/database';
import User from '../../../../models/User';
import College from '../../../../models/College';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    const { email, gitlabUsername, activate } = await request.json();
    
    if (!email && !gitlabUsername) {
      return NextResponse.json({ error: 'Email or username required' }, { status: 400 });
    }
    
    await connectToDatabase();
    
    // Find user by email or username
    const user = await User.findOne({
      $or: [
        { email: email },
        { gitlabUsername: gitlabUsername }
      ]
    }).populate('college');
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Update user activation status
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        isActive: activate !== false, // Default to true unless explicitly false
        lastTokenRefresh: new Date(), // Force session refresh
        sessionVersion: (user.sessionVersion || 1) + 1,
        updatedAt: new Date()
      },
      { new: true }
    ).populate('college');
    
    console.log(`🔄 User activation changed: ${updatedUser.gitlabUsername} - Active: ${updatedUser.isActive}`);
    
    return NextResponse.json({
      message: `User ${activate !== false ? 'activated' : 'deactivated'} successfully`,
      user: {
        id: updatedUser._id.toString(),
        gitlabUsername: updatedUser.gitlabUsername,
        email: updatedUser.email,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
        college: updatedUser.college?.name,
        lastTokenRefresh: updatedUser.lastTokenRefresh
      }
    });
    
  } catch (error) {
    console.error('User activation error:', error);
    return NextResponse.json({ 
      error: 'Failed to update user activation',
      details: error.message 
    }, { status: 500 });
  }
}