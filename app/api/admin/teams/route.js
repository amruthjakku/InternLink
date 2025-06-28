import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../lib/mongoose';
import User from '../../../../models/User';
import College from '../../../../models/College';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !['admin', 'super-admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Fetch teams by finding mentors with assigned interns
    const mentorsWithInterns = await User.find({
      role: { $in: ['mentor', 'super-mentor'] },
      isActive: true
    }).populate('college', 'name location');

    const teams = [];
    
    for (const mentor of mentorsWithInterns) {
      const interns = await User.find({
        mentorId: mentor._id,
        role: 'intern',
        isActive: true
      });

      if (interns.length > 0) {
        teams.push({
          _id: `team_${mentor._id}`,
          name: `${mentor.name}'s Team`,
          mentor: mentor,
          interns: interns,
          collegeId: mentor.college._id,
          college: mentor.college,
          createdAt: mentor.createdAt
        });
      }
    }

    return NextResponse.json({
      teams,
      total: teams.length
    });

  } catch (error) {
    console.error('Error fetching teams:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch teams',
      details: error.message 
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !['admin', 'super-admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { mentorId, internIds, collegeId, name } = await request.json();

    if (!mentorId || !internIds || !Array.isArray(internIds) || internIds.length === 0) {
      return NextResponse.json({ 
        error: 'Mentor ID and intern IDs are required' 
      }, { status: 400 });
    }

    await connectToDatabase();

    // Verify mentor exists and is active
    const mentor = await User.findOne({
      _id: mentorId,
      role: { $in: ['mentor', 'super-mentor'] },
      isActive: true
    });

    if (!mentor) {
      return NextResponse.json({ 
        error: 'Mentor not found or inactive' 
      }, { status: 404 });
    }

    // Verify interns exist and are unassigned
    const interns = await User.find({
      _id: { $in: internIds },
      role: 'intern',
      isActive: true,
      mentorId: { $exists: false }
    });

    if (interns.length !== internIds.length) {
      return NextResponse.json({ 
        error: 'Some interns not found, inactive, or already assigned' 
      }, { status: 400 });
    }

    // Assign interns to mentor
    const updateResult = await User.updateMany(
      { _id: { $in: internIds } },
      { 
        mentorId: mentorId,
        assignedBy: session.user.gitlabUsername,
        assignedAt: new Date()
      }
    );

    // Log the team creation
    console.log(`Team created: ${mentor.name} assigned ${interns.length} interns`);

    return NextResponse.json({
      message: 'Team created successfully',
      team: {
        mentor: mentor,
        interns: interns,
        assignedCount: updateResult.modifiedCount
      }
    });

  } catch (error) {
    console.error('Error creating team:', error);
    return NextResponse.json({ 
      error: 'Failed to create team',
      details: error.message 
    }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !['admin', 'super-admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mentorId = searchParams.get('mentorId');

    if (!mentorId) {
      return NextResponse.json({ 
        error: 'Mentor ID is required' 
      }, { status: 400 });
    }

    await connectToDatabase();

    // Unassign all interns from this mentor
    const updateResult = await User.updateMany(
      { mentorId: mentorId },
      { 
        $unset: { 
          mentorId: 1,
          assignedBy: 1,
          assignedAt: 1
        }
      }
    );

    return NextResponse.json({
      message: 'Team disbanded successfully',
      unassignedCount: updateResult.modifiedCount
    });

  } catch (error) {
    console.error('Error disbanding team:', error);
    return NextResponse.json({ 
      error: 'Failed to disband team',
      details: error.message 
    }, { status: 500 });
  }
}