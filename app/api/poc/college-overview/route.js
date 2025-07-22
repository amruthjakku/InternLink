import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../lib/mongoose';
import User from '../../../../models/User';
import College from '../../../../models/College';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !['POC', 'Super Tech Lead', 'Tech Lead'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized - POC or Tech Lead access required' }, { status: 401 });
    }

    await connectToDatabase();

    // Find the user's college
    const user = await User.findOne({
      $or: [
        { gitlabUsername: session.user.gitlabUsername },
        { email: session.user.email }
      ],
      role: { $in: ['POC', 'Super Tech Lead', 'Tech Lead'] },
      isActive: true
    }).populate('college');

    if (!user || !user.college) {
      return NextResponse.json({ 
        error: 'User not found or not assigned to a college' 
      }, { status: 404 });
    }

    const collegeId = user.college._id;

    // Fetch all users from this college
    const allUsers = await User.find({
      college: collegeId,
      isActive: true
    }).populate('mentorId', 'name gitlabUsername');

    // Separate by roles
    const mentors = allUsers.filter(user => 
      user.role === 'Tech Lead' || user.role === 'POC'
    );
    
    const interns = allUsers.filter(user => user.role === 'AI Developer Intern');

    // Calculate statistics
    const stats = {
      totalTechLeads: mentors.filter(m => m.role === 'Tech Lead').length,
      totalPOCs: mentors.filter(m => m.role === 'POC').length,
      totalAIDeveloperInterns: interns.length,
      assignedAIDeveloperInterns: interns.filter(intern => intern.mentorId).length,
      unassignedAIDeveloperInterns: interns.filter(intern => !intern.mentorId).length,
      totalUsers: allUsers.length
    };

    return NextResponse.json({
      college: user.college,
      stats,
      mentors,
      interns,
      user: {
        name: user.name,
        gitlabUsername: user.gitlabUsername,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Error fetching college overview:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch college overview',
      details: error.message 
    }, { status: 500 });
  }
}