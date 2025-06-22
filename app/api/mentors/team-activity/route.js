import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../utils/database';
import User from '../../../../models/User';
import Task from '../../../../models/Task';
import Attendance from '../../../../models/Attendance';
import { subDays, format, eachDayOfInterval } from 'date-fns';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

/**
 * GET /api/mentors/team-activity
 * Get team activity overview for mentors
 */
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Allow mentors and admins
    if (session.user.role !== 'mentor' && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied - Mentor role required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';
    
    // Calculate date range based on period
    let daysBack = 30;
    if (period === '7d') daysBack = 7;
    else if (period === '90d') daysBack = 90;
    
    const startDate = subDays(new Date(), daysBack);

    // Get all interns
    const interns = await User.find({ role: 'intern', isActive: true });
    const internIds = interns.map(intern => intern._id);

    // Get tasks data
    const [allTasks, completedTasks] = await Promise.all([
      Task.find({ assignedTo: { $in: internIds } }),
      Task.find({ 
        assignedTo: { $in: internIds }, 
        status: { $in: ['completed', 'done'] }
      })
    ]);

    // Get attendance data
    const attendanceRecords = await Attendance.find({
      userId: { $in: internIds },
      date: { $gte: startDate }
    });

    // Calculate overall analytics
    const analytics = {
      totalCommits: 0, // This would come from GitLab integration
      activeInterns: interns.filter(intern => {
        // Consider intern active if they have attendance in last 7 days
        const recentAttendance = attendanceRecords.some(record => 
          record.userId.toString() === intern._id.toString() &&
          record.date >= subDays(new Date(), 7)
        );
        return recentAttendance;
      }).length,
      openIssues: allTasks.filter(task => 
        !['completed', 'done'].includes(task.status)
      ).length,
      mergeRequests: 0, // This would come from GitLab integration
      totalAdditions: 0, // This would come from GitLab integration
      totalDeletions: 0, // This would come from GitLab integration
      activeProjects: [...new Set(allTasks.map(task => task.category))].length
    };

    // Calculate individual intern activity
    const internActivity = interns.map(intern => {
      const internTasks = allTasks.filter(task => 
        task.assignedTo.toString() === intern._id.toString()
      );
      const internCompletedTasks = completedTasks.filter(task => 
        task.assignedTo.toString() === intern._id.toString()
      );
      const internAttendance = attendanceRecords.filter(record => 
        record.userId.toString() === intern._id.toString()
      );

      // Calculate progress percentage
      const progressPercentage = internTasks.length > 0 
        ? Math.round((internCompletedTasks.length / internTasks.length) * 100)
        : 0;

      // Determine status based on recent activity
      const hasRecentAttendance = internAttendance.some(record => 
        record.date >= subDays(new Date(), 3)
      );
      const hasRecentTaskActivity = internTasks.some(task => 
        task.updatedAt >= subDays(new Date(), 3)
      );

      let status = 'inactive';
      if (hasRecentAttendance && hasRecentTaskActivity) {
        status = 'active';
      } else if (hasRecentAttendance || hasRecentTaskActivity) {
        status = 'idle';
      }

      // Calculate last active time
      const lastTaskUpdate = Math.max(
        ...internTasks.map(task => new Date(task.updatedAt).getTime()),
        0
      );
      const lastAttendance = Math.max(
        ...internAttendance.map(record => new Date(record.date).getTime()),
        0
      );
      const lastActiveTime = Math.max(lastTaskUpdate, lastAttendance);
      
      let lastActiveAt = 'Never';
      if (lastActiveTime > 0) {
        const daysDiff = Math.floor((Date.now() - lastActiveTime) / (1000 * 60 * 60 * 24));
        if (daysDiff === 0) lastActiveAt = 'Today';
        else if (daysDiff === 1) lastActiveAt = '1 day ago';
        else if (daysDiff < 7) lastActiveAt = `${daysDiff} days ago`;
        else lastActiveAt = `${Math.floor(daysDiff / 7)} weeks ago`;
      }

      return {
        id: intern._id,
        name: intern.name,
        email: intern.email,
        gitlabUsername: intern.gitlabUsername,
        avatarUrl: intern.image,
        recentActivity: {
          commits: 0, // Would come from GitLab
          issues: internTasks.filter(task => task.status === 'not_started').length,
          mergeRequests: 0, // Would come from GitLab
          totalAdditions: 0, // Would come from GitLab
          totalDeletions: 0, // Would come from GitLab
          activeProjects: [...new Set(internTasks.map(task => task.category))].length
        },
        lastActiveAt,
        progressPercentage,
        status
      };
    });

    // Generate daily trend data
    const days = eachDayOfInterval({
      start: startDate,
      end: new Date()
    });

    const dailyTrend = days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      
      // Count tasks completed on this day
      const tasksCompletedToday = completedTasks.filter(task => 
        format(new Date(task.updatedAt), 'yyyy-MM-dd') === dayStr
      ).length;

      // Count attendance for this day
      const attendanceToday = attendanceRecords.filter(record => 
        format(new Date(record.date), 'yyyy-MM-dd') === dayStr
      ).length;

      return {
        date: dayStr,
        commits: 0, // Would come from GitLab integration
        issues: tasksCompletedToday,
        mergeRequests: 0, // Would come from GitLab integration
        attendance: attendanceToday
      };
    });

    return NextResponse.json({
      analytics,
      internActivity,
      dailyTrend
    });

  } catch (error) {
    console.error('Error fetching team activity:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch team activity',
      details: error.message 
    }, { status: 500 });
  }
}