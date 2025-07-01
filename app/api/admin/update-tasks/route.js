import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../utils/database';
import Task from '../../../../models/Task';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Find all tasks without points or with points set to 0
    const tasksToUpdate = await Task.find({
      $or: [
        { points: { $exists: false } },
        { points: null },
        { points: 0 }
      ]
    });

    console.log(`Found ${tasksToUpdate.length} tasks to update`);

    // Update tasks with default points
    let updatedCount = 0;
    for (const task of tasksToUpdate) {
      // Set default points based on status
      let defaultPoints = 10;
      
      // Completed tasks get more points
      if (task.status === 'completed' || task.status === 'done' || task.status === 'approved') {
        defaultPoints = 20;
      }
      
      // Update the task
      task.points = defaultPoints;
      
      // Update progress based on status if not set
      if (task.progress === undefined || task.progress === null || task.progress === 0) {
        if (task.status === 'completed' || task.status === 'done' || task.status === 'approved') {
          task.progress = 100;
        } else if (task.status === 'in_progress' || task.status === 'active') {
          task.progress = 50;
        } else if (task.status === 'review') {
          task.progress = 90;
        } else {
          task.progress = 0;
        }
      }
      
      await task.save();
      updatedCount++;
      console.log(`Updated task: ${task.title} - Points: ${task.points}, Progress: ${task.progress}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Task points update completed successfully',
      updatedCount,
      totalTasks: tasksToUpdate.length
    });

  } catch (error) {
    console.error('Error updating task points:', error);
    return NextResponse.json({ 
      error: 'Failed to update task points',
      details: error.message
    }, { status: 500 });
  }
}