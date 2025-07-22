import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { getDatabase } from '../../../../utils/database';
import { ObjectId } from 'mongodb';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDatabase();
    
    // Get all tasks
    const allTasks = await db.collection('tasks').find({}).toArray();
    
    // Get all cohorts
    const allCohorts = await db.collection('cohorts').find({}).toArray();
    
    // Get all users with cohorts
    const usersWithCohorts = await db.collection('users').find({ 
      cohortId: { $exists: true, $ne: null },
      role: 'AI developer Intern'
    }).toArray();
    
    // Analyze tasks by assignment type
    const tasksByType = {
      cohort: allTasks.filter(t => t.assignmentType === 'cohort'),
      individual: allTasks.filter(t => t.assignmentType === 'individual'),
      other: allTasks.filter(t => !t.assignmentType || (t.assignmentType !== 'cohort' && t.assignmentType !== 'individual'))
    };
    
    // Check cohort task assignments
    const cohortTaskAnalysis = tasksByType.cohort.map(task => {
      const cohort = allCohorts.find(c => 
        c._id.toString() === (task.cohortId?.toString() || task.cohortId)
      );
      
      const assignedInterns = usersWithCohorts.filter(u => 
        u.cohortId.toString() === (task.cohortId?.toString() || task.cohortId)
      );
      
      return {
        taskId: task._id,
        title: task.title,
        cohortId: task.cohortId,
        cohortName: cohort?.name || 'Unknown',
        assignedInternsCount: assignedInterns.length,
        assignedInterns: assignedInterns.map(u => ({
          id: u._id,
          name: u.name,
          gitlabUsername: u.gitlabUsername
        })),
        isActive: task.isActive,
        status: task.status
      };
    });
    
    return NextResponse.json({
      summary: {
        totalTasks: allTasks.length,
        cohortTasks: tasksByType.cohort.length,
        individualTasks: tasksByType.individual.length,
        otherTasks: tasksByType.other.length,
        totalCohorts: allCohorts.length,
        internsWithCohorts: usersWithCohorts.length
      },
      cohorts: allCohorts.map(c => ({
        id: c._id,
        name: c.name,
        memberCount: usersWithCohorts.filter(u => u.cohortId.toString() === c._id.toString()).length
      })),
      cohortTaskAnalysis,
      internsWithCohorts: usersWithCohorts.map(u => ({
        id: u._id,
        name: u.name,
        gitlabUsername: u.gitlabUsername,
        cohortId: u.cohortId
      }))
    });

  } catch (error) {
    console.error('Error in debug tasks-cohort:', error);
    return NextResponse.json({ 
      error: 'Failed to analyze tasks and cohorts',
      details: error.message 
    }, { status: 500 });
  }
}