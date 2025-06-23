import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../utils/database';
import User from '../../../../models/User';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'super-admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Calculate user segments based on real data
    const totalUsers = await User.countDocuments({ isActive: true });
    const activeUsers = await User.countDocuments({ 
      isActive: true, 
      lastLoginAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Active in last 7 days
    });
    const inactiveUsers = totalUsers - activeUsers;
    const interns = await User.countDocuments({ role: 'intern', isActive: true });
    const mentors = await User.countDocuments({ role: 'mentor', isActive: true });
    const admins = await User.countDocuments({ role: 'admin', isActive: true });
    const superAdmins = await User.countDocuments({ role: 'super-admin', isActive: true });

    const segments = [
      {
        id: 1,
        name: 'Active Users',
        description: 'Users active in the last 7 days',
        count: activeUsers,
        color: '#10B981'
      },
      {
        id: 2,
        name: 'Inactive Users',
        description: 'Users not active in the last 7 days',
        count: inactiveUsers,
        color: '#6B7280'
      },
      {
        id: 3,
        name: 'Interns',
        description: 'Users with intern role',
        count: interns,
        color: '#3B82F6'
      },
      {
        id: 4,
        name: 'Mentors',
        description: 'Users with mentor role',
        count: mentors,
        color: '#F59E0B'
      },
      {
        id: 5,
        name: 'Admins',
        description: 'Users with admin role',
        count: admins,
        color: '#8B5CF6'
      },
      {
        id: 6,
        name: 'Super Admins',
        description: 'Users with super-admin role',
        count: superAdmins,
        color: '#7C3AED'
      }
    ];

    return NextResponse.json({ segments });

  } catch (error) {
    console.error('Error fetching user segments:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch user segments' 
    }, { status: 500 });
  }
}