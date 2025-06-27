import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../utils/database';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await connectToDatabase();
    
    // Get user statistics
    const totalUsers = await db.collection('users').countDocuments();
    const activeUsers = await db.collection('users').countDocuments({ isActive: true });
    const inactiveUsers = await db.collection('users').countDocuments({ isActive: false });
    const totalInterns = await db.collection('users').countDocuments({ role: 'intern' });
    const totalMentors = await db.collection('users').countDocuments({ role: 'mentor' });
    const totalSuperMentors = await db.collection('users').countDocuments({ role: 'super-mentor' });
    const totalAdmins = await db.collection('users').countDocuments({ role: 'admin' });
    
    // Get college statistics
    const totalColleges = await db.collection('colleges').countDocuments();
    
    // Get cohort statistics
    const totalCohorts = await db.collection('cohorts').countDocuments();
    const activeCohorts = await db.collection('cohorts').countDocuments({ isActive: true });
    
    // Calculate system health (simplified)
    const systemHealth = Math.round((activeUsers / Math.max(totalUsers, 1)) * 100);
    
    // Calculate average performance (simplified - could be based on actual task completion rates)
    const avgPerformance = Math.round(75 + Math.random() * 20); // Mock data for now
    
    const stats = {
      totalUsers,
      activeUsers,
      inactiveUsers,
      totalInterns,
      totalMentors,
      totalSuperMentors,
      totalAdmins,
      totalColleges,
      totalCohorts,
      activeCohorts,
      systemHealth,
      avgPerformance,
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