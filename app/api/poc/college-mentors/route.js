import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../utils/database';
import User from '../../../../models/User';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'super-mentor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Get super-mentor's college
    const superMentor = await User.findById(session.user.id).populate('college');
    if (!superMentor || !superMentor.college) {
      return NextResponse.json({ error: 'Super-mentor college not found' }, { status: 404 });
    }

    // Get all mentors in the same college
    const mentors = await User.find({ 
      role: 'mentor', 
      college: superMentor.college._id,
      isActive: true 
    })
    .populate('college', 'name')
    .select('gitlabUsername name email college isActive createdAt lastLoginAt')
    .sort({ createdAt: -1 });

    // Get assigned interns count for each mentor
    const mentorsWithStats = await Promise.all(mentors.map(async (mentor) => {
      const assignedInterns = await User.countDocuments({
        role: 'AI developer Intern',
        college: mentor.college._id,
        assignedBy: mentor.gitlabUsername,
        isActive: true
      });

      return {
        _id: mentor._id,
        gitlabUsername: mentor.gitlabUsername,
        name: mentor.name,
        email: mentor.email,
        college_name: mentor.college?.name || 'N/A',
        status: mentor.isActive ? 'active' : 'inactive',
        createdAt: mentor.createdAt,
        lastLoginAt: mentor.lastLoginAt,
        assignedInterns: assignedInterns,
        specialization: 'General' // This would come from a profile field
      };
    }));

    return NextResponse.json({ mentors: mentorsWithStats });

  } catch (error) {
    console.error('Error fetching college mentors:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch college mentors' 
    }, { status: 500 });
  }
}