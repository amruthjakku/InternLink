import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../utils/database';
import Task from '../../../../models/Task';
import User from '../../../../models/User';
import { addWeeks, addMonths, format } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const userId = session.user.id;
    const user = await User.findById(userId);

    // Get user's current tasks to analyze progress
    const tasks = await Task.find({
      assignedTo: userId,
      status: { $in: ['not_started', 'in_progress', 'completed', 'done'] }
    }).sort({ createdAt: -1 });

    // Generate goals based on user's current performance and areas for improvement
    const goals = [];

    // Skill Development Goals
    const skillGoals = generateSkillGoals(tasks);
    goals.push(...skillGoals);

    // Performance Goals
    const performanceGoals = generatePerformanceGoals(tasks);
    goals.push(...performanceGoals);

    // Learning Goals
    const learningGoals = generateLearningGoals(tasks, user);
    goals.push(...learningGoals);

    // Quality Goals
    const qualityGoals = generateQualityGoals(tasks);
    goals.push(...qualityGoals);

    // Consistency Goals
    const consistencyGoals = generateConsistencyGoals(tasks);
    goals.push(...consistencyGoals);

    // Sort goals by priority and due date
    goals.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return new Date(a.dueDate) - new Date(b.dueDate);
    });

    // Calculate overall goal statistics
    const stats = {
      totalGoals: goals.length,
      completedGoals: goals.filter(g => g.progress >= 100).length,
      inProgressGoals: goals.filter(g => g.progress > 0 && g.progress < 100).length,
      notStartedGoals: goals.filter(g => g.progress === 0).length,
      averageProgress: goals.length > 0 ? 
        Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length) : 0,
      byPriority: {
        high: goals.filter(g => g.priority === 'high').length,
        medium: goals.filter(g => g.priority === 'medium').length,
        low: goals.filter(g => g.priority === 'low').length
      },
      upcomingDeadlines: goals.filter(g => {
        const dueDate = new Date(g.dueDate);
        const twoWeeksFromNow = addWeeks(new Date(), 2);
        return dueDate <= twoWeeksFromNow && g.progress < 100;
      }).length
    };

    return NextResponse.json({ 
      goals,
      stats,
      recommendations: generateGoalRecommendations(goals, stats)
    });

  } catch (error) {
    console.error('Error fetching goals:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch goals',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

function generateSkillGoals(tasks) {
  const goals = [];
  
  // Frontend Development Goal
  const frontendTasks = tasks.filter(task => {
    const taskText = `${task.title} ${task.description || ''}`.toLowerCase();
    return taskText.includes('react') || taskText.includes('frontend') || 
           taskText.includes('ui') || taskText.includes('javascript');
  });

  if (frontendTasks.length > 0) {
    const completedFrontend = frontendTasks.filter(t => ['completed', 'done'].includes(t.status)).length;
    const progress = Math.round((completedFrontend / Math.max(frontendTasks.length, 5)) * 100);
    
    goals.push({
      id: 'frontend-mastery',
      title: 'Frontend Development Mastery',
      description: 'Become proficient in modern frontend technologies and best practices',
      category: 'skill',
      priority: 'high',
      progress: Math.min(progress, 100),
      dueDate: addMonths(new Date(), 3),
      milestones: [
        { id: 1, title: 'Complete 5 React components', completed: completedFrontend >= 5 },
        { id: 2, title: 'Implement responsive design', completed: progress >= 40 },
        { id: 3, title: 'Master state management', completed: progress >= 60 },
        { id: 4, title: 'Optimize performance', completed: progress >= 80 },
        { id: 5, title: 'Build complete application', completed: progress >= 100 }
      ],
      relatedTasks: frontendTasks.length,
      estimatedHours: 40
    });
  }

  // Backend Development Goal
  const backendTasks = tasks.filter(task => {
    const taskText = `${task.title} ${task.description || ''}`.toLowerCase();
    return taskText.includes('api') || taskText.includes('backend') || 
           taskText.includes('server') || taskText.includes('database');
  });

  if (backendTasks.length > 0) {
    const completedBackend = backendTasks.filter(t => ['completed', 'done'].includes(t.status)).length;
    const progress = Math.round((completedBackend / Math.max(backendTasks.length, 4)) * 100);
    
    goals.push({
      id: 'backend-proficiency',
      title: 'Backend Development Proficiency',
      description: 'Develop strong backend development and API design skills',
      category: 'skill',
      priority: 'medium',
      progress: Math.min(progress, 100),
      dueDate: addMonths(new Date(), 2),
      milestones: [
        { id: 1, title: 'Build RESTful APIs', completed: completedBackend >= 2 },
        { id: 2, title: 'Database integration', completed: progress >= 50 },
        { id: 3, title: 'Authentication & security', completed: progress >= 75 },
        { id: 4, title: 'Performance optimization', completed: progress >= 100 }
      ],
      relatedTasks: backendTasks.length,
      estimatedHours: 30
    });
  }

  return goals;
}

function generatePerformanceGoals(tasks) {
  const goals = [];
  const completedTasks = tasks.filter(t => ['completed', 'done'].includes(t.status));
  const totalTasks = tasks.length;
  const currentCompletionRate = totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0;

  // Task Completion Goal
  if (currentCompletionRate < 85) {
    goals.push({
      id: 'completion-rate',
      title: 'Improve Task Completion Rate',
      description: 'Achieve and maintain 85%+ task completion rate',
      category: 'performance',
      priority: 'high',
      progress: Math.round(currentCompletionRate),
      dueDate: addWeeks(new Date(), 6),
      milestones: [
        { id: 1, title: 'Reach 70% completion rate', completed: currentCompletionRate >= 70 },
        { id: 2, title: 'Reach 80% completion rate', completed: currentCompletionRate >= 80 },
        { id: 3, title: 'Reach 85% completion rate', completed: currentCompletionRate >= 85 },
        { id: 4, title: 'Maintain for 2 weeks', completed: currentCompletionRate >= 90 }
      ],
      relatedTasks: totalTasks,
      estimatedHours: 20
    });
  }

  // Quality Goal
  const ratedTasks = tasks.filter(t => t.rating);
  const avgRating = ratedTasks.length > 0 ? 
    ratedTasks.reduce((sum, t) => sum + t.rating, 0) / ratedTasks.length : 0;

  if (avgRating < 4 || ratedTasks.length < 5) {
    goals.push({
      id: 'quality-improvement',
      title: 'Enhance Work Quality',
      description: 'Consistently deliver high-quality work with 4+ star ratings',
      category: 'performance',
      priority: 'medium',
      progress: Math.round((avgRating / 4) * 100),
      dueDate: addWeeks(new Date(), 8),
      milestones: [
        { id: 1, title: 'Achieve 3.5+ average rating', completed: avgRating >= 3.5 },
        { id: 2, title: 'Achieve 4.0+ average rating', completed: avgRating >= 4.0 },
        { id: 3, title: 'Get 5 high-quality ratings', completed: ratedTasks.filter(t => t.rating >= 4).length >= 5 },
        { id: 4, title: 'Maintain quality standard', completed: avgRating >= 4.2 }
      ],
      relatedTasks: ratedTasks.length,
      estimatedHours: 25
    });
  }

  return goals;
}

function generateLearningGoals(tasks, user) {
  const goals = [];

  // Technology Learning Goal
  goals.push({
    id: 'tech-learning',
    title: 'Master New Technologies',
    description: 'Learn and apply 3 new technologies or frameworks',
    category: 'learning',
    priority: 'medium',
    progress: 33, // Assume some progress
    dueDate: addMonths(new Date(), 4),
    milestones: [
      { id: 1, title: 'Choose learning path', completed: true },
      { id: 2, title: 'Complete first technology', completed: false },
      { id: 3, title: 'Apply in real project', completed: false },
      { id: 4, title: 'Master second technology', completed: false },
      { id: 5, title: 'Complete all three technologies', completed: false }
    ],
    relatedTasks: 0,
    estimatedHours: 60
  });

  // Certification Goal
  goals.push({
    id: 'certification',
    title: 'Earn Professional Certification',
    description: 'Complete a relevant professional certification in your field',
    category: 'learning',
    priority: 'low',
    progress: 15,
    dueDate: addMonths(new Date(), 6),
    milestones: [
      { id: 1, title: 'Choose certification program', completed: true },
      { id: 2, title: 'Complete 25% of coursework', completed: false },
      { id: 3, title: 'Complete 50% of coursework', completed: false },
      { id: 4, title: 'Complete 75% of coursework', completed: false },
      { id: 5, title: 'Pass certification exam', completed: false }
    ],
    relatedTasks: 0,
    estimatedHours: 80
  });

  return goals;
}

function generateQualityGoals(tasks) {
  const goals = [];

  // Code Review Goal
  const codeReviewTasks = tasks.filter(task => {
    const taskText = `${task.title} ${task.description || ''}`.toLowerCase();
    return taskText.includes('review') || taskText.includes('refactor');
  });

  goals.push({
    id: 'code-quality',
    title: 'Improve Code Quality Standards',
    description: 'Implement best practices and maintain high code quality',
    category: 'quality',
    priority: 'medium',
    progress: Math.min(codeReviewTasks.length * 25, 100),
    dueDate: addWeeks(new Date(), 10),
    milestones: [
      { id: 1, title: 'Set up code linting', completed: codeReviewTasks.length >= 1 },
      { id: 2, title: 'Implement testing standards', completed: codeReviewTasks.length >= 2 },
      { id: 3, title: 'Code review participation', completed: codeReviewTasks.length >= 3 },
      { id: 4, title: 'Refactor legacy code', completed: codeReviewTasks.length >= 4 }
    ],
    relatedTasks: codeReviewTasks.length,
    estimatedHours: 35
  });

  return goals;
}

function generateConsistencyGoals(tasks) {
  const goals = [];

  // Daily Productivity Goal
  goals.push({
    id: 'daily-consistency',
    title: 'Maintain Daily Productivity',
    description: 'Complete at least one meaningful task every working day',
    category: 'consistency',
    priority: 'high',
    progress: 65, // Assume current progress
    dueDate: addWeeks(new Date(), 4),
    milestones: [
      { id: 1, title: 'Complete 1 week streak', completed: true },
      { id: 2, title: 'Complete 2 week streak', completed: true },
      { id: 3, title: 'Complete 3 week streak', completed: false },
      { id: 4, title: 'Complete 4 week streak', completed: false }
    ],
    relatedTasks: tasks.length,
    estimatedHours: 40
  });

  return goals;
}

function generateGoalRecommendations(goals, stats) {
  const recommendations = [];

  // High priority goals recommendation
  const highPriorityGoals = goals.filter(g => g.priority === 'high' && g.progress < 100);
  if (highPriorityGoals.length > 0) {
    recommendations.push({
      type: 'priority',
      title: 'Focus on High Priority Goals',
      message: `You have ${highPriorityGoals.length} high-priority goals. Consider focusing on these first for maximum impact.`,
      goals: highPriorityGoals.slice(0, 2).map(g => g.title)
    });
  }

  // Upcoming deadlines recommendation
  if (stats.upcomingDeadlines > 0) {
    recommendations.push({
      type: 'deadline',
      title: 'Upcoming Deadlines',
      message: `${stats.upcomingDeadlines} goals have deadlines within 2 weeks. Plan your time accordingly.`,
      urgency: 'high'
    });
  }

  // Progress recommendation
  if (stats.averageProgress < 30) {
    recommendations.push({
      type: 'progress',
      title: 'Accelerate Progress',
      message: 'Your average goal progress is low. Consider breaking down goals into smaller, actionable tasks.',
      suggestion: 'Break down large goals into weekly milestones'
    });
  } else if (stats.averageProgress > 70) {
    recommendations.push({
      type: 'progress',
      title: 'Great Progress!',
      message: 'You\'re making excellent progress on your goals. Consider setting more challenging objectives.',
      suggestion: 'Add stretch goals to continue growing'
    });
  }

  // Balance recommendation
  const skillGoals = goals.filter(g => g.category === 'skill').length;
  const performanceGoals = goals.filter(g => g.category === 'performance').length;
  
  if (skillGoals === 0) {
    recommendations.push({
      type: 'balance',
      title: 'Add Skill Development Goals',
      message: 'Consider adding skill development goals to enhance your technical capabilities.',
      suggestion: 'Focus on emerging technologies in your field'
    });
  }

  if (performanceGoals === 0) {
    recommendations.push({
      type: 'balance',
      title: 'Add Performance Goals',
      message: 'Consider setting performance improvement goals to enhance your productivity.',
      suggestion: 'Set targets for task completion and quality metrics'
    });
  }

  return recommendations;
}