import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { connectToDatabase, createTask, getTasksByUser } from '../../../utils/database';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    await connectToDatabase();

    let tasks = [];
    if (userId) {
      tasks = await getTasksByUser(userId);
    } else if (session.user.role === 'intern') {
      tasks = await getTasksByUser(session.user.id);
    } else {
      // For mentors/admins, get all tasks they created or are assigned to
      // This would need a more complex query in a real implementation
      tasks = [];
    }

    return NextResponse.json({ tasks });

  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch tasks' 
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user.role !== 'mentor' && session.user.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, description, categoryId, assignedTo, dueDate, priority, difficulty } = await request.json();

    if (!title || !assignedTo) {
      return NextResponse.json({ error: 'Title and assignedTo are required' }, { status: 400 });
    }

    await connectToDatabase();

    const taskData = {
      title,
      description: description || '',
      categoryId,
      assignedTo: Array.isArray(assignedTo) ? assignedTo : [assignedTo],
      createdBy: session.user.id,
      dueDate: dueDate ? new Date(dueDate) : null,
      priority: priority || 'medium',
      difficulty: difficulty || 'intermediate'
    };

    const taskId = await createTask(taskData);

    return NextResponse.json({ 
      success: true, 
      taskId,
      message: 'Task created successfully' 
    });

  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ 
      error: 'Failed to create task' 
    }, { status: 500 });
  }
}