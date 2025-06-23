import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../utils/database';
import User from '../../../../models/User';
import Task from '../../../../models/Task';
import College from '../../../../models/College';
import { subDays, format, startOfDay, endOfDay } from 'date-fns';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '30'; // days
    const startDate = subDays(new Date(), parseInt(timeRange));

    // Get all users with their colleges
    const users = await User.find({})
      .populate('college', 'name')
      .select('name email role college isActive createdAt lastLoginAt');

    // Get all tasks
    const tasks = await Task.find({})
      .populate('assignedTo', 'name role college')
      .populate('createdBy', 'name role')
      .select('title status priority category assignedTo createdBy createdByRole dueDate createdAt updatedAt progress');

    // Get all colleges
    const colleges = await College.find({})
      .select('name description location');

    // Calculate user metrics
    const userMetrics = {
      total: users.length,
      active: users.filter(u => u.isActive).length,
      byRole: {
        admin: users.filter(u => u.role === 'admin').length,
        'super-mentor': users.filter(u => u.role === 'super-mentor').length,
        mentor: users.filter(u => u.role === 'mentor').length,
        intern: users.filter(u => u.role === 'intern').length
      },
      recentSignups: users.filter(u => new Date(u.createdAt) >= startDate).length,
      activeInPeriod: users.filter(u => u.lastLoginAt && new Date(u.lastLoginAt) >= startDate).length
    };

    // Calculate task metrics
    const taskMetrics = {
      total: tasks.length,
      completed: tasks.filter(t => t.status === 'completed' || t.status === 'done').length,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
      notStarted: tasks.filter(t => t.status === 'not_started').length,
      overdue: tasks.filter(t => new Date(t.dueDate) < new Date() && !['completed', 'done'].includes(t.status)).length,
      byPriority: {
        high: tasks.filter(t => t.priority === 'high').length,
        medium: tasks.filter(t => t.priority === 'medium').length,
        low: tasks.filter(t => t.priority === 'low').length
      },
      byCreator: {
        admin: tasks.filter(t => t.createdByRole === 'admin').length,
        'super-mentor': tasks.filter(t => t.createdByRole === 'super-mentor').length,
        mentor: tasks.filter(t => t.createdByRole === 'mentor').length
      },
      avgProgress: tasks.length > 0 ? Math.round(tasks.reduce((sum, t) => sum + (t.progress || 0), 0) / tasks.length) : 0,
      recentTasks: tasks.filter(t => new Date(t.createdAt) >= startDate).length
    };

    // Calculate college metrics
    const collegeMetrics = {
      total: colleges.length,
      withUsers: colleges.filter(c => users.some(u => u.college && u.college._id.toString() === c._id.toString())).length,
      userDistribution: colleges.map(college => ({
        name: college.name,
        users: users.filter(u => u.college && u.college._id.toString() === college._id.toString()).length,
        interns: users.filter(u => u.college && u.college._id.toString() === college._id.toString() && u.role === 'intern').length,
        mentors: users.filter(u => u.college && u.college._id.toString() === college._id.toString() && u.role === 'mentor').length,
        superMentors: users.filter(u => u.college && u.college._id.toString() === college._id.toString() && u.role === 'super-mentor').length
      }))
    };

    // Calculate performance metrics
    const performanceMetrics = {
      taskCompletionRate: taskMetrics.total > 0 ? Math.round((taskMetrics.completed / taskMetrics.total) * 100) : 0,
      userEngagement: userMetrics.total > 0 ? Math.round((userMetrics.activeInPeriod / userMetrics.total) * 100) : 0,
      overdueRate: taskMetrics.total > 0 ? Math.round((taskMetrics.overdue / taskMetrics.total) * 100) : 0,
      growthRate: calculateGrowthRate(users, startDate)
    };

    // Generate time series data for charts
    const timeSeriesData = generateTimeSeriesData(users, tasks, startDate, parseInt(timeRange));

    // Calculate system health metrics
    const systemHealth = {
      activeUsers: userMetrics.activeInPeriod,
      taskBacklog: taskMetrics.notStarted + taskMetrics.inProgress,
      completionTrend: calculateCompletionTrend(tasks, startDate),
      userSatisfaction: 85 // This would come from surveys/feedback in real implementation
    };

    return NextResponse.json({
      userMetrics,
      taskMetrics,
      collegeMetrics,
      performanceMetrics,
      timeSeriesData,
      systemHealth,
      generatedAt: new Date().toISOString(),
      timeRange: parseInt(timeRange)
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch analytics data' 
    }, { status: 500 });
  }
}

function calculateGrowthRate(users, startDate) {
  const recentUsers = users.filter(u => new Date(u.createdAt) >= startDate).length;
  const totalUsers = users.length;
  const previousPeriodUsers = totalUsers - recentUsers;
  
  if (previousPeriodUsers === 0) return 100;
  return Math.round((recentUsers / previousPeriodUsers) * 100);
}

function generateTimeSeriesData(users, tasks, startDate, days) {
  const dates = [];
  for (let i = days - 1; i >= 0; i--) {
    dates.push(subDays(new Date(), i));
  }

  return dates.map(date => {
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    return {
      date: format(date, 'yyyy-MM-dd'),
      newUsers: users.filter(u => {
        const createdAt = new Date(u.createdAt);
        return createdAt >= dayStart && createdAt <= dayEnd;
      }).length,
      tasksCreated: tasks.filter(t => {
        const createdAt = new Date(t.createdAt);
        return createdAt >= dayStart && createdAt <= dayEnd;
      }).length,
      tasksCompleted: tasks.filter(t => {
        const updatedAt = new Date(t.updatedAt);
        return updatedAt >= dayStart && updatedAt <= dayEnd && ['completed', 'done'].includes(t.status);
      }).length,
      activeUsers: users.filter(u => {
        if (!u.lastLoginAt) return false;
        const lastLogin = new Date(u.lastLoginAt);
        return lastLogin >= dayStart && lastLogin <= dayEnd;
      }).length
    };
  });
}

function calculateCompletionTrend(tasks, startDate) {
  const recentTasks = tasks.filter(t => new Date(t.createdAt) >= startDate);
  const completedRecent = recentTasks.filter(t => ['completed', 'done'].includes(t.status)).length;
  
  if (recentTasks.length === 0) return 0;
  return Math.round((completedRecent / recentTasks.length) * 100);
}