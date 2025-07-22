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
      tags: task.tags || [],
      dependencies: task.dependencies || [],
      attachments: task.attachments || [],
      resources: task.resources || [],
      requirements: task.requirements || [],
      comments: task.comments || [],
      timeTracking: task.timeTracking || [],
      subtasks: task.subtasks?.map(subtask => ({
        id: subtask._id,
        title: subtask.title,
        description: subtask.description,
        completed: subtask.completed,
        completedAt: subtask.completedAt,
        priority: subtask.priority,
        estimatedHours: subtask.estimatedHours,
        actualHours: subtask.actualHours,
        createdAt: subtask.createdAt,
        updatedAt: subtask.updatedAt
      })) || [],
      weekNumber: task.weekNumber,
      points: task.points || 0
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
      (session.user.role === 'Tech Lead' && task.assignedBy === session.user.gitlabUsername);

    if (!canEdit) {
      return NextResponse.json({ error: 'You do not have permission to edit this task' }, { status: 403 });
    }

    // Update the task
    const updateData = { ...data, updatedAt: new Date() };
    
    // Ensure points is set to a default value if not provided
    if (!updateData.hasOwnProperty('points')) {
      updateData.points = task.points || 10;
    }
    
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

export async function PATCH(request, { params }) {
  try {
    console.log('PATCH request to update task status');
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 });
    }

    const data = await request.json();
    console.log('Update data:', data);
    
    await connectToDatabase();

    // Find the task
    const task = await Task.findById(id);
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Check if the user is authorized to update this task
    // AI Developer Interns can only update tasks assigned to them
    const isAssignedAI Developer Intern = 
      session.user.role === 'AI Developer Intern' && 
      task.assignedTo && 
      task.assignedTo.toString() === session.user.id;
    
    // Tech Leads and admins can update any task
    const isTech LeadOrAdmin = ['Tech Lead', 'admin'].includes(session.user.role);
    
    if (!isAssignedAI Developer Intern && !isTech LeadOrAdmin) {
      return NextResponse.json({ 
        error: 'You do not have permission to update this task' 
      }, { status: 403 });
    }

    // Prepare update data
    const updateData = { ...data, updatedAt: new Date() };
    
    // If status is being updated to a completed state, set progress to 100%
    if (data.status && ['completed', 'done', 'approved'].includes(data.status) && 
        !['completed', 'done', 'approved'].includes(task.status)) {
      console.log('Setting progress to 100% as task is marked completed');
      updateData.progress = 100;
      updateData.completedAt = new Date();
    }
    
    // If status is being changed from completed to something else, adjust progress
    if (['completed', 'done', 'approved'].includes(task.status) && 
        data.status && !['completed', 'done', 'approved'].includes(data.status)) {
      // Only adjust progress if it's not explicitly provided
      if (!data.hasOwnProperty('progress')) {
        if (data.status === 'review') {
          updateData.progress = 90;
        } else if (['in_progress', 'active'].includes(data.status)) {
          updateData.progress = 50;
        } else {
          updateData.progress = 0;
        }
      }
      updateData.completedAt = null;
    }
    
    // If status is being set to 'review', set progress to at least 90%
    if (data.status === 'review' && task.status !== 'review' && !data.hasOwnProperty('progress')) {
      updateData.progress = Math.max(90, task.progress || 0);
    }
    
    // If status is being set to 'in_progress', set a default progress
    if (['in_progress', 'active'].includes(data.status) && 
        !['in_progress', 'active'].includes(task.status) && 
        task.progress < 25 && !data.hasOwnProperty('progress')) {
      updateData.progress = 25; // Default progress for in_progress status
    }
    
    // Ensure points is set
    if (!updateData.hasOwnProperty('points') && (!task.points || task.points === 0)) {
      updateData.points = 10;
    }

    console.log('Final update data:', updateData);

    // Update the task
    const result = await Task.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true } // Return the updated document
    );

    return NextResponse.json({ 
      success: true,
      message: 'Task updated successfully',
      task: {
        id: result._id,
        title: result.title,
        status: result.status,
        progress: result.progress,
        points: result.points,
        updatedAt: result.updatedAt
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