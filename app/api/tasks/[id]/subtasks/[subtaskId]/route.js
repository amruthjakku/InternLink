import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../../../utils/database';
import Task from '../../../../../../models/Task';
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

    // Update the subtask
    try {
      // Make sure we're working with a valid subtask
      if (!task.subtasks[subtaskIndex]) {
        console.error('Subtask at index not found:', subtaskIndex);
        return NextResponse.json({ error: 'Subtask reference not found' }, { status: 404 });
      }
      
      console.log('Updating subtask at index:', subtaskIndex);
      console.log('Current subtask state:', JSON.stringify(task.subtasks[subtaskIndex], null, 2));
      
      // Update the subtask properties
      task.subtasks[subtaskIndex].completed = completed;
      task.subtasks[subtaskIndex].updatedAt = new Date();
      
      if (completed) {
        task.subtasks[subtaskIndex].completedAt = new Date();
        task.subtasks[subtaskIndex].completedBy = session.user.id;
      } else {
        task.subtasks[subtaskIndex].completedAt = null;
        task.subtasks[subtaskIndex].completedBy = null;
      }
      
      console.log('Updated subtask state:', JSON.stringify(task.subtasks[subtaskIndex], null, 2));
    } catch (err) {
      console.error('Error updating subtask properties:', err);
      return NextResponse.json({ 
        error: 'Failed to update subtask properties',
        details: err.message
      }, { status: 500 });
    }

    // Calculate overall task progress based on subtasks
    try {
      if (task.subtasks.length > 0) {
        const completedSubtasks = task.subtasks.filter(subtask => subtask.completed).length;
        task.progress = Math.round((completedSubtasks / task.subtasks.length) * 100);
        
        console.log(`Task progress: ${completedSubtasks}/${task.subtasks.length} = ${task.progress}%`);
        
        // If all subtasks are completed, mark the task as completed
        if (completedSubtasks === task.subtasks.length) {
          task.status = 'completed';
          console.log('All subtasks completed, marking task as completed');
        } else if (task.status === 'completed') {
          // If not all subtasks are completed but task was marked as completed, revert to in_progress
          task.status = 'in_progress';
          console.log('Not all subtasks completed, reverting task to in_progress');
        }
      }
    } catch (err) {
      console.error('Error calculating task progress:', err);
      // Continue with saving even if progress calculation fails
    }

    // Save the task with updated subtask and progress
    try {
      console.log('Saving task with updated subtask');
      
      // Use updateOne instead of save to avoid validation issues
      const result = await Task.updateOne(
        { _id: id },
        { 
          $set: {
            [`subtasks.${subtaskIndex}.completed`]: completed,
            [`subtasks.${subtaskIndex}.updatedAt`]: new Date(),
            [`subtasks.${subtaskIndex}.completedAt`]: completed ? new Date() : null,
            [`subtasks.${subtaskIndex}.completedBy`]: completed ? session.user.id : null,
            progress: task.progress,
            status: task.status
          }
        }
      );
      
      console.log('Task update result:', result);
      
      if (result.modifiedCount === 0) {
        console.error('Task was not modified');
        return NextResponse.json({ 
          error: 'Failed to update subtask - no changes were made',
          details: 'The database operation completed but no documents were modified'
        }, { status: 500 });
      }
      
      console.log('Task updated successfully using direct update');
    } catch (err) {
      console.error('Error saving task:', err);
      console.error('Error stack:', err.stack);
      return NextResponse.json({ 
        error: 'Failed to save task with updated subtask',
        details: err.message
      }, { status: 500 });
    }

    // Prepare response with detailed information
    const response = {
      success: true,
      subtask: task.subtasks[subtaskIndex],
      taskProgress: task.progress,
      taskStatus: task.status,
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