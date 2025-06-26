import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../../utils/database';
import Task from '../../../../../models/Task';
import mongoose from 'mongoose';

export async function POST(request, { params }) {
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
    const { hours, description, date } = data;

    if (!hours || hours <= 0) {
      return NextResponse.json({ error: 'Hours must be greater than 0' }, { status: 400 });
    }

    await connectToDatabase();

    // Find the task
    const task = await Task.findOne({ _id: id, isActive: true });
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Create time tracking entry
    const timeEntry = {
      hours,
      description: description || '',
      date: date ? new Date(date) : new Date(),
      recordedBy: session.user.id
    };

    // Add time entry to task
    task.timeTracking = task.timeTracking || [];
    task.timeTracking.push(timeEntry);
    
    // Update actual hours
    task.actualHours = (task.actualHours || 0) + hours;
    
    await task.save();

    return NextResponse.json({ 
      success: true,
      message: 'Time tracking entry added successfully',
      timeTracking: task.timeTracking,
      actualHours: task.actualHours
    });

  } catch (error) {
    console.error('Error adding time tracking:', error);
    return NextResponse.json({ 
      error: 'Failed to add time tracking entry' 
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
    const { searchParams } = new URL(request.url);
    const entryId = searchParams.get('entryId');
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 });
    }

    if (!entryId) {
      return NextResponse.json({ error: 'Entry ID is required' }, { status: 400 });
    }

    await connectToDatabase();

    // Find the task
    const task = await Task.findOne({ _id: id, isActive: true });
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Find the time entry
    if (!task.timeTracking || task.timeTracking.length === 0) {
      return NextResponse.json({ error: 'No time tracking entries found' }, { status: 404 });
    }

    const entryIndex = task.timeTracking.findIndex(entry => entry._id.toString() === entryId);
    if (entryIndex === -1) {
      return NextResponse.json({ error: 'Time tracking entry not found' }, { status: 404 });
    }

    // Check if user can delete this entry
    const entry = task.timeTracking[entryIndex];
    const canDelete = 
      session.user.role === 'admin' || 
      (entry.recordedBy && entry.recordedBy.toString() === session.user.id);

    if (!canDelete) {
      return NextResponse.json({ error: 'You do not have permission to delete this entry' }, { status: 403 });
    }

    // Update actual hours
    task.actualHours = Math.max(0, (task.actualHours || 0) - entry.hours);
    
    // Remove the entry
    task.timeTracking.splice(entryIndex, 1);
    
    await task.save();

    return NextResponse.json({ 
      success: true,
      message: 'Time tracking entry deleted successfully',
      timeTracking: task.timeTracking,
      actualHours: task.actualHours
    });

  } catch (error) {
    console.error('Error deleting time tracking entry:', error);
    return NextResponse.json({ 
      error: 'Failed to delete time tracking entry' 
    }, { status: 500 });
  }
}