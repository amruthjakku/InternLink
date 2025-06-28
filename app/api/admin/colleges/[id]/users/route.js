import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../../../lib/mongoose';
import User from '../../../../../../models/User';
import College from '../../../../../../models/College';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !['admin', 'super-admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json({ 
        error: 'College ID is required' 
      }, { status: 400 });
    }

    await connectToDatabase();

    // Verify college exists
    const college = await College.findById(id);
    if (!college) {
      return NextResponse.json({ 
        error: 'College not found' 
      }, { status: 404 });
    }

    // Fetch all users for this college
    const users = await User.find({
      college: id,
      isActive: true
    })
    .populate('mentorId', 'name gitlabUsername')
    .populate('cohortId', 'name')
    .sort({ role: 1, name: 1 });

    // Group users by role
    const groupedUsers = {
      'super-mentor': users.filter(u => u.role === 'super-mentor'),
      'mentor': users.filter(u => u.role === 'mentor'),
      'intern': users.filter(u => u.role === 'intern'),
      'other': users.filter(u => !['super-mentor', 'mentor', 'intern'].includes(u.role))
    };

    // Calculate statistics
    const stats = {
      total: users.length,
      superMentors: groupedUsers['super-mentor'].length,
      mentors: groupedUsers['mentor'].length,
      interns: groupedUsers['intern'].length,
      assignedInterns: groupedUsers['intern'].filter(u => u.mentorId).length,
      unassignedInterns: groupedUsers['intern'].filter(u => !u.mentorId).length
    };

    return NextResponse.json({
      college,
      users,
      groupedUsers,
      stats
    });

  } catch (error) {
    console.error('Error fetching college users:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch college users',
      details: error.message 
    }, { status: 500 });
  }
}