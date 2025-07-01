import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../utils/database';
import Task from '../../../../models/Task';
import WeeklyTask from '../../../../models/WeeklyTask';
import { subMonths, format, differenceInDays } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const userId = session.user.id;
    
    // Get tasks from the last 6 months for achievement calculation
    const startDate = subMonths(new Date(), 6);
    const tasks = await Task.find({
      assignedTo: userId,
      createdAt: { $gte: startDate }
    }).sort({ createdAt: -1 });

    const weeklyTasks = await WeeklyTask.find({
      assignedTo: userId,
      createdAt: { $gte: startDate }
    }).sort({ createdAt: -1 });

    // Calculate achievements
    const achievements = [];

    // Task completion achievements
    const completedTasks = tasks.filter(task => ['completed', 'done'].includes(task.status));
    
    if (completedTasks.length >= 100) {
      achievements.push({
        id: 'centurion',
        title: 'Centurion',
        description: 'Completed 100+ tasks',
        category: 'milestone',
        icon: '💯',
        points: 100,
        earnedDate: completedTasks[99]?.updatedAt || new Date(),
        rarity: 'legendary'
      });
    } else if (completedTasks.length >= 50) {
      achievements.push({
        id: 'half-century',
        title: 'Half Century',
        description: 'Completed 50+ tasks',
        category: 'milestone',
        icon: '🎯',
        points: 50,
        earnedDate: completedTasks[49]?.updatedAt || new Date(),
        rarity: 'epic'
      });
    } else if (completedTasks.length >= 25) {
      achievements.push({
        id: 'quarter-century',
        title: 'Quarter Century',
        description: 'Completed 25+ tasks',
        category: 'milestone',
        icon: '🏆',
        points: 25,
        earnedDate: completedTasks[24]?.updatedAt || new Date(),
        rarity: 'rare'
      });
    } else if (completedTasks.length >= 10) {
      achievements.push({
        id: 'first-ten',
        title: 'First Ten',
        description: 'Completed 10+ tasks',
        category: 'milestone',
        icon: '🌟',
        points: 10,
        earnedDate: completedTasks[9]?.updatedAt || new Date(),
        rarity: 'common'
      });
    }

    // Quality achievements
    const highQualityTasks = tasks.filter(task => task.rating && task.rating >= 4);
    if (highQualityTasks.length >= 20) {
      achievements.push({
        id: 'quality-master',
        title: 'Quality Master',
        description: 'Achieved 4+ star rating on 20+ tasks',
        category: 'quality',
        icon: '⭐',
        points: 75,
        earnedDate: highQualityTasks[19]?.updatedAt || new Date(),
        rarity: 'epic'
      });
    } else if (highQualityTasks.length >= 10) {
      achievements.push({
        id: 'quality-focused',
        title: 'Quality Focused',
        description: 'Achieved 4+ star rating on 10+ tasks',
        category: 'quality',
        icon: '✨',
        points: 35,
        earnedDate: highQualityTasks[9]?.updatedAt || new Date(),
        rarity: 'rare'
      });
    }

    // Speed achievements
    const quickTasks = tasks.filter(task => {
      if (!task.dueDate || !['completed', 'done'].includes(task.status)) return false;
      const completionTime = new Date(task.updatedAt);
      const dueDate = new Date(task.dueDate);
      const createdDate = new Date(task.createdAt);
      const totalTime = differenceInDays(dueDate, createdDate);
      const actualTime = differenceInDays(completionTime, createdDate);
      return actualTime <= totalTime * 0.5; // Completed in half the allocated time
    });

    if (quickTasks.length >= 15) {
      achievements.push({
        id: 'speed-demon',
        title: 'Speed Demon',
        description: 'Completed 15+ tasks in half the allocated time',
        category: 'consistency',
        icon: '⚡',
        points: 60,
        earnedDate: quickTasks[14]?.updatedAt || new Date(),
        rarity: 'epic'
      });
    } else if (quickTasks.length >= 5) {
      achievements.push({
        id: 'quick-finisher',
        title: 'Quick Finisher',
        description: 'Completed 5+ tasks ahead of schedule',
        category: 'consistency',
        icon: '🏃',
        points: 25,
        earnedDate: quickTasks[4]?.updatedAt || new Date(),
        rarity: 'rare'
      });
    }

    // Consistency achievements
    const recentTasks = tasks.filter(task => 
      new Date(task.createdAt) >= subMonths(new Date(), 1)
    );
    const completedRecentTasks = recentTasks.filter(task => 
      ['completed', 'done'].includes(task.status)
    );
    const completionRate = recentTasks.length > 0 ? 
      (completedRecentTasks.length / recentTasks.length) * 100 : 0;

    if (completionRate >= 95 && recentTasks.length >= 10) {
      achievements.push({
        id: 'perfectionist',
        title: 'Perfectionist',
        description: '95%+ completion rate with 10+ tasks this month',
        category: 'consistency',
        icon: '🎖️',
        points: 80,
        earnedDate: new Date(),
        rarity: 'legendary'
      });
    } else if (completionRate >= 85 && recentTasks.length >= 10) {
      achievements.push({
        id: 'reliable',
        title: 'Reliable',
        description: '85%+ completion rate with 10+ tasks this month',
        category: 'consistency',
        icon: '🛡️',
        points: 40,
        earnedDate: new Date(),
        rarity: 'rare'
      });
    }

    // Learning achievements
    const learningTasks = tasks.filter(task => {
      const taskText = `${task.title} ${task.description || ''}`.toLowerCase();
      return taskText.includes('learn') || taskText.includes('study') || 
             taskText.includes('research') || taskText.includes('tutorial');
    });

    if (learningTasks.length >= 20) {
      achievements.push({
        id: 'knowledge-seeker',
        title: 'Knowledge Seeker',
        description: 'Completed 20+ learning-focused tasks',
        category: 'learning',
        icon: '📚',
        points: 50,
        earnedDate: learningTasks[19]?.updatedAt || new Date(),
        rarity: 'epic'
      });
    } else if (learningTasks.length >= 10) {
      achievements.push({
        id: 'eager-learner',
        title: 'Eager Learner',
        description: 'Completed 10+ learning-focused tasks',
        category: 'learning',
        icon: '🎓',
        points: 25,
        earnedDate: learningTasks[9]?.updatedAt || new Date(),
        rarity: 'rare'
      });
    }

    // Collaboration achievements
    const collaborationTasks = tasks.filter(task => {
      const taskText = `${task.title} ${task.description || ''}`.toLowerCase();
      return taskText.includes('team') || taskText.includes('collaborate') || 
             taskText.includes('review') || taskText.includes('meeting');
    });

    if (collaborationTasks.length >= 15) {
      achievements.push({
        id: 'team-player',
        title: 'Team Player',
        description: 'Completed 15+ collaboration tasks',
        category: 'collaboration',
        icon: '🤝',
        points: 45,
        earnedDate: collaborationTasks[14]?.updatedAt || new Date(),
        rarity: 'rare'
      });
    }

    // Weekly task achievements
    const completedWeeklyTasks = weeklyTasks.filter(task => 
      ['completed', 'done'].includes(task.status)
    );

    if (completedWeeklyTasks.length >= 12) {
      achievements.push({
        id: 'weekly-warrior',
        title: 'Weekly Warrior',
        description: 'Completed 12+ weekly tasks',
        category: 'consistency',
        icon: '📅',
        points: 40,
        earnedDate: completedWeeklyTasks[11]?.updatedAt || new Date(),
        rarity: 'rare'
      });
    }

    // Special achievements based on task priorities
    const highPriorityCompleted = completedTasks.filter(task => task.priority === 'high');
    if (highPriorityCompleted.length >= 10) {
      achievements.push({
        id: 'priority-master',
        title: 'Priority Master',
        description: 'Completed 10+ high-priority tasks',
        category: 'quality',
        icon: '🔥',
        points: 55,
        earnedDate: highPriorityCompleted[9]?.updatedAt || new Date(),
        rarity: 'epic'
      });
    }

    // Recent achievement (last 7 days)
    const recentAchievements = achievements.filter(achievement => {
      const earnedDate = new Date(achievement.earnedDate);
      const weekAgo = subMonths(new Date(), 0.25); // About a week
      return earnedDate >= weekAgo;
    });

    // Sort achievements by points (highest first) and date (most recent first)
    achievements.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return new Date(b.earnedDate) - new Date(a.earnedDate);
    });

    // Calculate achievement statistics
    const stats = {
      totalAchievements: achievements.length,
      totalPoints: achievements.reduce((sum, achievement) => sum + achievement.points, 0),
      recentAchievements: recentAchievements.length,
      byCategory: {
        milestone: achievements.filter(a => a.category === 'milestone').length,
        quality: achievements.filter(a => a.category === 'quality').length,
        consistency: achievements.filter(a => a.category === 'consistency').length,
        learning: achievements.filter(a => a.category === 'learning').length,
        collaboration: achievements.filter(a => a.category === 'collaboration').length
      },
      byRarity: {
        common: achievements.filter(a => a.rarity === 'common').length,
        rare: achievements.filter(a => a.rarity === 'rare').length,
        epic: achievements.filter(a => a.rarity === 'epic').length,
        legendary: achievements.filter(a => a.rarity === 'legendary').length
      }
    };

    // Generate next achievements to work towards
    const nextAchievements = generateNextAchievements(tasks, weeklyTasks, achievements);

    return NextResponse.json({ 
      achievements,
      stats,
      nextAchievements,
      recentAchievements
    });

  } catch (error) {
    console.error('Error fetching achievements:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch achievements',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

function generateNextAchievements(tasks, weeklyTasks, currentAchievements) {
  const nextAchievements = [];
  const completedTasks = tasks.filter(task => ['completed', 'done'].includes(task.status));
  const currentAchievementIds = currentAchievements.map(a => a.id);

  // Task completion milestones
  if (!currentAchievementIds.includes('centurion') && completedTasks.length < 100) {
    nextAchievements.push({
      id: 'centurion',
      title: 'Centurion',
      description: 'Complete 100 tasks',
      category: 'milestone',
      icon: '💯',
      points: 100,
      progress: completedTasks.length,
      target: 100,
      progressPercentage: Math.round((completedTasks.length / 100) * 100)
    });
  }

  if (!currentAchievementIds.includes('half-century') && completedTasks.length < 50) {
    nextAchievements.push({
      id: 'half-century',
      title: 'Half Century',
      description: 'Complete 50 tasks',
      category: 'milestone',
      icon: '🎯',
      points: 50,
      progress: completedTasks.length,
      target: 50,
      progressPercentage: Math.round((completedTasks.length / 50) * 100)
    });
  }

  // Quality achievements
  const highQualityTasks = tasks.filter(task => task.rating && task.rating >= 4);
  if (!currentAchievementIds.includes('quality-master') && highQualityTasks.length < 20) {
    nextAchievements.push({
      id: 'quality-master',
      title: 'Quality Master',
      description: 'Achieve 4+ star rating on 20 tasks',
      category: 'quality',
      icon: '⭐',
      points: 75,
      progress: highQualityTasks.length,
      target: 20,
      progressPercentage: Math.round((highQualityTasks.length / 20) * 100)
    });
  }

  // Learning achievements
  const learningTasks = tasks.filter(task => {
    const taskText = `${task.title} ${task.description || ''}`.toLowerCase();
    return taskText.includes('learn') || taskText.includes('study') || 
           taskText.includes('research') || taskText.includes('tutorial');
  });

  if (!currentAchievementIds.includes('knowledge-seeker') && learningTasks.length < 20) {
    nextAchievements.push({
      id: 'knowledge-seeker',
      title: 'Knowledge Seeker',
      description: 'Complete 20 learning-focused tasks',
      category: 'learning',
      icon: '📚',
      points: 50,
      progress: learningTasks.length,
      target: 20,
      progressPercentage: Math.round((learningTasks.length / 20) * 100)
    });
  }

  // Sort by progress percentage (closest to completion first)
  nextAchievements.sort((a, b) => b.progressPercentage - a.progressPercentage);

  return nextAchievements.slice(0, 5); // Return top 5 next achievements
}