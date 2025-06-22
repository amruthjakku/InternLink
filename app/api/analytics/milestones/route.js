import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../utils/database';
import Task from '../../../../models/Task';
import Attendance from '../../../../models/Attendance';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const userId = session.user.id;

    // Get user's tasks and attendance data
    const [allTasks, completedTasks, attendanceRecords] = await Promise.all([
      Task.find({ assignedTo: userId }),
      Task.find({ assignedTo: userId, status: 'completed' }),
      Attendance.find({ userId: userId })
    ]);

    const milestones = [];

    // Task completion milestones
    const taskMilestones = [1, 5, 10, 25, 50, 100];
    taskMilestones.forEach(count => {
      if (completedTasks.length >= count) {
        milestones.push({
          id: `tasks-${count}`,
          title: `${count} Tasks Completed`,
          description: `Completed ${count} tasks`,
          type: 'tasks',
          achieved: true,
          achievedAt: completedTasks[count - 1]?.updatedAt || new Date(),
          icon: '✅'
        });
      } else {
        milestones.push({
          id: `tasks-${count}`,
          title: `${count} Tasks Completed`,
          description: `Complete ${count} tasks (${completedTasks.length}/${count})`,
          type: 'tasks',
          achieved: false,
          progress: Math.round((completedTasks.length / count) * 100),
          icon: '📝'
        });
      }
    });

    // Attendance streak milestones
    const attendanceDays = attendanceRecords.filter(record => record.checkIn).length;
    const streakMilestones = [7, 14, 30, 60, 90];
    streakMilestones.forEach(days => {
      if (attendanceDays >= days) {
        milestones.push({
          id: `attendance-${days}`,
          title: `${days} Days Attendance`,
          description: `Attended for ${days} days`,
          type: 'attendance',
          achieved: true,
          achievedAt: attendanceRecords[days - 1]?.date || new Date(),
          icon: '📅'
        });
      } else {
        milestones.push({
          id: `attendance-${days}`,
          title: `${days} Days Attendance`,
          description: `Attend for ${days} days (${attendanceDays}/${days})`,
          type: 'attendance',
          achieved: false,
          progress: Math.round((attendanceDays / days) * 100),
          icon: '📍'
        });
      }
    });

    // Performance milestones
    const completionRate = allTasks.length > 0 ? (completedTasks.length / allTasks.length) * 100 : 0;
    const performanceMilestones = [50, 75, 90, 95];
    performanceMilestones.forEach(rate => {
      if (completionRate >= rate) {
        milestones.push({
          id: `performance-${rate}`,
          title: `${rate}% Completion Rate`,
          description: `Achieved ${Math.round(completionRate)}% task completion rate`,
          type: 'performance',
          achieved: true,
          achievedAt: new Date(),
          icon: '🎯'
        });
      } else {
        milestones.push({
          id: `performance-${rate}`,
          title: `${rate}% Completion Rate`,
          description: `Achieve ${rate}% completion rate (currently ${Math.round(completionRate)}%)`,
          type: 'performance',
          achieved: false,
          progress: Math.round((completionRate / rate) * 100),
          icon: '📈'
        });
      }
    });

    // Sort milestones: achieved first, then by progress
    milestones.sort((a, b) => {
      if (a.achieved && !b.achieved) return -1;
      if (!a.achieved && b.achieved) return 1;
      if (!a.achieved && !b.achieved) return (b.progress || 0) - (a.progress || 0);
      return new Date(b.achievedAt) - new Date(a.achievedAt);
    });

    return NextResponse.json({ milestones });

  } catch (error) {
    console.error('Error fetching milestones data:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch milestones data' 
    }, { status: 500 });
  }
}