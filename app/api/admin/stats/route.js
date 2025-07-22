import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../utils/database';
import User from '../../../../models/User';
import College from '../../../../models/College';
import Task from '../../../../models/Task';
import Attendance from '../../../../models/Attendance';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Get user statistics
    const totalUsers = await User.countDocuments({ isActive: true });
    const totalTech Leads = await User.countDocuments({ role: 'Tech Lead', isActive: true });
    const totalAIDeveloperInterns = await User.countDocuments({ role: 'AI Developer Intern', isActive: true });
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

    // Calculate real metrics
    const totalTasks = await Task.countDocuments();
    const completedTasks = await Task.countDocuments({ status: 'completed' });
    const tasksCompleted = completedTasks;
    
    // Calculate average performance based on task completion rates
    const avgPerformance = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    // Calculate system health based on various factors
    const recentAttendance = await Attendance.countDocuments({
      date: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    });
    const expectedAttendance = totalAIDeveloperInterns * 7; // Assuming daily attendance
    const attendanceRate = expectedAttendance > 0 ? (recentAttendance / expectedAttendance) * 100 : 100;
    const systemHealth = Math.min(100, Math.round((attendanceRate + avgPerformance) / 2));

    const stats = {
      totalUsers,
      totalColleges,
      totalTech Leads,
      totalAIDeveloperInterns,
      totalAdmins,
      activeUsers,
      systemHealth,
      avgPerformance,
      tasksCompleted,
      totalTasks,
      attendanceRate: Math.round(attendanceRate)
    };

    return NextResponse.json({ stats });

  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch statistics' 
    }, { status: 500 });
  }
}