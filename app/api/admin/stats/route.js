import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../utils/database';
import User from '../../../../models/User';
import College from '../../../../models/College';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Get user statistics
    const totalUsers = await User.countDocuments({ isActive: true });
    const totalMentors = await User.countDocuments({ role: 'mentor', isActive: true });
    const totalInterns = await User.countDocuments({ role: 'intern', isActive: true });
    const totalAdmins = await User.countDocuments({ role: 'admin', isActive: true });
    
    // Get college statistics
    const totalColleges = await College.countDocuments({ isActive: true });
    
    // Calculate active users (users who logged in within last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const activeUsers = await User.countDocuments({ 
      isActive: true, 
      lastLoginAt: { $gte: thirtyDaysAgo } 
    });

    const stats = {
      totalUsers,
      totalColleges,
      totalMentors,
      totalInterns,
      totalAdmins,
      activeUsers,
      systemHealth: 98, // This could be calculated based on various metrics
      avgPerformance: 85, // This would come from performance tracking
      tasksCompleted: 0 // This would come from task management system
    };

    return NextResponse.json({ stats });

  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch statistics' 
    }, { status: 500 });
  }
}