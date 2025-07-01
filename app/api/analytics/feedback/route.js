import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../utils/database';
import Task from '../../../../models/Task';
import User from '../../../../models/User';
import { subMonths } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const userId = session.user.id;
    
    // Get tasks with feedback from the last 3 months
    const startDate = subMonths(new Date(), 3);
    const tasks = await Task.find({
      assignedTo: userId,
      createdAt: { $gte: startDate },
      $or: [
        { feedback: { $exists: true, $ne: null, $ne: '' } },
        { rating: { $exists: true, $ne: null } },
        { mentorComments: { $exists: true, $ne: null, $ne: '' } }
      ]
    })
    .populate('createdBy', 'name role')
    .sort({ updatedAt: -1 });

    // Transform tasks into feedback format
    const feedback = [];

    for (const task of tasks) {
      if (task.feedback || task.mentorComments || task.rating) {
        // Get mentor information
        const mentor = task.createdBy || { name: 'System', role: 'system' };
        
        // Determine feedback category based on task
        let category = 'General';
        if (task.category) {
          category = task.category;
        } else if (task.title) {
          const title = task.title.toLowerCase();
          if (title.includes('code') || title.includes('programming')) category = 'Code Quality';
          else if (title.includes('design') || title.includes('ui')) category = 'Design';
          else if (title.includes('test')) category = 'Testing';
          else if (title.includes('documentation')) category = 'Documentation';
          else if (title.includes('meeting') || title.includes('presentation')) category = 'Communication';
        }

        // Generate strengths and improvements based on rating and feedback
        const strengths = [];
        const improvements = [];

        if (task.rating >= 4) {
          strengths.push('High Quality Work', 'Attention to Detail');
          if (task.priority === 'high') strengths.push('Handles Pressure Well');
        }
        if (task.rating >= 3) {
          strengths.push('Meets Requirements');
        }

        if (task.rating < 3) {
          improvements.push('Code Quality', 'Requirements Understanding');
        }
        if (task.rating < 4) {
          improvements.push('Attention to Detail');
        }

        // Add specific improvements based on task type
        if (category === 'Code Quality' && task.rating < 4) {
          improvements.push('Code Structure', 'Best Practices');
        }
        if (category === 'Testing' && task.rating < 4) {
          improvements.push('Test Coverage', 'Edge Cases');
        }

        // Generate comment based on available data
        let comment = task.feedback || task.mentorComments || '';
        if (!comment && task.rating) {
          if (task.rating >= 4) {
            comment = `Excellent work on "${task.title}". The quality of your deliverable was outstanding and met all requirements effectively.`;
          } else if (task.rating >= 3) {
            comment = `Good work on "${task.title}". The task was completed satisfactorily with room for minor improvements.`;
          } else {
            comment = `Task "${task.title}" was completed but there are several areas that need improvement for future tasks.`;
          }
        }

        feedback.push({
          id: task._id.toString(),
          taskId: task._id.toString(),
          taskTitle: task.title,
          mentor: mentor.name,
          mentorRole: mentor.role,
          category: category,
          rating: task.rating || 3,
          comment: comment,
          strengths: strengths.length > 0 ? strengths : ['Task Completion'],
          improvements: improvements.length > 0 ? improvements : ['Continue Current Approach'],
          date: task.updatedAt || task.createdAt,
          priority: task.priority || 'medium',
          status: task.status
        });
      }
    }

    // If no real feedback exists, generate some sample feedback for demonstration
    if (feedback.length === 0) {
      const sampleFeedback = [
        {
          id: 'sample-1',
          taskId: 'sample-task-1',
          taskTitle: 'Frontend Component Development',
          mentor: 'Sarah Johnson',
          mentorRole: 'mentor',
          category: 'Code Quality',
          rating: 4,
          comment: 'Great work on the React component! Your code is clean and well-structured. The component is reusable and follows best practices.',
          strengths: ['Clean Code', 'Best Practices', 'Reusability'],
          improvements: ['Add More Comments', 'Error Handling'],
          date: subMonths(new Date(), 0.5),
          priority: 'high',
          status: 'completed'
        },
        {
          id: 'sample-2',
          taskId: 'sample-task-2',
          taskTitle: 'API Integration',
          mentor: 'Mike Chen',
          mentorRole: 'super-mentor',
          category: 'Backend Development',
          rating: 3,
          comment: 'The API integration works correctly, but consider adding better error handling and input validation for production use.',
          strengths: ['Functional Implementation', 'Meets Requirements'],
          improvements: ['Error Handling', 'Input Validation', 'Documentation'],
          date: subMonths(new Date(), 1),
          priority: 'medium',
          status: 'completed'
        },
        {
          id: 'sample-3',
          taskId: 'sample-task-3',
          taskTitle: 'Database Schema Design',
          mentor: 'Alex Rodriguez',
          mentorRole: 'mentor',
          category: 'Database Management',
          rating: 5,
          comment: 'Excellent database design! The schema is well-normalized, efficient, and scalable. Great attention to relationships and constraints.',
          strengths: ['Database Design', 'Normalization', 'Scalability', 'Performance'],
          improvements: [],
          date: subMonths(new Date(), 1.5),
          priority: 'high',
          status: 'completed'
        }
      ];
      
      feedback.push(...sampleFeedback);
    }

    // Calculate feedback statistics
    const stats = {
      totalFeedback: feedback.length,
      averageRating: feedback.length > 0 ? 
        Math.round((feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length) * 10) / 10 : 0,
      ratingDistribution: {
        5: feedback.filter(f => f.rating === 5).length,
        4: feedback.filter(f => f.rating === 4).length,
        3: feedback.filter(f => f.rating === 3).length,
        2: feedback.filter(f => f.rating === 2).length,
        1: feedback.filter(f => f.rating === 1).length
      },
      byCategory: {},
      commonStrengths: {},
      commonImprovements: {},
      recentTrend: calculateRecentTrend(feedback)
    };

    // Calculate category distribution
    feedback.forEach(f => {
      stats.byCategory[f.category] = (stats.byCategory[f.category] || 0) + 1;
    });

    // Calculate common strengths and improvements
    feedback.forEach(f => {
      f.strengths.forEach(strength => {
        stats.commonStrengths[strength] = (stats.commonStrengths[strength] || 0) + 1;
      });
      f.improvements.forEach(improvement => {
        stats.commonImprovements[improvement] = (stats.commonImprovements[improvement] || 0) + 1;
      });
    });

    // Sort by frequency
    stats.commonStrengths = Object.entries(stats.commonStrengths)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});

    stats.commonImprovements = Object.entries(stats.commonImprovements)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});

    // Generate insights
    const insights = generateFeedbackInsights(feedback, stats);

    return NextResponse.json({ 
      feedback,
      stats,
      insights
    });

  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch feedback',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

function calculateRecentTrend(feedback) {
  if (feedback.length < 4) return 'stable';
  
  // Get recent feedback (last 4 items)
  const recent = feedback.slice(0, 4);
  const older = feedback.slice(4, 8);
  
  if (older.length === 0) return 'stable';
  
  const recentAvg = recent.reduce((sum, f) => sum + f.rating, 0) / recent.length;
  const olderAvg = older.reduce((sum, f) => sum + f.rating, 0) / older.length;
  
  const difference = recentAvg - olderAvg;
  
  if (difference > 0.3) return 'improving';
  if (difference < -0.3) return 'declining';
  return 'stable';
}

function generateFeedbackInsights(feedback, stats) {
  const insights = [];

  // Rating trend insight
  if (stats.recentTrend === 'improving') {
    insights.push({
      type: 'positive',
      title: 'Performance Improving',
      message: 'Your recent feedback shows improving ratings. Keep up the excellent work!',
      icon: '📈'
    });
  } else if (stats.recentTrend === 'declining') {
    insights.push({
      type: 'warning',
      title: 'Focus on Quality',
      message: 'Recent feedback suggests room for improvement. Review common improvement areas.',
      icon: '📉'
    });
  }

  // Strengths insight
  const topStrength = Object.keys(stats.commonStrengths)[0];
  if (topStrength) {
    insights.push({
      type: 'positive',
      title: 'Key Strength Identified',
      message: `"${topStrength}" is your most recognized strength. Continue leveraging this skill!`,
      icon: '💪'
    });
  }

  // Improvement insight
  const topImprovement = Object.keys(stats.commonImprovements)[0];
  if (topImprovement) {
    insights.push({
      type: 'info',
      title: 'Focus Area',
      message: `"${topImprovement}" appears frequently in feedback. Consider focusing on this area for growth.`,
      icon: '🎯'
    });
  }

  // Rating distribution insight
  const highRatings = (stats.ratingDistribution[4] || 0) + (stats.ratingDistribution[5] || 0);
  const totalRatings = feedback.length;
  const highRatingPercentage = totalRatings > 0 ? (highRatings / totalRatings) * 100 : 0;

  if (highRatingPercentage >= 70) {
    insights.push({
      type: 'positive',
      title: 'Consistently High Quality',
      message: `${Math.round(highRatingPercentage)}% of your work receives 4+ star ratings. Excellent consistency!`,
      icon: '⭐'
    });
  } else if (highRatingPercentage < 40) {
    insights.push({
      type: 'info',
      title: 'Quality Opportunity',
      message: 'Focus on delivering higher quality work to improve your ratings and feedback.',
      icon: '🔧'
    });
  }

  return insights;
}