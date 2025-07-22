import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../lib/mongoose';
import User from '../../../../models/User';
import College from '../../../../models/College';

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
      college: superTechLead.college,
      stats,
      mentors,
      interns,
      superTechLead: {
        name: superTechLead.name,
        gitlabUsername: superTechLead.gitlabUsername,
        email: superTechLead.email
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