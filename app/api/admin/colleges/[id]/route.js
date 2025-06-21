import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route.js';
import { connectToDatabase } from '../../../../../utils/database.js';
import College from '../../../../../models/College.js';
import User from '../../../../../models/User.js';

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { id } = params;
    const { name, description, location, website, mentorUsername } = await request.json();

    // Validate required fields
    if (!name) {
      return NextResponse.json({ 
        error: 'College name is required' 
      }, { status: 400 });
    }

    // Find the college
    const college = await College.findById(id);
    if (!college) {
      return NextResponse.json({ error: 'College not found' }, { status: 404 });
    }

    // Check if college name already exists (excluding current college)
    const existingCollege = await College.findOne({ 
      name: name.trim(),
      isActive: true,
      _id: { $ne: id }
    });

    if (existingCollege) {
      return NextResponse.json({ 
        error: 'College with this name already exists' 
      }, { status: 400 });
    }

    let mentor = null;
    
    // If mentor username is provided and different from current, validate it
    if (mentorUsername && mentorUsername.trim() && mentorUsername !== college.mentorUsername) {
      // Check if mentor exists and is available
      mentor = await User.findOne({ 
        gitlabUsername: mentorUsername.toLowerCase(),
        role: 'mentor',
        isActive: true 
      });

      if (!mentor) {
        return NextResponse.json({ 
          error: 'Mentor not found or not available' 
        }, { status: 400 });
      }

      // Check if mentor is already assigned to another college
      const existingAssignment = await College.findOne({ 
        mentorUsername: mentorUsername.toLowerCase(),
        isActive: true,
        _id: { $ne: id }
      });

      if (existingAssignment) {
        return NextResponse.json({ 
          error: 'This mentor is already assigned to another college' 
        }, { status: 400 });
      }

      // Update mentor's college assignment
      mentor.college = id;
      await mentor.save();

      // If there was a previous mentor, remove their college assignment
      if (college.mentorUsername && college.mentorUsername !== 'unassigned') {
        const previousMentor = await User.findOne({
          gitlabUsername: college.mentorUsername,
          role: 'mentor',
          isActive: true
        });
        if (previousMentor) {
          previousMentor.college = undefined;
          await previousMentor.save();
        }
      }
    }

    // Update college
    const updatedCollege = await College.findByIdAndUpdate(
      id,
      {
        name: name.trim(),
        description: description?.trim() || '',
        location: location?.trim() || '',
        website: website?.trim() || '',
        mentorUsername: mentorUsername ? mentorUsername.toLowerCase() : 'unassigned',
        updatedAt: new Date()
      },
      { new: true }
    ).populate('mentor');

    return NextResponse.json(updatedCollege);

  } catch (error) {
    console.error('Error updating college:', error);
    return NextResponse.json({ 
      error: 'Failed to update college' 
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

    // Find the college
    const college = await College.findById(id);
    if (!college) {
      return NextResponse.json({ error: 'College not found' }, { status: 404 });
    }

    // Check if college has active users
    const activeUsers = await User.countDocuments({
      college: id,
      isActive: true
    });

    if (activeUsers > 0) {
      return NextResponse.json({ 
        error: `Cannot delete college with ${activeUsers} active users. Please reassign or deactivate users first.` 
      }, { status: 400 });
    }

    // Soft delete by setting isActive to false
    college.isActive = false;
    await college.save();

    return NextResponse.json({ message: 'College deleted successfully' });

  } catch (error) {
    console.error('Error deleting college:', error);
    return NextResponse.json({ 
      error: 'Failed to delete college' 
    }, { status: 500 });
  }
}