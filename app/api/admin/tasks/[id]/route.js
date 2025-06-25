import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../../utils/database';
import Task from '../../../../../models/Task';
import mongoose from 'mongoose';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
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
    .populate('cohortId', 'name')
    .populate('createdBy', 'name gitlabUsername');

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true,
      task 
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
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 });
    }

    const data = await request.json();
    const { 
      title, 
      description, 
      type, 
      priority, 
      category, 
      cohortId, 
      dueDate, 
      startDate,
      estimatedHours,
      requirements,
      resources,
      status
    } = data;

    if (!title || !description || !category || !cohortId || !dueDate) {
      return NextResponse.json({ 
        error: 'Title, description, category, cohort, and due date are required' 
      }, { status: 400 });
    }

    await connectToDatabase();

    const updateData = {
      title,
      description,
      type: type || 'assignment',
      priority: priority || 'medium',
      category,
      cohortId,
      dueDate: new Date(dueDate),
      startDate: startDate ? new Date(startDate) : new Date(),
      estimatedHours: estimatedHours || 0,
      resources: resources || [],
      requirements: requirements || [],
      updatedAt: new Date()
    };

    if (status) {
      updateData.status = status;
    }

    const result = await Task.updateOne(
      { _id: id, isActive: true },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
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
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 });
    }

    await connectToDatabase();

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