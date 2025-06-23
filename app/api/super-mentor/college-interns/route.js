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

    // Get all interns in the same college
    const interns = await User.find({ 
      role: 'intern', 
      college: superMentor.college._id,
      isActive: true 
    })
    .populate('college', 'name')
    .populate('assignedMentor', 'name email')
    .select('gitlabUsername name email college assignedMentor isActive createdAt lastLoginAt')
    .sort({ createdAt: -1 });

    // Format interns for frontend
    const formattedInterns = interns.map(intern => ({
      _id: intern._id,
      id: intern._id,
      gitlabUsername: intern.gitlabUsername,
      name: intern.name,
      email: intern.email,
      college_name: intern.college?.name || 'N/A',
      status: intern.isActive ? 'active' : 'inactive',
      assignedMentor: intern.assignedMentor?._id || null,
      assignedMentorName: intern.assignedMentor?.name || null,
      createdAt: intern.createdAt,
      lastLoginAt: intern.lastLoginAt,
      // Mock data for now - these would come from other collections
      total_tasks: Math.floor(Math.random() * 20) + 5,
      completed_tasks: Math.floor(Math.random() * 15) + 2,
      completion_rate: Math.floor(Math.random() * 40) + 60,
      performance_score: Math.floor(Math.random() * 30) + 70
    }));

    return NextResponse.json({ interns: formattedInterns });

  } catch (error) {
    console.error('Error fetching college interns:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch college interns' 
    }, { status: 500 });
  }
}