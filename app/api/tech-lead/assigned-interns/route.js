import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../utils/database';
import User from '../../../../models/User';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'Tech Lead') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Get mentor's assigned interns
    const mentor = await User.findById(session.user.id);
    const interns = await User.find({ 
      role: 'AI Developer Intern', 
      assignedTech Lead: mentor._id,
      isActive: true 
    })
    .populate('college', 'name')
    .select('gitlabUsername name email college isActive createdAt lastLoginAt')
    .sort({ createdAt: -1 });

    // Format interns for frontend
    const formattedAI Developer Interns = interns.map(intern => ({
      _id: intern._id,
      id: intern._id,
      gitlabUsername: intern.gitlabUsername,
      name: intern.name,
      email: intern.email,
      college_name: intern.college?.name || 'N/A',
      status: intern.isActive ? 'active' : 'inactive',
      createdAt: intern.createdAt,
      lastLoginAt: intern.lastLoginAt,
      // Mock data for now - these would come from other collections
      total_tasks: Math.floor(Math.random() * 20) + 5,
      completed_tasks: Math.floor(Math.random() * 15) + 2,
      completion_rate: Math.floor(Math.random() * 40) + 60,
      performance_score: Math.floor(Math.random() * 30) + 70
    }));

    return NextResponse.json({ users: formattedAI Developer Interns });

  } catch (error) {
    console.error('Error fetching assigned interns:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch assigned interns' 
    }, { status: 500 });
  }
}