import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../utils/database';
import Task from '../../../../models/Task';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const cohortId = searchParams.get('cohortId');
    const status = searchParams.get('status');

    let query = { isActive: true };
    
    if (cohortId && cohortId !== 'all') {
      query.cohortId = cohortId;
    }
    
    if (status && status !== 'all') {
      query.status = status;
    }

    const tasks = await Task.find(query)
      .populate('cohortId', 'name')
      .populate('createdBy', 'name gitlabUsername')
      .sort({ createdAt: -1 });

    return NextResponse.json({ 
      success: true,
      tasks 
    });

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
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
      createdBy,
      createdByRole,
      assignedBy
    } = data;

    if (!title || !description || !category || !cohortId || !dueDate) {
      return NextResponse.json({ 
        error: 'Title, description, category, cohort, and due date are required' 
      }, { status: 400 });
    }

    await connectToDatabase();

    const taskData = {
      title,
      description,
      type: type || 'assignment',
      status: 'active',
      priority: priority || 'medium',
      category,
      assignmentType: 'cohort',
      cohortId,
      createdBy: createdBy || session.user.id,
      createdByRole: createdByRole || session.user.role,
      assignedBy: assignedBy || session.user.gitlabUsername,
      dueDate: new Date(dueDate),
      startDate: startDate ? new Date(startDate) : new Date(),
      estimatedHours: estimatedHours || 0,
      actualHours: 0,
      progress: 0,
      tags: [],
      dependencies: [],
      attachments: [],
      resources: resources || [],
      requirements: requirements || [],
      submissions: [],
      comments: [],
      isActive: true
    };

    const newTask = new Task(taskData);
    await newTask.save();

    return NextResponse.json({ 
      success: true,
      taskId: newTask._id,
      message: 'Task created successfully'
    });

  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ 
      error: 'Failed to create task' 
    }, { status: 500 });
  }
}