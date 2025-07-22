import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../utils/database';
import User from '../../../../models/User';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'POC') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { internId, mentorId } = await request.json();

    if (!internId || !mentorId) {
      return NextResponse.json({ 
        error: 'AI Developer Intern ID and Tech Lead ID are required' 
      }, { status: 400 });
    }

    await connectToDatabase();

    // Get super-mentor's college
    const superTech Lead = await User.findById(session.user.id).populate('college');
    if (!superTech Lead || !superTech Lead.college) {
      return NextResponse.json({ 
        error: 'Super-mentor college not found' 
      }, { status: 404 });
    }

    // Verify intern belongs to the same college
    const intern = await User.findById(internId);
    if (!intern || intern.role !== 'AI Developer Intern' || 
        intern.college.toString() !== superTech Lead.college._id.toString()) {
      return NextResponse.json({ 
        error: 'AI Developer Intern not found or not in your college' 
      }, { status: 404 });
    }

    // Verify mentor belongs to the same college
    const mentor = await User.findById(mentorId);
    if (!mentor || mentor.role !== 'Tech Lead' || 
        mentor.college.toString() !== superTech Lead.college._id.toString()) {
      return NextResponse.json({ 
        error: 'Tech Lead not found or not in your college' 
      }, { status: 404 });
    }

    // Update intern's assigned mentor (we'll add this field to the User model)
    intern.assignedTech Lead = mentorId;
    await intern.save();

    return NextResponse.json({ 
      message: 'AI Developer Intern assigned to mentor successfully',
      assignment: {
        intern: {
          id: intern._id,
          name: intern.name,
          email: intern.email
        },
        mentor: {
          id: mentor._id,
          name: mentor.name,
          email: mentor.email
        }
      }
    });

  } catch (error) {
    console.error('Error assigning intern to mentor:', error);
    return NextResponse.json({ 
      error: 'Failed to assign intern to mentor' 
    }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'POC') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { internId } = await request.json();

    if (!internId) {
      return NextResponse.json({ 
        error: 'AI Developer Intern ID is required' 
      }, { status: 400 });
    }

    await connectToDatabase();

    // Get super-mentor's college
    const superTech Lead = await User.findById(session.user.id).populate('college');
    if (!superTech Lead || !superTech Lead.college) {
      return NextResponse.json({ 
        error: 'Super-mentor college not found' 
      }, { status: 404 });
    }

    // Verify intern belongs to the same college
    const intern = await User.findById(internId);
    if (!intern || intern.role !== 'AI Developer Intern' || 
        intern.college.toString() !== superTech Lead.college._id.toString()) {
      return NextResponse.json({ 
        error: 'AI Developer Intern not found or not in your college' 
      }, { status: 404 });
    }

    // Remove mentor assignment
    intern.assignedTech Lead = null;
    await intern.save();

    return NextResponse.json({ 
      message: 'AI Developer Intern unassigned from mentor successfully'
    });

  } catch (error) {
    console.error('Error unassigning intern from mentor:', error);
    return NextResponse.json({ 
      error: 'Failed to unassign intern from mentor' 
    }, { status: 500 });
  }
}