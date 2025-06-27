import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { getDatabase } from '../../../../utils/database';

export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDatabase();
    
    // Get count of existing tasks before deletion
    const taskCount = await db.collection('tasks').countDocuments({});
    
    console.log(`Found ${taskCount} tasks to delete`);
    
    // Delete all tasks
    const deleteResult = await db.collection('tasks').deleteMany({});
    
    console.log(`Deleted ${deleteResult.deletedCount} tasks`);
    
    // Also clear any task submissions/progress records
    const submissionCount = await db.collection('tasksubmissions').countDocuments({});
    const submissionDeleteResult = await db.collection('tasksubmissions').deleteMany({});
    
    console.log(`Deleted ${submissionDeleteResult.deletedCount} task submissions`);
    
    return NextResponse.json({
      success: true,
      message: 'All tasks and submissions cleared successfully',
      tasksDeleted: deleteResult.deletedCount,
      submissionsDeleted: submissionDeleteResult.deletedCount,
      originalTaskCount: taskCount,
      originalSubmissionCount: submissionCount
    });

  } catch (error) {
    console.error('Error clearing tasks:', error);
    return NextResponse.json({ 
      error: 'Failed to clear tasks',
      details: error.message 
    }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDatabase();
    
    // Get current task count
    const taskCount = await db.collection('tasks').countDocuments({});
    const submissionCount = await db.collection('tasksubmissions').countDocuments({});
    
    // Get sample of existing tasks
    const sampleTasks = await db.collection('tasks').find({}).limit(10).toArray();
    
    return NextResponse.json({
      success: true,
      currentTaskCount: taskCount,
      currentSubmissionCount: submissionCount,
      sampleTasks: sampleTasks.map(task => ({
        id: task._id,
        title: task.title,
        assignmentType: task.assignmentType,
        cohortId: task.cohortId,
        createdAt: task.createdAt,
        isActive: task.isActive
      }))
    });

  } catch (error) {
    console.error('Error checking tasks:', error);
    return NextResponse.json({ 
      error: 'Failed to check tasks',
      details: error.message 
    }, { status: 500 });
  }
}