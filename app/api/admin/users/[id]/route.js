import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route.js';
import { connectToDatabase } from '../../../../../utils/database.js';
import User from '../../../../../models/User.js';
import College from '../../../../../models/College.js';

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { id } = params;
    const { name, email, role, college } = await request.json();

    // Validate required fields
    if (!name || !email || !role) {
      return NextResponse.json({ 
        error: 'Name, email, and role are required' 
      }, { status: 400 });
    }

    // Find the user
    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Validate college for intern role
    if (role === 'intern' && !college) {
      return NextResponse.json({ 
        error: 'College is required for intern role' 
      }, { status: 400 });
    }

    // If changing to mentor role and college is provided, check if college already has a mentor
    if (role === 'mentor' && college && user.role !== 'mentor') {
      const existingMentor = await User.findOne({ 
        role: 'mentor', 
        college: college, 
        isActive: true,
        _id: { $ne: id } // Exclude current user
      });

      if (existingMentor) {
        return NextResponse.json({ 
          error: 'This college already has a mentor assigned' 
        }, { status: 400 });
      }

      // Update college with mentor username
      await College.findByIdAndUpdate(college, {
        mentorUsername: user.gitlabUsername
      });
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      id,
      {
        name,
        email: email.toLowerCase(),
        role,
        college: (role === 'intern' || (role === 'mentor' && college)) ? college : undefined,
        updatedAt: new Date()
      },
      { new: true }
    ).populate('college');

    return NextResponse.json(updatedUser);

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ 
      error: 'Failed to update user' 
    }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { id } = params;

    // Find and soft delete the user
    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent admin from deleting themselves
    if (user.gitlabUsername === session.user.gitlabUsername) {
      return NextResponse.json({ 
        error: 'Cannot delete your own account' 
      }, { status: 400 });
    }

    // Soft delete by setting isActive to false
    user.isActive = false;
    await user.save();

    return NextResponse.json({ message: 'User deleted successfully' });

  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ 
      error: 'Failed to delete user' 
    }, { status: 500 });
  }
}