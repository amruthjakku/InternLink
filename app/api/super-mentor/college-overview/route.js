import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../lib/mongoose';
import User from '../../../../models/User';
import College from '../../../../models/College';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'super-mentor') {
      return NextResponse.json({ error: 'Unauthorized - Super mentor access required' }, { status: 401 });
    }

    await connectToDatabase();

    // Find the super mentor's college
    const superMentor = await User.findOne({
      gitlabUsername: session.user.gitlabUsername,
      role: 'super-mentor',
      isActive: true
    }).populate('college');

    if (!superMentor || !superMentor.college) {
      return NextResponse.json({ 
        error: 'Super mentor not found or not assigned to a college' 
      }, { status: 404 });
    }

    const collegeId = superMentor.college._id;

    // Fetch all users from this college
    const allUsers = await User.find({
      college: collegeId,
      isActive: true
    }).populate('mentorId', 'name gitlabUsername');

    // Separate by roles
    const mentors = allUsers.filter(user => 
      user.role === 'mentor' || user.role === 'super-mentor'
    );
    
    const interns = allUsers.filter(user => user.role === 'intern');

    // Calculate statistics
    const stats = {
      totalMentors: mentors.filter(m => m.role === 'mentor').length,
      totalSuperMentors: mentors.filter(m => m.role === 'super-mentor').length,
      totalInterns: interns.length,
      assignedInterns: interns.filter(intern => intern.mentorId).length,
      unassignedInterns: interns.filter(intern => !intern.mentorId).length,
      totalUsers: allUsers.length
    };

    return NextResponse.json({
      college: superMentor.college,
      stats,
      mentors,
      interns,
      superMentor: {
        name: superMentor.name,
        gitlabUsername: superMentor.gitlabUsername,
        email: superMentor.email
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