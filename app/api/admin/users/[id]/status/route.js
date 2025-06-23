import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../../../utils/database';
import User from '../../../../../../models/User';

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'super-admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const { status } = await request.json();

    if (!['active', 'inactive'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update user status
    user.isActive = status === 'active';
    await user.save();

    return NextResponse.json({ 
      message: `User ${status === 'active' ? 'activated' : 'deactivated'} successfully`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        status: user.isActive ? 'active' : 'inactive'
      }
    });

  } catch (error) {
    console.error('Error updating user status:', error);
    return NextResponse.json({ 
      error: 'Failed to update user status' 
    }, { status: 500 });
  }
}