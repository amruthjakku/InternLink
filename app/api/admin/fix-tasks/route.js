import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { getDatabase } from '../../../../utils/database';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDatabase();
    
    // Find all tasks that are inactive but should be active
    const inactiveTasks = await db.collection('tasks').find({
      isActive: false,
      assignmentType: 'cohort'
    }).toArray();
    
    console.log(`Found ${inactiveTasks.length} inactive cohort tasks`);
    
    // Activate all inactive cohort tasks
    const result = await db.collection('tasks').updateMany(
      {
        isActive: false,
        assignmentType: 'cohort'
      },
      {
        $set: {
          isActive: true,
          updatedAt: new Date()
        }
      }
    );
    
    console.log(`Activated ${result.modifiedCount} tasks`);
    
    return NextResponse.json({
      success: true,
      message: `Successfully activated ${result.modifiedCount} cohort tasks`,
      tasksFound: inactiveTasks.length,
      tasksActivated: result.modifiedCount,
      activatedTasks: inactiveTasks.map(t => ({
        id: t._id,
        title: t.title,
        cohortId: t.cohortId
      }))
    });

  } catch (error) {
    console.error('Error fixing tasks:', error);
    return NextResponse.json({ 
      error: 'Failed to fix tasks',
      details: error.message 
    }, { status: 500 });
  }
}