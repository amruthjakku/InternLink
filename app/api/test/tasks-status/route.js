import { NextResponse } from 'next/server';
import { getDatabase } from '../../../../utils/database';

export async function GET(request) {
  try {
    const db = await getDatabase();
    
    // Get all tasks
    const allTasks = await db.collection('tasks').find({}).toArray();
    
    // Get all cohorts
    const allCohorts = await db.collection('cohorts').find({}).toArray();
    
    // Get all users with cohorts
    const usersWithCohorts = await db.collection('users').find({ 
      cohortId: { $exists: true, $ne: null },
      role: 'intern'
    }).toArray();
    
    // Analyze tasks by assignment type
    const tasksByType = {
      cohort: allTasks.filter(t => t.assignmentType === 'cohort'),
      individual: allTasks.filter(t => t.assignmentType === 'individual'),
      other: allTasks.filter(t => !t.assignmentType || (t.assignmentType !== 'cohort' && t.assignmentType !== 'individual'))
    };
    
    return NextResponse.json({
      success: true,
      summary: {
        totalTasks: allTasks.length,
        cohortTasks: tasksByType.cohort.length,
        individualTasks: tasksByType.individual.length,
        otherTasks: tasksByType.other.length,
        totalCohorts: allCohorts.length,
        internsWithCohorts: usersWithCohorts.length
      },
      tasks: allTasks.map(t => ({
        id: t._id,
        title: t.title,
        assignmentType: t.assignmentType,
        cohortId: t.cohortId,
        assignedTo: t.assignedTo,
        isActive: t.isActive,
        status: t.status
      })),
      cohorts: allCohorts.map(c => ({
        id: c._id,
        name: c.name
      })),
      interns: usersWithCohorts.map(u => ({
        id: u._id,
        name: u.name,
        gitlabUsername: u.gitlabUsername,
        cohortId: u.cohortId
      }))
    });

  } catch (error) {
    console.error('Error checking tasks status:', error);
    return NextResponse.json({ 
      error: 'Failed to check tasks status',
      details: error.message 
    }, { status: 500 });
  }
}