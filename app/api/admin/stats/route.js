import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route.js';
import { connectToDatabase } from '../../../../utils/database.js';
import User from '../../../../models/User.js';
import College from '../../../../models/College.js';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Get system statistics
    const [totalUsers, totalColleges, totalMentors, totalInterns] = await Promise.all([
      User.countDocuments({ isActive: true }),
      College.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'mentor', isActive: true }),
      User.countDocuments({ role: 'intern', isActive: true })
    ]);

    return NextResponse.json({
      totalUsers,
      totalColleges,
      totalMentors,
      totalInterns
    });

  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch statistics' 
    }, { status: 500 });
  }
}