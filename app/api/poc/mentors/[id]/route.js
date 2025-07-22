import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../../utils/database';
import User from '../../../../../models/User';

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'POC') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const updateData = await request.json();

    await connectToDatabase();

    // Get the mentor to update
    const mentor = await User.findById(id);
    if (!mentor || mentor.role !== 'Tech Lead') {
      return NextResponse.json({ error: 'Tech Lead not found' }, { status: 404 });
    }

    // Verify super-mentor can manage this mentor
    const superTech Lead = await User.findById(session.user.id);
    if (!superTech Lead || superTech Lead.college.toString() !== mentor.college.toString()) {
      return NextResponse.json({ error: 'Cannot update mentor from different college' }, { status: 403 });
    }

    // Update mentor
    const updatedTech Lead = await User.findByIdAndUpdate(
      id,
      {
        name: updateData.name,
        email: updateData.email,
        specialization: updateData.specialization,
        lastTokenRefresh: new Date() // Trigger token refresh for profile changes
      },
      { new: true }
    );

    return NextResponse.json({ 
      success: true, 
      message: 'Tech Lead updated successfully',
      mentor: updatedTech Lead
    });

  } catch (error) {
    console.error('Error updating mentor:', error);
    return NextResponse.json({ 
      error: 'Failed to update mentor' 
    }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'POC') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    await connectToDatabase();

    // Get the mentor to delete
    const mentor = await User.findById(id);
    if (!mentor || mentor.role !== 'Tech Lead') {
      return NextResponse.json({ error: 'Tech Lead not found' }, { status: 404 });
    }

    // Verify super-mentor can manage this mentor
    const superTech Lead = await User.findById(session.user.id);
    if (!superTech Lead || superTech Lead.college.toString() !== mentor.college.toString()) {
      return NextResponse.json({ error: 'Cannot delete mentor from different college' }, { status: 403 });
    }

    // Soft delete - set isActive to false
    await User.findByIdAndUpdate(id, { 
      isActive: false,
      lastTokenRefresh: new Date() // Trigger token refresh to block access
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Tech Lead removed successfully'
    });

  } catch (error) {
    console.error('Error deleting mentor:', error);
    return NextResponse.json({ 
      error: 'Failed to delete mentor' 
    }, { status: 500 });
  }
}