import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route.js';
import { connectToDatabase } from '../../../../../utils/database.js';
import College from '../../../../../models/College.js';
import User from '../../../../../models/User.js';


// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

export async function PATCH(request, { params }) {
  return PUT(request, { params });
}

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { id } = params;
    const { name, description, location, website, superTech LeadUsername } = await request.json();

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

    let superTech Lead = null;
    
    // If super-mentor username is provided and different from current, validate it
    if (superTech LeadUsername && superTech LeadUsername.trim() && superTech LeadUsername !== college.superTech LeadUsername) {
      // Check if super-mentor exists and is available
      superTech Lead = await User.findOne({ 
        gitlabUsername: superTech LeadUsername.toLowerCase(),
        role: 'POC',
        isActive: true 
      });

      if (!superTech Lead) {
        return NextResponse.json({ 
          error: 'Super-mentor not found or not available' 
        }, { status: 400 });
      }

      // Check if super-mentor is already assigned to another college
      const existingAssignment = await College.findOne({ 
        superTech LeadUsername: superTech LeadUsername.toLowerCase(),
        isActive: true,
        _id: { $ne: id }
      });

      if (existingAssignment) {
        return NextResponse.json({ 
          error: 'This super-mentor is already assigned to another college' 
        }, { status: 400 });
      }

      // Update super-mentor's college assignment
      superTech Lead.college = id;
      await superTech Lead.save();

      // If there was a previous super-mentor, remove their college assignment
      if (college.superTech LeadUsername && college.superTech LeadUsername !== 'unassigned') {
        const previousPOC = await User.findOne({
          gitlabUsername: college.superTech LeadUsername,
          role: 'POC',
          isActive: true
        });
        if (previousPOC) {
          previousPOC.college = undefined;
          await previousPOC.save();
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
        superTech LeadUsername: superTech LeadUsername ? superTech LeadUsername.toLowerCase() : 'unassigned',
        updatedAt: new Date()
      },
      { new: true }
    );

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