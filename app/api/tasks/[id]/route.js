import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../utils/database';
import Task from '../../../../models/Task';
import mongoose from 'mongoose';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 });
    }

    await connectToDatabase();
    
    const task = await Task.findOne({ 
      _id: id,
      isActive: true 
    })
    .populate('assignedTo', 'name email gitlabUsername')
    .populate('createdBy', 'name gitlabUsername')
    .populate('cohortId', 'name startDate endDate');

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Format task for frontend
    const formattedTask = {
      id: task._id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      category: task.category,
      assignmentType: task.assignmentType,
      createdBy: task.createdBy?.name,
      createdByUsername: task.createdBy?.gitlabUsername,
      dueDate: task.dueDate,
      startDate: task.startDate,
      createdDate: task.createdAt,
      estimatedHours: task.estimatedHours,
      actualHours: task.actualHours,
      progress: task.progress,
      tags: task.tags,
      dependencies: task.dependencies,
      attachments: task.attachments,
      resources: task.resources,
      requirements: task.requirements,
      comments: task.comments,
      timeTracking: task.timeTracking || []
    };

    // Add assignment-specific details
    if (task.assignmentType === 'individual' && task.assignedTo) {
      formattedTask.assigneeId = task.assignedTo._id;
      formattedTask.assigneeName = task.assignedTo.name;
      formattedTask.assigneeEmail = task.assignedTo.email;
      formattedTask.assigneeUsername = task.assignedTo.gitlabUsername;
    } else if (task.assignmentType === 'cohort') {
      formattedTask.cohortId = task.cohortId?._id;
      formattedTask.cohortName = task.cohortId?.name;
      formattedTask.cohortStartDate = task.cohortId?.startDate;
      formattedTask.cohortEndDate = task.cohortId?.endDate;
    }

    return NextResponse.json({ 
      success: true,
      task: formattedTask
    });

  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch task' 
    }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 });
    }

    const data = await request.json();
    
    await connectToDatabase();

    // Check if user can edit this task
    const task = await Task.findById(id);
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Only allow updates by admin, task creator, or assigned mentor
    const canEdit = 
      session.user.role === 'admin' || 
      task.createdBy.toString() === session.user.id ||
      (session.user.role === 'mentor' && task.assignedBy === session.user.gitlabUsername);

    if (!canEdit) {
      return NextResponse.json({ error: 'You do not have permission to edit this task' }, { status: 403 });
    }

    // Update the task
    const updateData = { ...data, updatedAt: new Date() };
    
    // Handle cohort assignment
    if (updateData.assignmentType === 'cohort' && updateData.cohortId) {
      // Clear individual assignment fields
      updateData.assignedTo = null;
      updateData.assigneeName = null;
      updateData.assigneeId = null;
    }
    
    // Handle individual assignment
    if (updateData.assignmentType === 'individual' && updateData.assignedTo) {
      // Clear cohort assignment fields
      updateData.cohortId = null;
      updateData.cohortName = null;
    }

    const result = await Task.updateOne(
      { _id: id, isActive: true },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Task not found or already deleted' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Task updated successfully'
    });

  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ 
      error: 'Failed to update task' 
    }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 });
    }

    await connectToDatabase();

    // Check if user can delete this task
    const task = await Task.findById(id);
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Only allow deletion by admin or task creator
    const canDelete = 
      session.user.role === 'admin' || 
      task.createdBy.toString() === session.user.id;

    if (!canDelete) {
      return NextResponse.json({ error: 'You do not have permission to delete this task' }, { status: 403 });
    }

    // Soft delete the task
    const result = await Task.updateOne(
      { _id: id },
      { 
        $set: { 
          isActive: false,
          deletedAt: new Date(),
          deletedBy: session.user.gitlabUsername
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Task deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ 
      error: 'Failed to delete task' 
    }, { status: 500 });
  }
}