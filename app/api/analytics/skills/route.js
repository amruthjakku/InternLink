import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../utils/database';
import User from '../../../../models/User';
import Task from '../../../../models/Task';
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
    const user = await User.findById(userId);

    // Get user's tasks from the last 3 months to analyze skill development
    const startDate = subMonths(new Date(), 3);
    const tasks = await Task.find({
      assignedTo: userId,
      createdAt: { $gte: startDate }
    }).sort({ createdAt: 1 });

    // Define skill categories and their associated keywords/technologies
    const skillCategories = {
      'Frontend Development': {
        keywords: ['react', 'vue', 'angular', 'javascript', 'typescript', 'html', 'css', 'ui', 'frontend'],
        targetLevel: 8,
        icon: '🎨'
      },
      'Backend Development': {
        keywords: ['node', 'express', 'api', 'server', 'database', 'backend', 'python', 'java'],
        targetLevel: 7,
        icon: '⚙️'
      },
      'Database Management': {
        keywords: ['mongodb', 'mysql', 'postgresql', 'database', 'sql', 'nosql', 'query'],
        targetLevel: 6,
        icon: '🗄️'
      },
      'DevOps & Deployment': {
        keywords: ['docker', 'kubernetes', 'aws', 'deployment', 'ci/cd', 'devops', 'cloud'],
        targetLevel: 5,
        icon: '🚀'
      },
      'Testing & Quality': {
        keywords: ['test', 'testing', 'jest', 'cypress', 'unit test', 'integration', 'quality'],
        targetLevel: 6,
        icon: '🧪'
      },
      'Version Control': {
        keywords: ['git', 'github', 'gitlab', 'version control', 'merge', 'branch'],
        targetLevel: 7,
        icon: '📝'
      },
      'Problem Solving': {
        keywords: ['algorithm', 'debug', 'troubleshoot', 'optimize', 'performance', 'solution'],
        targetLevel: 8,
        icon: '🧩'
      },
      'Communication': {
        keywords: ['documentation', 'presentation', 'meeting', 'review', 'feedback'],
        targetLevel: 7,
        icon: '💬'
      }
    };

    // Calculate skill levels based on task involvement and completion
    const skills = Object.entries(skillCategories).map(([skillName, skillData]) => {
      // Find tasks related to this skill
      const relatedTasks = tasks.filter(task => {
        const taskText = `${task.title} ${task.description || ''} ${task.category || ''}`.toLowerCase();
        return skillData.keywords.some(keyword => taskText.includes(keyword));
      });

      const completedRelatedTasks = relatedTasks.filter(task => 
        ['completed', 'done'].includes(task.status)
      );

      // Calculate current level based on task complexity and completion
      let currentLevel = 1;
      if (relatedTasks.length > 0) {
        const completionRate = completedRelatedTasks.length / relatedTasks.length;
        const avgProgress = relatedTasks.reduce((sum, task) => sum + (task.progress || 0), 0) / relatedTasks.length;
        const avgRating = relatedTasks
          .filter(task => task.rating)
          .reduce((sum, task) => sum + task.rating, 0) / relatedTasks.filter(task => task.rating).length || 3;

        // Calculate level based on multiple factors
        currentLevel = Math.min(10, Math.round(
          (completionRate * 3) + 
          (avgProgress / 20) + 
          (avgRating * 1.5) + 
          (Math.min(relatedTasks.length, 10) * 0.2)
        ));
      }

      // Get previous level (simulate historical data)
      const previousLevel = Math.max(1, currentLevel - Math.floor(Math.random() * 2));

      // Calculate progress percentage towards target
      const progress = Math.round((currentLevel / skillData.targetLevel) * 100);

      // Generate recent activities
      const recentActivities = completedRelatedTasks
        .slice(-3)
        .map(task => `Completed: ${task.title}`);

      // Calculate time to target (in weeks)
      const remainingLevels = Math.max(0, skillData.targetLevel - currentLevel);
      const timeToTarget = remainingLevels > 0 ? `${remainingLevels * 2}-${remainingLevels * 4} weeks` : 'Target achieved!';

      // Next milestone
      const nextLevel = Math.min(10, currentLevel + 1);
      const nextMilestone = nextLevel <= skillData.targetLevel ? 
        `Reach level ${nextLevel} in ${skillName}` : 
        'Maintain current expertise level';

      return {
        name: skillName,
        icon: skillData.icon,
        currentLevel,
        previousLevel,
        targetLevel: skillData.targetLevel,
        progress,
        nextMilestone,
        timeToTarget,
        recentActivities,
        relatedTasksCount: relatedTasks.length,
        completedTasksCount: completedRelatedTasks.length,
        trend: currentLevel > previousLevel ? 'up' : currentLevel < previousLevel ? 'down' : 'stable'
      };
    });

    // Sort skills by current level (highest first)
    skills.sort((a, b) => b.currentLevel - a.currentLevel);

    // Calculate overall skill metrics
    const overallMetrics = {
      averageLevel: Math.round(skills.reduce((sum, skill) => sum + skill.currentLevel, 0) / skills.length * 10) / 10,
      skillsAtTarget: skills.filter(skill => skill.currentLevel >= skill.targetLevel).length,
      totalSkills: skills.length,
      improvingSkills: skills.filter(skill => skill.trend === 'up').length,
      topSkill: skills[0]?.name || 'None',
      focusArea: skills.find(skill => skill.currentLevel < skill.targetLevel)?.name || 'Maintain current levels'
    };

    return NextResponse.json({ 
      skills,
      overallMetrics,
      recommendations: generateSkillRecommendations(skills)
    });

  } catch (error) {
    console.error('Error fetching skills data:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch skills data',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

function generateSkillRecommendations(skills) {
  const recommendations = [];

  // Find skills that need improvement
  const skillsNeedingWork = skills.filter(skill => 
    skill.currentLevel < skill.targetLevel && skill.currentLevel < 5
  );

  if (skillsNeedingWork.length > 0) {
    recommendations.push({
      type: 'improvement',
      title: 'Focus Areas',
      message: `Consider dedicating more time to ${skillsNeedingWork[0].name}. Take on tasks that involve ${skillsNeedingWork[0].name.toLowerCase()} to build experience.`,
      priority: 'high'
    });
  }

  // Find strong skills
  const strongSkills = skills.filter(skill => skill.currentLevel >= 7);
  if (strongSkills.length > 0) {
    recommendations.push({
      type: 'leverage',
      title: 'Leverage Strengths',
      message: `Your ${strongSkills[0].name} skills are excellent! Consider mentoring others or taking on more complex projects in this area.`,
      priority: 'medium'
    });
  }

  // Find skills with good progress
  const improvingSkills = skills.filter(skill => skill.trend === 'up');
  if (improvingSkills.length > 0) {
    recommendations.push({
      type: 'momentum',
      title: 'Keep the Momentum',
      message: `Great progress in ${improvingSkills.map(s => s.name).join(', ')}! Continue working on related tasks to maintain this growth.`,
      priority: 'low'
    });
  }

  return recommendations;
}