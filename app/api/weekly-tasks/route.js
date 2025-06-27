import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../utils/database';
import WeeklyTask from '../../../models/WeeklyTask';
import User from '../../../models/User';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const weekNumber = searchParams.get('week');
    const showAll = searchParams.get('all') === 'true';
    
    // Get user details
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    let tasks = [];
    
    if (weekNumber) {
      // Get tasks for specific week
      tasks = await WeeklyTask.getWeekTasks(
        parseInt(weekNumber), 
        user.cohortId, 
        user._id
      );
    } else if (showAll) {
      // Get all available tasks
      const now = new Date();
      tasks = await WeeklyTask.find({
        isActive: true,
        isPublished: true,
        $or: [
          { assignmentType: 'all' },
          { assignmentType: 'cohort', cohortId: user.cohortId },
          { assignmentType: 'individual', assignedTo: user._id }
        ]
      }).sort({ weekNumber: 1, createdAt: 1 });
    } else {
      // Get current week tasks
      tasks = await WeeklyTask.getCurrentWeekTasks(user.cohortId, user._id);
    }
    
    // Populate cohort information
    await WeeklyTask.populate(tasks, { path: 'cohortId', select: 'name' });
    
    // Filter tasks that should be visible to the user
    const visibleTasks = tasks.filter(task => task.isVisibleTo(user));
    
    // Group tasks by week
    const tasksByWeek = visibleTasks.reduce((acc, task) => {
      const week = task.weekNumber;
      if (!acc[week]) {
        acc[week] = {
          weekNumber: week,
          weekLabel: `Week ${week}`,
          weekStartDate: task.weekStartDate,
          weekEndDate: task.weekEndDate,
          status: task.currentStatus,
          tasks: []
        };
      }
      acc[week].tasks.push(task);
      return acc;
    }, {});
    
    // Convert to array and sort by week number
    const weeksArray = Object.values(tasksByWeek).sort((a, b) => a.weekNumber - b.weekNumber);
    
    // Get current week info
    const now = new Date();
    const currentWeek = weeksArray.find(week => 
      new Date(week.weekStartDate) <= now && new Date(week.weekEndDate) >= now
    );
    
    return NextResponse.json({
      success: true,
      tasks: visibleTasks,
      tasksByWeek: weeksArray,
      currentWeek: currentWeek || null,
      totalTasks: visibleTasks.length,
      userInfo: {
        cohortId: user.cohortId,
        cohortName: user.cohortName
      }
    });

  } catch (error) {
    console.error('Error fetching weekly tasks:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch weekly tasks',
      details: error.message 
    }, { status: 500 });
  }
}