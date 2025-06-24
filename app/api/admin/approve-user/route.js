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
    
    const { userId, newRole, collegeId } = await request.json();
    
    if (!userId || !newRole) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    await connectToDatabase();
    
    const updateData = {
      role: newRole,
      updatedAt: new Date()
    };
    
    // Add college if provided
    if (collegeId) {
      updateData.college = collegeId;
    }
    
    const user = await User.findByIdAndUpdate(userId, updateData, { new: true }).populate('college');
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    console.log(`✅ Admin ${session.user.gitlabUsername} approved user ${user.gitlabUsername} with role ${newRole}`);
    
    return NextResponse.json({
      message: 'User approved successfully',
      user: {
        id: user._id.toString(),
        gitlabUsername: user.gitlabUsername,
        role: user.role,
        college: user.college?.name
      }
    });
    
  } catch (error) {
    console.error('Error approving user:', error);
    return NextResponse.json({ 
      error: 'Failed to approve user',
      details: error.message 
    }, { status: 500 });
  }
}