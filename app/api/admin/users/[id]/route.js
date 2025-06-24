import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../../utils/database';
import User from '../../../../../models/User';
import College from '../../../../../models/College';


// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { id } = params;
    const { name, email, role, college, gitlabUsername } = await request.json();

    // Validate required fields
    if (!name || !email || !role || !gitlabUsername) {
      return NextResponse.json({ 
        error: 'Name, email, role, and GitLab username are required' 
      }, { status: 400 });
    }

    // Find the user
    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if GitLab username is already taken by another user
    if (gitlabUsername !== user.gitlabUsername) {
      const existingUser = await User.findOne({ 
        gitlabUsername: gitlabUsername.toLowerCase(),
        _id: { $ne: id }
      });
      
      if (existingUser) {
        return NextResponse.json({ 
          error: 'GitLab username is already taken' 
        }, { status: 400 });
      }
    }

    // Check if email is already taken by another user
    if (email !== user.email) {
      const existingEmailUser = await User.findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: id }
      });
      
      if (existingEmailUser) {
        return NextResponse.json({ 
          error: 'Email is already taken' 
        }, { status: 400 });
      }
    }

    // Find college ObjectId if college is provided
    let collegeId = null;
    if (college && (role === 'intern' || role === 'mentor' || role === 'super-mentor')) {
      const collegeDoc = await College.findOne({ 
        name: college.trim(),
        isActive: true 
      });
      
      if (!collegeDoc) {
        return NextResponse.json({ 
          error: `College "${college}" not found. Please make sure the college exists.` 
        }, { status: 400 });
      }
      
      collegeId = collegeDoc._id;
    }

    // Validate college for roles that require it
    if ((role === 'intern' || role === 'mentor' || role === 'super-mentor') && !college) {
      return NextResponse.json({ 
        error: 'College is required for intern, mentor, and super-mentor roles' 
      }, { status: 400 });
    }

    // If changing to mentor role and college is provided, check if college already has a mentor
    if (role === 'mentor' && collegeId && user.role !== 'mentor') {
      const existingMentor = await User.findOne({ 
        role: 'mentor', 
        college: collegeId, 
        isActive: true,
        _id: { $ne: id } // Exclude current user
      });

      if (existingMentor) {
        return NextResponse.json({ 
          error: 'This college already has a mentor assigned' 
        }, { status: 400 });
      }

      // Update college with mentor username
      await College.findByIdAndUpdate(collegeId, {
        mentorUsername: gitlabUsername.toLowerCase()
      });
    }

    // Prepare update data
    const updateData = {
      name,
      email: email.toLowerCase(),
      gitlabUsername: gitlabUsername.toLowerCase(),
      role,
      updatedAt: new Date()
    };

    if (collegeId) {
      updateData.college = collegeId;
    }

    // Add token refresh trigger for role/status changes
    if (updateData.role || updateData.isActive !== undefined) {
      updateData.lastTokenRefresh = new Date();
      console.log(`🔄 Triggering token refresh for user update: ${updateData.gitlabUsername || 'unknown'}`);
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).populate('college');

    console.log(`✅ User updated: ${updatedUser.gitlabUsername} - Role: ${updatedUser.role}, Active: ${updatedUser.isActive}`);

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
    await user.save({ validateBeforeSave: false });

    return NextResponse.json({ message: 'User deleted successfully' });

  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ 
      error: 'Failed to delete user' 
    }, { status: 500 });
  }
}