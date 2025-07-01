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
    const { hours, description } = data;

    if (!hours || hours <= 0) {
      return NextResponse.json({ error: 'Hours must be greater than 0' }, { status: 400 });
    }

    await connectToDatabase();

    // Find the task
    const task = await Task.findOne({ _id: id, isActive: true });
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    
    // For debugging purposes, log the task details
    console.log('Task details:', {
      id: task._id.toString(),
      title: task.title,
      assignmentType: task.assignmentType,
      assignedTo: task.assignedTo?.toString(),
      assigneeId: task.assigneeId?.toString(),
      cohortId: task.cohortId?.toString(),
      status: task.status,
      actualHours: task.actualHours
    });
    
    // For debugging purposes, log the user details from the session
    console.log('Session user details:', {
      id: session.user.id,
      name: session.user.name,
      gitlabUsername: session.user.gitlabUsername,
      role: session.user.role,
      cohortId: session.user.cohortId
    });

    // Create time tracking entry
    const timeEntry = {
      hours,
      description: description || `Time logged by ${session.user.name || session.user.email}`,
      date: new Date(),
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
      message: 'Time logged successfully',
      timeTracking: task.timeTracking,
      actualHours: task.actualHours
    });

  } catch (error) {
    console.error('Error logging time:', error);
    return NextResponse.json({ 
      error: 'Failed to log time',
      details: error.message
    }, { status: 500 });
  }
}