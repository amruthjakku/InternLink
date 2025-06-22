import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../utils/database';
import User from '../../../models/User';
import Task from '../../../models/Task';
import Attendance from '../../../models/Attendance';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'all-time';
    const metric = searchParams.get('metric') || 'completion-rate';

    await connectToDatabase();

    // Get all interns
    const interns = await User.find({ role: 'intern', isActive: true });
    
    // Calculate leaderboard data based on real user data
    const leaderboard = await Promise.all(interns.map(async (intern) => {
      // Calculate real metrics from database
      const userId = intern._id.toString();
      
      // Get tasks data
      const allTasks = await Task.find({ assignedTo: userId });
      const completedTasks = allTasks.filter(task => task.status === 'completed');
      const totalTasks = allTasks.length;
      const tasksCompleted = completedTasks.length;
      const completionRate = totalTasks > 0 ? Math.round((tasksCompleted / totalTasks) * 100) : 0;
      
      // Get attendance data for streak and hours calculation
      const attendanceRecords = await Attendance.find({ 
        userId: userId,
        date: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } // Last 90 days
      }).sort({ date: -1 });
      
      // Calculate total hours worked
      const totalHours = attendanceRecords.reduce((sum, record) => {
        if (record.checkOut && record.checkIn) {
          const hours = (new Date(record.checkOut) - new Date(record.checkIn)) / (1000 * 60 * 60);
          return sum + Math.max(0, hours);
        }
        return sum;
      }, 0);
      
      // Calculate streak days
      let streakDays = 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Check consecutive days from today backwards
      for (let i = 0; i < 30; i++) { // Check last 30 days max
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() - i);
        
        const hasAttendance = attendanceRecords.some(record => {
          const recordDate = new Date(record.date);
          recordDate.setHours(0, 0, 0, 0);
          return recordDate.getTime() === checkDate.getTime() && record.checkIn;
        });
        
        if (hasAttendance) {
          streakDays++;
        } else if (i > 0) { // Allow today to be missing for current streak
          break;
        }
      }
      
      return {
        id: intern._id,
        name: intern.name,
        college: intern.college || 'Unknown College',
        avatar: intern.name ? intern.name.charAt(0).toUpperCase() : 'U',
        tasksCompleted: tasksCompleted,
        totalTasks: totalTasks,
        completionRate: completionRate,
        streakDays: streakDays,
        totalHours: Math.round(totalHours * 10) / 10, // Round to 1 decimal
        rank: 0, // Will be set after sorting
        isCurrentUser: intern._id.toString() === session.user.id
      };
    }));

    // Sort by the selected metric
    leaderboard.sort((a, b) => {
      switch (metric) {
        case 'tasks-completed':
          return b.tasksCompleted - a.tasksCompleted;
        case 'hours-worked':
          return b.totalHours - a.totalHours;
        case 'streak-days':
          return b.streakDays - a.streakDays;
        default: // completion-rate
          return b.completionRate - a.completionRate;
      }
    });

    // Update ranks after sorting
    leaderboard.forEach((intern, index) => {
      intern.rank = index + 1;
    });

    return NextResponse.json({ leaderboard });

  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch leaderboard' 
    }, { status: 500 });
  }
}