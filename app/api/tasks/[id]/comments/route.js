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
    const { text } = data;

    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Comment text is required' }, { status: 400 });
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
      status: task.status
    });
    
    // For debugging purposes, log the user details from the session
    console.log('Session user details:', {
      id: session.user.id,
      name: session.user.name,
      gitlabUsername: session.user.gitlabUsername,
      role: session.user.role,
      cohortId: session.user.cohortId
    });

    // Create comment
    const comment = {
      _id: new mongoose.Types.ObjectId(),
      author: session.user.name || session.user.gitlabUsername || session.user.email,
      text: text.trim(),
      timestamp: new Date(),
      userId: session.user.id,
      userRole: session.user.role
    };

    // Add comment to task
    task.comments = task.comments || [];
    task.comments.push(comment);
    
    await task.save();

    return NextResponse.json({ 
      success: true,
      message: 'Comment added successfully',
      comment
    });

  } catch (error) {
    console.error('Error adding comment:', error);
    console.error('Error stack:', error.stack);
    
    return NextResponse.json({ 
      error: 'Failed to add comment',
      details: error.message
    }, { status: 500 });
  }
}