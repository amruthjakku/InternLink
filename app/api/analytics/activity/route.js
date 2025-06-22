import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../utils/database';
import Task from '../../../../models/Task';
import Attendance from '../../../../models/Attendance';
import { subDays, format, eachDayOfInterval } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const userId = session.user.id;
    const thirtyDaysAgo = subDays(new Date(), 30);

    // Get attendance and task data for the last 30 days
    const [attendance, tasks] = await Promise.all([
      Attendance.find({
        userId: userId,
        date: { $gte: thirtyDaysAgo }
      }),
      Task.find({
        assignedTo: userId,
        updatedAt: { $gte: thirtyDaysAgo }
      })
    ]);

    // Generate activity heatmap data
    const days = eachDayOfInterval({
      start: thirtyDaysAgo,
      end: new Date()
    });

    const activity = days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      
      // Check attendance for this day
      const dayAttendance = attendance.find(att => 
        format(new Date(att.date), 'yyyy-MM-dd') === dayStr
      );
      
      // Count tasks completed on this day
      const tasksCompletedToday = tasks.filter(task => 
        task.status === 'completed' && 
        format(new Date(task.updatedAt), 'yyyy-MM-dd') === dayStr
      ).length;

      // Calculate activity level (0-4 scale for heatmap)
      let activityLevel = 0;
      if (dayAttendance && dayAttendance.checkIn) activityLevel += 1;
      if (tasksCompletedToday > 0) activityLevel += 1;
      if (tasksCompletedToday > 2) activityLevel += 1;
      if (tasksCompletedToday > 5) activityLevel += 1;

      return {
        date: dayStr,
        level: activityLevel,
        tasksCompleted: tasksCompletedToday,
        hasAttendance: !!(dayAttendance && dayAttendance.checkIn)
      };
    });

    return NextResponse.json({ activity });

  } catch (error) {
    console.error('Error fetching activity data:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch activity data' 
    }, { status: 500 });
  }
}