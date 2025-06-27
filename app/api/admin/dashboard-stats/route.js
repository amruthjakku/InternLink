import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../utils/database';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import User from '../../../../models/User';
import College from '../../../../models/College';
import Cohort from '../../../../models/Cohort';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    // Get user statistics using Mongoose models
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const inactiveUsers = await User.countDocuments({ isActive: false });
    const totalInterns = await User.countDocuments({ role: 'intern' });
    const totalMentors = await User.countDocuments({ role: 'mentor' });
    const totalSuperMentors = await User.countDocuments({ role: 'super-mentor' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    
    // Get college statistics
    const totalColleges = await College.countDocuments();
    const activeColleges = await College.countDocuments({ isActive: true });
    
    // Get cohort statistics
    const totalCohorts = await Cohort.countDocuments();
    const activeCohorts = await Cohort.countDocuments({ isActive: true });
    
    // Calculate system health based on active users ratio
    const systemHealth = Math.round((activeUsers / Math.max(totalUsers, 1)) * 100);
    
    // Calculate real average performance based on user activity
    const recentlyActiveUsers = await User.countDocuments({
      isActive: true,
      lastLoginAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    });
    
    const avgPerformance = totalUsers > 0 ? 
      Math.round(((recentlyActiveUsers / totalUsers) * 100 * 0.8) + (systemHealth * 0.2)) : 0;
    
    // Get additional real-time stats
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const newUsersToday = await User.countDocuments({
      createdAt: { $gte: todayStart }
    });
    
    const loginsToday = await User.countDocuments({
      lastLoginAt: { $gte: todayStart }
    });

    const stats = {
      totalUsers,
      activeUsers,
      inactiveUsers,
      totalInterns,
      totalMentors,
      totalSuperMentors,
      totalAdmins,
      totalColleges,
      activeColleges,
      totalCohorts,
      activeCohorts,
      systemHealth,
      avgPerformance,
      newUsersToday,
      loginsToday,
      recentlyActiveUsers,
      userActivityRate: totalUsers > 0 ? Math.round((recentlyActiveUsers / totalUsers) * 100) : 0,
      collegeUtilization: totalColleges > 0 ? Math.round((activeColleges / totalColleges) * 100) : 0,
      lastUpdated: new Date().toISOString()
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}