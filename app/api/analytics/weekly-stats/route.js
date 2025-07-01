import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../utils/database';
import Task from '../../../../models/Task';
import WeeklyTask from '../../../../models/WeeklyTask';
import { subWeeks, format, startOfWeek, endOfWeek, eachWeekOfInterval } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const userId = session.user.id;
    
    // Get data for the last 12 weeks
    const startDate = subWeeks(new Date(), 12);
    const endDate = new Date();

    // Get all tasks for the user in this period
    const tasks = await Task.find({
      assignedTo: userId,
      createdAt: { $gte: startDate, $lte: endDate }
    }).sort({ createdAt: 1 });

    // Get weekly tasks
    const weeklyTasks = await WeeklyTask.find({
      assignedTo: userId,
      createdAt: { $gte: startDate, $lte: endDate }
    }).sort({ createdAt: 1 });

    // Generate weekly intervals
    const weeks = eachWeekOfInterval({ start: startDate, end: endDate });

    // Calculate stats for each week
    const stats = weeks.map(weekStart => {
      const weekEnd = endOfWeek(weekStart);
      const weekLabel = format(weekStart, 'MMM dd');

      // Filter tasks for this week
      const weekTasks = tasks.filter(task => {
        const taskDate = new Date(task.createdAt);
        return taskDate >= weekStart && taskDate <= weekEnd;
      });

      const weeklyTasksForWeek = weeklyTasks.filter(task => {
        const taskDate = new Date(task.createdAt);
        return taskDate >= weekStart && taskDate <= weekEnd;
      });

      // Calculate metrics
      const tasksCreated = weekTasks.length;
      const tasksCompleted = weekTasks.filter(task => 
        ['completed', 'done'].includes(task.status)
      ).length;
      
      const tasksInProgress = weekTasks.filter(task => 
        task.status === 'in_progress'
      ).length;

      const highPriorityTasks = weekTasks.filter(task => 
        task.priority === 'high'
      ).length;

      // Calculate estimated hours worked (based on task complexity and completion)
      const hoursWorked = weekTasks.reduce((total, task) => {
        let hours = 0;
        switch (task.priority) {
          case 'high': hours = 8; break;
          case 'medium': hours = 4; break;
          case 'low': hours = 2; break;
          default: hours = 3;
        }
        // Adjust based on completion status
        if (['completed', 'done'].includes(task.status)) {
          return total + hours;
        } else if (task.status === 'in_progress') {
          return total + (hours * (task.progress || 50) / 100);
        }
        return total + (hours * 0.1); // Small amount for started tasks
      }, 0);

      // Add weekly task hours
      const weeklyTaskHours = weeklyTasksForWeek.reduce((total, task) => {
        return total + (task.estimatedHours || 0);
      }, 0);

      // Calculate productivity score
      const completionRate = tasksCreated > 0 ? (tasksCompleted / tasksCreated) * 100 : 0;
      const productivityScore = Math.round(
        (completionRate * 0.6) + 
        (Math.min(hoursWorked / 40, 1) * 40) // Max 40 points for full-time work
      );

      return {
        week: weekLabel,
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
        tasksCreated,
        tasksCompleted,
        tasksInProgress,
        highPriorityTasks,
        hoursWorked: Math.round(hoursWorked + weeklyTaskHours),
        completionRate: Math.round(completionRate),
        productivityScore,
        avgTaskProgress: weekTasks.length > 0 ? 
          Math.round(weekTasks.reduce((sum, task) => sum + (task.progress || 0), 0) / weekTasks.length) : 0
      };
    });

    // Calculate trends
    const recentWeeks = stats.slice(-4); // Last 4 weeks
    const previousWeeks = stats.slice(-8, -4); // Previous 4 weeks

    const recentAvg = {
      tasksCompleted: Math.round(recentWeeks.reduce((sum, week) => sum + week.tasksCompleted, 0) / recentWeeks.length),
      hoursWorked: Math.round(recentWeeks.reduce((sum, week) => sum + week.hoursWorked, 0) / recentWeeks.length),
      completionRate: Math.round(recentWeeks.reduce((sum, week) => sum + week.completionRate, 0) / recentWeeks.length),
      productivityScore: Math.round(recentWeeks.reduce((sum, week) => sum + week.productivityScore, 0) / recentWeeks.length)
    };

    const previousAvg = {
      tasksCompleted: previousWeeks.length > 0 ? Math.round(previousWeeks.reduce((sum, week) => sum + week.tasksCompleted, 0) / previousWeeks.length) : 0,
      hoursWorked: previousWeeks.length > 0 ? Math.round(previousWeeks.reduce((sum, week) => sum + week.hoursWorked, 0) / previousWeeks.length) : 0,
      completionRate: previousWeeks.length > 0 ? Math.round(previousWeeks.reduce((sum, week) => sum + week.completionRate, 0) / previousWeeks.length) : 0,
      productivityScore: previousWeeks.length > 0 ? Math.round(previousWeeks.reduce((sum, week) => sum + week.productivityScore, 0) / previousWeeks.length) : 0
    };

    // Calculate trends (positive = improving, negative = declining)
    const trends = {
      tasksCompleted: recentAvg.tasksCompleted - previousAvg.tasksCompleted,
      hoursWorked: recentAvg.hoursWorked - previousAvg.hoursWorked,
      completionRate: recentAvg.completionRate - previousAvg.completionRate,
      productivityScore: recentAvg.productivityScore - previousAvg.productivityScore
    };

    // Generate insights
    const insights = generateWeeklyInsights(stats, trends);

    return NextResponse.json({ 
      stats,
      trends,
      recentAvg,
      previousAvg,
      insights,
      summary: {
        totalWeeks: stats.length,
        bestWeek: stats.reduce((best, week) => 
          week.productivityScore > best.productivityScore ? week : best, stats[0]
        ),
        totalTasksCompleted: stats.reduce((sum, week) => sum + week.tasksCompleted, 0),
        totalHoursWorked: stats.reduce((sum, week) => sum + week.hoursWorked, 0),
        avgWeeklyProductivity: Math.round(stats.reduce((sum, week) => sum + week.productivityScore, 0) / stats.length)
      }
    });

  } catch (error) {
    console.error('Error fetching weekly stats:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch weekly stats',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

function generateWeeklyInsights(stats, trends) {
  const insights = [];

  // Productivity trend insight
  if (trends.productivityScore > 5) {
    insights.push({
      type: 'positive',
      title: 'Productivity Improving',
      message: `Your productivity score has increased by ${trends.productivityScore} points over the last month. Keep up the great work!`,
      icon: '📈'
    });
  } else if (trends.productivityScore < -5) {
    insights.push({
      type: 'warning',
      title: 'Productivity Declining',
      message: `Your productivity score has decreased by ${Math.abs(trends.productivityScore)} points. Consider reviewing your workload and priorities.`,
      icon: '📉'
    });
  }

  // Task completion insight
  if (trends.completionRate > 10) {
    insights.push({
      type: 'positive',
      title: 'Better Task Completion',
      message: `Your task completion rate has improved by ${trends.completionRate}%. Excellent progress!`,
      icon: '✅'
    });
  } else if (trends.completionRate < -10) {
    insights.push({
      type: 'warning',
      title: 'Task Completion Needs Attention',
      message: `Your task completion rate has dropped by ${Math.abs(trends.completionRate)}%. Consider breaking down tasks into smaller, manageable pieces.`,
      icon: '⚠️'
    });
  }

  // Work hours insight
  const recentStats = stats.slice(-4);
  const avgHours = recentStats.reduce((sum, week) => sum + week.hoursWorked, 0) / recentStats.length;
  
  if (avgHours > 45) {
    insights.push({
      type: 'warning',
      title: 'High Work Hours',
      message: `You're averaging ${Math.round(avgHours)} hours per week. Consider work-life balance and avoid burnout.`,
      icon: '⏰'
    });
  } else if (avgHours < 20) {
    insights.push({
      type: 'info',
      title: 'Low Work Hours',
      message: `You're averaging ${Math.round(avgHours)} hours per week. Consider taking on more tasks if you have capacity.`,
      icon: '💡'
    });
  }

  // Consistency insight
  const productivityScores = stats.slice(-8).map(week => week.productivityScore);
  const variance = calculateVariance(productivityScores);
  
  if (variance < 100) {
    insights.push({
      type: 'positive',
      title: 'Consistent Performance',
      message: 'Your productivity has been very consistent over the past 8 weeks. This shows great discipline!',
      icon: '🎯'
    });
  } else if (variance > 400) {
    insights.push({
      type: 'info',
      title: 'Variable Performance',
      message: 'Your productivity varies significantly week to week. Try to establish more consistent work patterns.',
      icon: '📊'
    });
  }

  return insights;
}

function calculateVariance(numbers) {
  const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  const squaredDiffs = numbers.map(num => Math.pow(num - mean, 2));
  return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / numbers.length;
}