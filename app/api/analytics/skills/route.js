import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../utils/database';
import Task from '../../../../models/Task';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const userId = session.user.id;

    // Get all completed tasks for the user
    const completedTasks = await Task.find({
      assignedTo: userId,
      status: 'completed'
    });

    // Extract skills from task categories and calculate proficiency
    const skillsMap = {};
    
    completedTasks.forEach(task => {
      const category = task.category || 'General';
      if (!skillsMap[category]) {
        skillsMap[category] = {
          skill: category,
          level: 0,
          tasksCompleted: 0,
          totalPoints: 0
        };
      }
      
      skillsMap[category].tasksCompleted++;
      // Calculate points based on task priority and completion
      const points = task.priority === 'high' ? 3 : task.priority === 'medium' ? 2 : 1;
      skillsMap[category].totalPoints += points;
    });

    // Convert to array and calculate levels (0-100 scale)
    const skills = Object.values(skillsMap).map(skill => ({
      ...skill,
      level: Math.min(100, Math.round((skill.totalPoints / Math.max(1, skill.tasksCompleted)) * 20))
    }));

    // Add some default skills if none exist
    if (skills.length === 0) {
      skills.push(
        { skill: 'Programming', level: 0, tasksCompleted: 0, totalPoints: 0 },
        { skill: 'Problem Solving', level: 0, tasksCompleted: 0, totalPoints: 0 },
        { skill: 'Communication', level: 0, tasksCompleted: 0, totalPoints: 0 },
        { skill: 'Teamwork', level: 0, tasksCompleted: 0, totalPoints: 0 }
      );
    }

    return NextResponse.json({ skills });

  } catch (error) {
    console.error('Error fetching skills data:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch skills data' 
    }, { status: 500 });
  }
}