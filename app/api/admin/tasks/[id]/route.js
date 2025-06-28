import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { connectToDatabase, getDatabase } from '../../../../../utils/database';
import Task from '../../../../../models/Task';
import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';

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
      assignedTo,
      assignmentType = 'cohort',
      dueDate, 
      startDate,
      estimatedHours,
      weekNumber,
      points,
      subtasks,
      requirements,
      resources,
      status
    } = data;

    if (!title || !description || !category || !dueDate) {
      return NextResponse.json({ 
        error: 'Title, description, category, and due date are required' 
      }, { status: 400 });
    }
    
    // Validate based on assignment type
    if (assignmentType === 'cohort' && !cohortId) {
      return NextResponse.json({ 
        error: 'Cohort tasks require a cohort ID' 
      }, { status: 400 });
    }
    
    if (assignmentType === 'individual' && !assignedTo) {
      return NextResponse.json({ 
        error: 'Individual tasks require an assignee' 
      }, { status: 400 });
    }

    await connectToDatabase();

    const updateData = {
      title,
      description,
      type: type || 'assignment',
      priority: priority || 'medium',
      category,
      assignmentType,
      dueDate: new Date(dueDate),
      startDate: startDate ? new Date(startDate) : new Date(),
      estimatedHours: estimatedHours || 0,
      weekNumber: weekNumber || null,
      points: points || 0,
      subtasks: subtasks || [],
      resources: resources || [],
      requirements: requirements || [],
      updatedAt: new Date()
    };

    // Add assignment-specific fields
    if (assignmentType === 'cohort') {
      console.log(`Setting cohort ID: ${cohortId} for task ${id}`);
      
      // Validate cohort ID
      if (!cohortId) {
        console.error('Missing cohort ID for cohort assignment');
        return NextResponse.json({ 
          error: 'Cohort ID is required for cohort assignment' 
        }, { status: 400 });
      }
      
      // Convert to ObjectId if it's a string
      if (typeof cohortId === 'string') {
        try {
          // Validate that it's a valid ObjectId
          if (!mongoose.Types.ObjectId.isValid(cohortId)) {
            console.error(`Invalid cohort ID format: ${cohortId}`);
            return NextResponse.json({ 
              error: 'Invalid cohort ID format' 
            }, { status: 400 });
          }
          
          // Set the cohort ID
          updateData.cohortId = new mongoose.Types.ObjectId(cohortId);
        } catch (error) {
          console.error(`Error converting cohort ID: ${error.message}`);
          return NextResponse.json({ 
            error: 'Invalid cohort ID' 
          }, { status: 400 });
        }
      } else {
        updateData.cohortId = cohortId;
      }
      
      // Get cohort name
      try {
        const db = await getDatabase();
        const cohort = await db.collection('cohorts').findOne({ _id: new ObjectId(cohortId) });
        if (cohort) {
          updateData.cohortName = cohort.name;
          console.log(`Found cohort name: ${cohort.name}`);
        } else {
          console.warn(`Cohort not found for ID: ${cohortId}`);
        }
      } catch (error) {
        console.error(`Error fetching cohort: ${error.message}`);
      }
      
      // Clear individual assignment fields
      updateData.assignedTo = null;
      updateData.assigneeName = null;
      updateData.assigneeId = null;
    } else if (assignmentType === 'individual') {
      console.log(`Setting individual assignment: ${assignedTo} for task ${id}`);
      updateData.assignedTo = assignedTo;
      
      // Clear cohort assignment fields
      updateData.cohortId = null;
      updateData.cohortName = null;
    }

    if (status) {
      updateData.status = status;
    }

    console.log(`Updating task ${id} with data:`, updateData);
    
    try {
      const result = await Task.updateOne(
        { _id: id, isActive: true },
        { $set: updateData }
      );
      
      console.log('Update result:', result);

      if (result.matchedCount === 0) {
        console.error(`Task ${id} not found or not active`);
        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      }
      
      if (result.modifiedCount === 0) {
        console.warn(`Task ${id} was found but no changes were made`);
      }

      // Get the updated task to return in the response
      const updatedTask = await Task.findById(id);
      
      return NextResponse.json({ 
        success: true,
        message: 'Task updated successfully',
        task: updatedTask
      });
    } catch (error) {
      console.error('Error in MongoDB update operation:', error);
      return NextResponse.json({ 
        error: 'Database error during update',
        details: error.message
      }, { status: 500 });
    }

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