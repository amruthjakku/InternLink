import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../../../utils/database';
import Task from '../../../../../../models/Task';
import TaskProgress from '../../../../../../models/TaskProgress';
import mongoose from 'mongoose';

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, subtaskId } = params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 });
    }

    const data = await request.json();
    const { completed } = data;

    if (completed === undefined) {
      return NextResponse.json({ error: 'Completed status is required' }, { status: 400 });
    }

    await connectToDatabase();

    // Find the task
    const task = await Task.findById(id);
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Find the subtask
    if (!task.subtasks || task.subtasks.length === 0) {
      return NextResponse.json({ error: 'Task has no subtasks' }, { status: 404 });
    }
    
    console.log('Looking for subtask with ID:', subtaskId);
    console.log('Task subtasks:', JSON.stringify(task.subtasks, null, 2));
    
    // Try all possible ID formats
    let subtaskIndex = -1;
    
    // Try to find by MongoDB _id
    if (mongoose.Types.ObjectId.isValid(subtaskId)) {
      subtaskIndex = task.subtasks.findIndex(
        subtask => subtask._id && subtask._id.toString() === subtaskId
      );
    }
    
    // If not found, try to find by id property
    if (subtaskIndex === -1) {
      subtaskIndex = task.subtasks.findIndex(
        subtask => subtask.id && subtask.id.toString() === subtaskId
      );
    }
    
    // If still not found, try to find by index (for simple arrays)
    if (subtaskIndex === -1 && !isNaN(parseInt(subtaskId))) {
      const index = parseInt(subtaskId);
      if (index >= 0 && index < task.subtasks.length) {
        subtaskIndex = index;
      }
    }
    
    console.log('Subtask index found:', subtaskIndex);

    if (subtaskIndex === -1) {
      return NextResponse.json({ error: 'Subtask not found' }, { status: 404 });
    }

    // Get the subtask details
    const subtask = task.subtasks[subtaskIndex];
    if (!subtask) {
      console.error('Subtask at index not found:', subtaskIndex);
      return NextResponse.json({ error: 'Subtask reference not found' }, { status: 404 });
    }

    console.log('Updating subtask at index:', subtaskIndex);
    console.log('Current subtask state:', JSON.stringify(subtask, null, 2));

    // Find or create individual TaskProgress record
    let taskProgress = await TaskProgress.findOne({
      taskId: task._id,
      internId: session.user.id
    });

    if (!taskProgress) {
      // Create new progress record
      taskProgress = new TaskProgress({
        taskId: task._id,
        internId: session.user.id,
        status: 'not_started',
        progress: 0,
        subtaskProgress: []
      });
    }

    // Update subtask progress in the individual record
    let subtaskProgressIndex = taskProgress.subtaskProgress.findIndex(
      sp => sp.subtaskId.toString() === subtask._id.toString()
    );

    if (subtaskProgressIndex === -1) {
      // Add new subtask progress
      taskProgress.subtaskProgress.push({
        subtaskId: subtask._id,
        completed: completed,
        completedAt: completed ? new Date() : null,
        actualHours: 0
      });
    } else {
      // Update existing subtask progress
      taskProgress.subtaskProgress[subtaskProgressIndex].completed = completed;
      taskProgress.subtaskProgress[subtaskProgressIndex].completedAt = completed ? new Date() : null;
    }

    // Calculate overall task progress based on individual subtask progress
    try {
      if (task.subtasks.length > 0) {
        const completedSubtasks = taskProgress.subtaskProgress.filter(sp => sp.completed).length;
        taskProgress.progress = Math.round((completedSubtasks / task.subtasks.length) * 100);
        
        console.log(`Individual task progress: ${completedSubtasks}/${task.subtasks.length} = ${taskProgress.progress}%`);
        
        // Update status based on progress
        if (completedSubtasks === task.subtasks.length) {
          taskProgress.status = 'completed';
          if (!taskProgress.completedAt) {
            taskProgress.completedAt = new Date();
          }
          if (taskProgress.pointsEarned === 0) {
            taskProgress.pointsEarned = task.points || 10;
          }
          console.log('All subtasks completed, marking individual progress as completed');
        } else if (completedSubtasks > 0) {
          if (taskProgress.status === 'not_started') {
            taskProgress.status = 'in_progress';
            if (!taskProgress.startedAt) {
              taskProgress.startedAt = new Date();
            }
          }
          console.log('Some subtasks completed, marking individual progress as in_progress');
        }
      }
    } catch (err) {
      console.error('Error calculating individual task progress:', err);
    }

    // Save the individual progress record
    try {
      console.log('Saving individual task progress');
      await taskProgress.save();
      console.log('Individual progress saved successfully');
    } catch (err) {
      console.error('Error saving individual task progress:', err);
      console.error('Error stack:', err.stack);
      return NextResponse.json({ 
        error: 'Failed to save individual task progress',
        details: err.message
      }, { status: 500 });
    }

    // Get the updated subtask progress for response
    const updatedSubtaskProgress = taskProgress.subtaskProgress.find(
      sp => sp.subtaskId.toString() === subtask._id.toString()
    );

    // Prepare response with individual progress information
    const response = {
      success: true,
      subtask: {
        id: subtask._id,
        title: subtask.title,
        description: subtask.description,
        completed: updatedSubtaskProgress ? updatedSubtaskProgress.completed : completed,
        completedAt: updatedSubtaskProgress ? updatedSubtaskProgress.completedAt : null,
        actualHours: updatedSubtaskProgress ? updatedSubtaskProgress.actualHours : 0
      },
      individualProgress: {
        taskId: taskProgress.taskId,
        status: taskProgress.status,
        progress: taskProgress.progress,
        pointsEarned: taskProgress.pointsEarned,
        completedAt: taskProgress.completedAt
      },
      taskId: task._id,
      message: `Subtask ${completed ? 'completed' : 'marked as incomplete'} successfully`
    };
    
    console.log('Sending successful response:', JSON.stringify(response, null, 2));
    return NextResponse.json(response);

  } catch (error) {
    console.error('Error updating subtask:', error);
    console.error('Error stack:', error.stack);
    
    // Provide more detailed error information
    let statusCode = 500;
    let errorMessage = 'Failed to update subtask';
    
    if (error.name === 'ValidationError') {
      statusCode = 400;
      errorMessage = 'Invalid data provided for subtask update';
    } else if (error.name === 'CastError') {
      statusCode = 400;
      errorMessage = 'Invalid ID format';
    } else if (error.message.includes('not found')) {
      statusCode = 404;
      errorMessage = 'Resource not found';
    }
    
    return NextResponse.json({ 
      error: errorMessage,
      details: error.message,
      path: `/api/tasks/${id}/subtasks/${subtaskId}`
    }, { status: statusCode });
  }
}