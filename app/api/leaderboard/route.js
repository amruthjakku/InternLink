import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../utils/database';
import User from '../../../models/User';
import Task from '../../../models/Task';
import Attendance from '../../../models/Attendance';

export async function GET(request) {
  try {
    console.log('Leaderboard API called');
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'all-time';
    const metric = searchParams.get('metric') || 'completion-rate';
    const scope = searchParams.get('scope') || 'cohort';

    console.log('Leaderboard request params:', { period, metric, scope });

    await connectToDatabase();

    // Get current user for filtering by cohort or college
    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser) {
      console.error('Current user not found:', session.user.email);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('Current user:', {
      id: currentUser._id,
      name: currentUser.name,
      cohortId: currentUser.cohortId,
      college: currentUser.college
    });

    // Build query based on scope
    let userQuery = { role: 'intern' };
    
    if (scope === 'cohort' && currentUser.cohortId) {
      userQuery.cohortId = currentUser.cohortId;
      console.log('Filtering by cohort:', currentUser.cohortId);
    } else if (scope === 'college' && currentUser.college) {
      userQuery.college = currentUser.college;
      console.log('Filtering by college:', currentUser.college);
    }

    // Get interns based on scope
    const interns = await User.find(userQuery);
    console.log(`Found ${interns.length} interns for leaderboard`);
    
    if (interns.length === 0) {
      return NextResponse.json({ leaderboard: [] });
    }

    // Build date filter based on period
    let dateFilter = {};
    const now = new Date();
    
    if (period === 'this-week') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
      startOfWeek.setHours(0, 0, 0, 0);
      dateFilter = { createdAt: { $gte: startOfWeek } };
      console.log('Filtering by this week, start date:', startOfWeek);
    } else if (period === 'this-month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      dateFilter = { createdAt: { $gte: startOfMonth } };
      console.log('Filtering by this month, start date:', startOfMonth);
    }
    
    // Calculate leaderboard data based on real user data
    const leaderboard = await Promise.all(interns.map(async (intern) => {
      // Calculate real metrics from database
      const userId = intern._id.toString();
      
      // Get tasks data with period filter
      const taskQuery = { 
        assignedTo: userId,
        ...dateFilter
      };
      
      console.log(`Fetching tasks for user ${intern.name || intern.email} with query:`, taskQuery);
      const allTasks = await Task.find(taskQuery);
      console.log(`Found ${allTasks.length} tasks for user ${intern.name || intern.email}`);
      
      // Get completed tasks - include all completed status values
      const completedTasks = allTasks.filter(task => 
        task.status === 'completed' || 
        task.status === 'done' || 
        task.status === 'approved' ||
        (task.status === 'review' && task.progress >= 90) // Include tasks in review with high progress
      );
      
      console.log(`User ${intern.name || intern.email} has ${completedTasks.length} completed tasks out of ${allTasks.length} total tasks`);
      const totalTasks = allTasks.length;
      const tasksCompleted = completedTasks.length;
      const completionRate = totalTasks > 0 ? Math.round((tasksCompleted / totalTasks) * 100) : 0;
      
      // Calculate points earned from completed tasks
      const pointsEarned = completedTasks.reduce((total, task) => {
        // Each task can have points assigned, default to 10 if not specified
        const taskPoints = task.points || 10;
        console.log(`Task "${task.title}" points: ${taskPoints}, status: ${task.status}, progress: ${task.progress}`);
        return total + taskPoints;
      }, 0);
      
      console.log(`Total points earned by ${intern.name || intern.email}: ${pointsEarned} from ${completedTasks.length} completed tasks`);
      
      // Get attendance data for streak and hours calculation
      let attendanceQuery = { userId: userId };
      
      if (period === 'this-week') {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        attendanceQuery.date = { $gte: startOfWeek };
      } else if (period === 'this-month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        attendanceQuery.date = { $gte: startOfMonth };
      } else {
        // For all-time, limit to last 90 days for performance
        attendanceQuery.date = { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) };
      }
      
      const attendanceRecords = await Attendance.find(attendanceQuery).sort({ date: -1 });
      
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
        name: intern.name || intern.email.split('@')[0],
        college: intern.college || 'Unknown College',
        cohortName: intern.cohortName,
        cohortId: intern.cohortId,
        avatar: intern.name ? intern.name.charAt(0).toUpperCase() : 'U',
        tasksCompleted: tasksCompleted,
        totalTasks: totalTasks,
        completionRate: completionRate,
        pointsEarned: pointsEarned,
        streakDays: streakDays,
        totalHours: Math.round(totalHours * 10) / 10, // Round to 1 decimal
        rank: 0, // Will be set after sorting
        isCurrentUser: intern._id.toString() === currentUser._id.toString()
      };
    }));

    console.log(`Generated leaderboard data for ${leaderboard.length} interns`);

    // Sort by the selected metric
    leaderboard.sort((a, b) => {
      switch (metric) {
        case 'points-earned':
          return b.pointsEarned - a.pointsEarned;
        case 'tasks-completed':
          return b.tasksCompleted - a.tasksCompleted;
        case 'hours-worked':
          return b.totalHours - a.totalHours;
        case 'streak-days':
          return b.streakDays - a.streakDays;
        case 'completion-rate':
          return b.completionRate - a.completionRate;
        default: // Default to points-earned
          return b.pointsEarned - a.pointsEarned;
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
      error: 'Failed to fetch leaderboard',
      details: error.message
    }, { status: 500 });
  }
}