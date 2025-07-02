import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase, getDatabase } from '../../../../utils/database';
import { ObjectId } from 'mongodb';
import User from '../../../../models/User';

/**
 * Secure Task Update API - Users can only update their own assigned tasks
 * This prevents unauthorized modification of other users' progress
 */

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taskId, status, progress, notes } = await request.json();

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    await connectToDatabase();
    const db = await getDatabase();

    // Get current user
    const currentUser = await User.findById(session.user.id);
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = currentUser._id.toString();

    // SECURITY CHECK: Verify the task belongs to the current user
    const task = await db.collection('tasks').findOne({
      _id: new ObjectId(taskId),
      $or: [
        { assignedTo: userId },
        { assignedTo: currentUser._id }
      ]
    });

    if (!task) {
      console.log(`Unauthorized task update attempt by user ${userId} for task ${taskId}`);
      return NextResponse.json({ 
        error: 'Task not found or you are not authorized to update this task',
        details: 'You can only update tasks assigned to you'
      }, { status: 403 });
    }

    // Validate progress value
    let validatedProgress = task.progress || 0;
    if (progress !== undefined) {
      validatedProgress = Math.max(0, Math.min(100, Number(progress)));
    }

    // Build update data
    const updateData = {
      updatedAt: new Date(),
      lastModifiedBy: userId
    };

    if (status) {
      // Validate status values
      const validStatuses = ['not_started', 'in_progress', 'review', 'completed', 'done'];
      if (validStatuses.includes(status)) {
        updateData.status = status;
        
        // Auto-update progress based on status
        if (status === 'completed' || status === 'done') {
          updateData.progress = 100;
        } else if (status === 'review' && validatedProgress < 90) {
          updateData.progress = 90;
        } else if (status === 'in_progress' && validatedProgress === 0) {
          updateData.progress = 10;
        }
      }
    }

    if (progress !== undefined) {
      updateData.progress = validatedProgress;
    }

    if (notes) {
      updateData.notes = notes;
    }

    // Add user activity log
    updateData.userActivity = {
      userId: userId,
      userName: currentUser.name,
      action: 'progress_update',
      timestamp: new Date(),
      changes: { status, progress, notes }
    };

    // Update the task
    const result = await db.collection('tasks').updateOne(
      { _id: new ObjectId(taskId) },
      { 
        $set: updateData,
        $push: {
          activityLog: updateData.userActivity
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Log the successful update
    console.log(`Task ${taskId} updated by user ${userId}:`, updateData);

    // Calculate points earned if task was completed
    let pointsEarned = 0;
    if (updateData.status === 'completed' || updateData.status === 'done') {
      pointsEarned = task.points || 10;
    }

    return NextResponse.json({
      success: true,
      message: 'Task updated successfully',
      data: {
        taskId: taskId,
        updates: updateData,
        pointsEarned: pointsEarned
      }
    });

  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({
      error: 'Failed to update task',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * Get task details - Users can only view their own assigned tasks
 */
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    await connectToDatabase();
    const db = await getDatabase();

    // Get current user
    const currentUser = await User.findById(session.user.id);
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = currentUser._id.toString();

    // SECURITY CHECK: Verify the task belongs to the current user
    const task = await db.collection('tasks').findOne({
      _id: new ObjectId(taskId),
      $or: [
        { assignedTo: userId },
        { assignedTo: currentUser._id }
      ]
    });

    if (!task) {
      return NextResponse.json({ 
        error: 'Task not found or you are not authorized to view this task'
      }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: task._id,
        title: task.title,
        description: task.description,
        status: task.status,
        progress: task.progress || 0,
        points: task.points || 10,
        dueDate: task.dueDate,
        assignedTo: task.assignedTo,
        notes: task.notes,
        activityLog: task.activityLog || [],
        createdAt: task.createdAt,
        updatedAt: task.updatedAt
      }
    });

  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json({
      error: 'Failed to fetch task',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * Delete task progress - Users can only reset progress on their own tasks
 */
export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    await connectToDatabase();
    const db = await getDatabase();

    // Get current user
    const currentUser = await User.findById(session.user.id);
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = currentUser._id.toString();

    // SECURITY CHECK: Verify the task belongs to the current user
    const task = await db.collection('tasks').findOne({
      _id: new ObjectId(taskId),
      $or: [
        { assignedTo: userId },
        { assignedTo: currentUser._id }
      ]
    });

    if (!task) {
      console.log(`Unauthorized task progress delete attempt by user ${userId} for task ${taskId}`);
      return NextResponse.json({ 
        error: 'Task not found or you are not authorized to reset progress on this task',
        details: 'You can only reset progress on tasks assigned to you'
      }, { status: 403 });
    }

    // Reset progress data
    const resetData = {
      status: 'not_started',
      progress: 0,
      notes: null,
      updatedAt: new Date(),
      lastModifiedBy: userId,
      progressResetAt: new Date()
    };

    // Add user activity log
    const activityLog = {
      userId: userId,
      userName: currentUser.name,
      action: 'progress_reset',
      timestamp: new Date(),
      previousStatus: task.status,
      previousProgress: task.progress || 0
    };

    // Update the task
    const result = await db.collection('tasks').updateOne(
      { _id: new ObjectId(taskId) },
      { 
        $set: resetData,
        $push: {
          activityLog: activityLog
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Log the successful reset
    console.log(`Task progress reset for task ${taskId} by user ${userId}`);

    return NextResponse.json({
      success: true,
      message: 'Task progress reset successfully',
      data: {
        taskId: taskId,
        resetData: resetData,
        previousStatus: task.status,
        previousProgress: task.progress || 0
      }
    });

  } catch (error) {
    console.error('Error resetting task progress:', error);
    return NextResponse.json({
      error: 'Failed to reset task progress',
      details: error.message
    }, { status: 500 });
  }
}