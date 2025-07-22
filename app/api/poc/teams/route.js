import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../lib/mongoose';
import User from '../../../../models/User';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'POC') {
      return NextResponse.json({ error: 'Unauthorized - POC access required' }, { status: 401 });
    }

    await connectToDatabase();

    // Find the POC's college
    const superTechLead = await User.findOne({
      gitlabUsername: session.user.gitlabUsername,
      role: 'POC',
      isActive: true
    }).populate('college');

    if (!superTechLead || !superTechLead.college) {
      return NextResponse.json({ 
        error: 'POC not found or not assigned to a college' 
      }, { status: 404 });
    }

    const collegeId = superTechLead.college._id;

    // Fetch mentors with their assigned interns from this college
    const mentorsWithAIDeveloperInterns = await User.find({
      college: collegeId,
      role: { $in: ['Tech Lead', 'POC'] },
      isActive: true
    }).populate('college', 'name location');

    const teams = [];
    
    for (const mentor of mentorsWithAIDeveloperInterns) {
      const interns = await User.find({
        mentorId: mentor._id,
        role: 'AI Developer Intern',
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
      total: teams.length,
      college: superTechLead.college
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
    
    if (!session?.user || session.user.role !== 'POC') {
      return NextResponse.json({ error: 'Unauthorized - POC access required' }, { status: 401 });
    }

    const { mentorId, internIds } = await request.json();

    if (!mentorId || !internIds || !Array.isArray(internIds) || internIds.length === 0) {
      return NextResponse.json({ 
        error: 'Tech Lead ID and intern IDs are required' 
      }, { status: 400 });
    }

    await connectToDatabase();

    // Find the POC's college
    const superTechLead = await User.findOne({
      gitlabUsername: session.user.gitlabUsername,
      role: 'POC',
      isActive: true
    }).populate('college');

    if (!superTechLead || !superTechLead.college) {
      return NextResponse.json({ 
        error: 'POC not found or not assigned to a college' 
      }, { status: 404 });
    }

    const collegeId = superTechLead.college._id;

    // Verify mentor exists and is in the same college
    const mentor = await User.findOne({
      _id: mentorId,
      college: collegeId,
      role: { $in: ['Tech Lead', 'POC'] },
      isActive: true
    });

    if (!mentor) {
      return NextResponse.json({ 
        error: 'Tech Lead not found in your college or inactive' 
      }, { status: 404 });
    }

    // Verify interns exist, are in the same college, and are unassigned
    const interns = await User.find({
      _id: { $in: internIds },
      college: collegeId,
      role: 'AI Developer Intern',
      isActive: true,
      mentorId: { $exists: false }
    });

    if (interns.length !== internIds.length) {
      return NextResponse.json({ 
        error: 'Some interns not found, inactive, already assigned, or not in your college' 
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
    console.log(`POC ${superTechLead.name} created team: ${mentor.name} assigned ${interns.length} interns`);

    return NextResponse.json({
      message: 'Team created successfully',
      team: {
        mentor: mentor,
        interns: interns,
        assignedCount: updateResult.modifiedCount,
        college: superTechLead.college.name
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
    
    if (!session?.user || session.user.role !== 'POC') {
      return NextResponse.json({ error: 'Unauthorized - POC access required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mentorId = searchParams.get('mentorId');

    if (!mentorId) {
      return NextResponse.json({ 
        error: 'Tech Lead ID is required' 
      }, { status: 400 });
    }

    await connectToDatabase();

    // Find the POC's college
    const superTechLead = await User.findOne({
      gitlabUsername: session.user.gitlabUsername,
      role: 'POC',
      isActive: true
    }).populate('college');

    if (!superTechLead || !superTechLead.college) {
      return NextResponse.json({ 
        error: 'POC not found or not assigned to a college' 
      }, { status: 404 });
    }

    const collegeId = superTechLead.college._id;

    // Verify mentor is in the same college
    const mentor = await User.findOne({
      _id: mentorId,
      college: collegeId,
      role: { $in: ['Tech Lead', 'POC'] },
      isActive: true
    });

    if (!mentor) {
      return NextResponse.json({ 
        error: 'Tech Lead not found in your college' 
      }, { status: 404 });
    }

    // Unassign all interns from this mentor (only in the same college)
    const updateResult = await User.updateMany(
      { 
        mentorId: mentorId,
        college: collegeId 
      },
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
      unassignedCount: updateResult.modifiedCount,
      mentor: mentor.name
    });

  } catch (error) {
    console.error('Error disbanding team:', error);
    return NextResponse.json({ 
      error: 'Failed to disband team',
      details: error.message 
    }, { status: 500 });
  }
}