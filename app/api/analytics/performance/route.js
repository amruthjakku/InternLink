import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../utils/database';
import User from '../../../../models/User';
import Task from '../../../../models/Task';
import WeeklyTask from '../../../../models/WeeklyTask';
import { subDays, format, startOfDay, endOfDay, eachDayOfInterval, subWeeks, subMonths } from 'date-fns';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || 'month';
    const userId = session.user.id;

    // Calculate date range based on timeframe
    let startDate;
    switch (timeframe) {
      case 'week':
        startDate = subWeeks(new Date(), 1);
        break;
      case 'month':
        startDate = subMonths(new Date(), 1);
        break;
      case 'quarter':
        startDate = subMonths(new Date(), 3);
        break;
      default:
        startDate = subMonths(new Date(), 1);
    }

    // Get user's tasks
    const tasks = await Task.find({
      assignedTo: userId,
      createdAt: { $gte: startDate }
    }).sort({ createdAt: 1 });

    // Get user's weekly tasks
    const weeklyTasks = await WeeklyTask.find({
      assignedTo: userId,
      createdAt: { $gte: startDate }
    }).sort({ createdAt: 1 });

    // Calculate daily performance data
    const dateRange = eachDayOfInterval({ start: startDate, end: new Date() });
    const dailyPerformance = dateRange.map(date => {
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);

      const dayTasks = tasks.filter(task => {
        const taskDate = new Date(task.createdAt);
        return taskDate >= dayStart && taskDate <= dayEnd;
      });

      const completedTasks = dayTasks.filter(task => 
        ['completed', 'done'].includes(task.status)
      ).length;

      const totalTasks = dayTasks.length;
      const onTimeTasks = dayTasks.filter(task => 
        task.dueDate && new Date(task.updatedAt) <= new Date(task.dueDate)
      ).length;

      // Calculate performance score based on completion rate, quality, and timeliness
      let performanceScore = 0;
      if (totalTasks > 0) {
        const completionRate = (completedTasks / totalTasks) * 100;
        const onTimeRate = (onTimeTasks / totalTasks) * 100;
        const avgProgress = dayTasks.reduce((sum, task) => sum + (task.progress || 0), 0) / totalTasks;
        
        performanceScore = Math.round((completionRate * 0.4) + (onTimeRate * 0.3) + (avgProgress * 0.3));
      }

      return {
        date: date,
        score: performanceScore,
        tasksCompleted: completedTasks,
        totalTasks: totalTasks,
        onTimeTasks: onTimeTasks
      };
    });

    // Calculate overall metrics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => ['completed', 'done'].includes(task.status)).length;
    const overdueTasks = tasks.filter(task => 
      task.dueDate && new Date() > new Date(task.dueDate) && !['completed', 'done'].includes(task.status)
    ).length;

    const currentScore = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const previousPeriodTasks = await Task.find({
      assignedTo: userId,
      createdAt: { 
        $gte: timeframe === 'week' ? subWeeks(startDate, 1) : subMonths(startDate, 1),
        $lt: startDate 
      }
    });

    const previousCompletedTasks = previousPeriodTasks.filter(task => 
      ['completed', 'done'].includes(task.status)
    ).length;
    const previousScore = previousPeriodTasks.length > 0 ? 
      Math.round((previousCompletedTasks / previousPeriodTasks.length) * 100) : 0;

    const improvement = currentScore - previousScore;

    // Calculate code quality score (based on task ratings and feedback)
    const tasksWithRating = tasks.filter(task => task.rating);
    const avgRating = tasksWithRating.length > 0 ? 
      tasksWithRating.reduce((sum, task) => sum + task.rating, 0) / tasksWithRating.length : 0;
    const codeQuality = Math.round(avgRating * 20); // Convert 5-star rating to percentage

    // Calculate on-time delivery rate
    const tasksWithDueDate = tasks.filter(task => task.dueDate);
    const onTimeDeliveredTasks = tasksWithDueDate.filter(task => 
      ['completed', 'done'].includes(task.status) && 
      new Date(task.updatedAt) <= new Date(task.dueDate)
    ).length;
    const onTimeDelivery = tasksWithDueDate.length > 0 ? 
      Math.round((onTimeDeliveredTasks / tasksWithDueDate.length) * 100) : 0;

    // Calculate productivity metrics
    const avgTasksPerDay = totalTasks / dateRange.length;
    const avgCompletionTime = tasks
      .filter(task => ['completed', 'done'].includes(task.status))
      .reduce((sum, task) => {
        const created = new Date(task.createdAt);
        const completed = new Date(task.updatedAt);
        return sum + (completed - created) / (1000 * 60 * 60 * 24); // days
      }, 0) / completedTasks || 0;

    const performance = {
      currentScore,
      improvement,
      completedTasks,
      totalTasks,
      codeQuality,
      onTimeDelivery,
      overdueTasks,
      avgTasksPerDay: Math.round(avgTasksPerDay * 10) / 10,
      avgCompletionTime: Math.round(avgCompletionTime * 10) / 10,
      dailyPerformance,
      productivity: {
        tasksPerWeek: Math.round(avgTasksPerDay * 7),
        completionRate: Math.round((completedTasks / totalTasks) * 100) || 0,
        qualityScore: codeQuality,
        consistencyScore: calculateConsistencyScore(dailyPerformance)
      }
    };

    return NextResponse.json({ performance });

  } catch (error) {
    console.error('Error fetching performance data:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch performance data',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

function calculateConsistencyScore(dailyPerformance) {
  if (dailyPerformance.length < 2) return 0;
  
  const scores = dailyPerformance.map(day => day.score).filter(score => score > 0);
  if (scores.length < 2) return 0;
  
  // Calculate standard deviation
  const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
  const stdDev = Math.sqrt(variance);
  
  // Convert to consistency score (lower deviation = higher consistency)
  const maxStdDev = 50; // Assume max standard deviation of 50
  const consistencyScore = Math.max(0, Math.round(((maxStdDev - stdDev) / maxStdDev) * 100));
  
  return consistencyScore;
}