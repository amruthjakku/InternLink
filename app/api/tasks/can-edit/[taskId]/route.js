import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../../utils/database';
import Task from '../../../../../models/Task';
import User from '../../../../../models/User';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taskId } = params;

    if (!taskId) {
      return NextResponse.json({ 
        error: 'Task ID is required' 
      }, { status: 400 });
    }

    await connectToDatabase();

    // Get the task
    const task = await Task.findById(taskId);
    if (!task) {
      return NextResponse.json({ 
        error: 'Task not found' 
      }, { status: 404 });
    }

    // Get the current user
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 });
    }

    // Check if user can edit the task
    const canEdit = task.canBeEditedBy(user);

    return NextResponse.json({ 
      canEdit,
      taskId,
      createdByRole: task.createdByRole,
      userRole: user.role
    });

  } catch (error) {
    console.error('Error checking task edit permissions:', error);
    return NextResponse.json({ 
      error: 'Failed to check task edit permissions' 
    }, { status: 500 });
  }
}