import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../utils/database';
import Task from '../../../models/Task';
import User from '../../../models/User';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const assignedTo = searchParams.get('assignedTo');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const category = searchParams.get('category');

    // Build query based on user role and filters
    let query = {};
    
    // If user is intern, only show their tasks
    if (session.user.role === 'intern') {
      query.assignedTo = session.user.id;
    }
    
    // If user is mentor, show tasks they created or are assigned to their interns
    if (session.user.role === 'mentor') {
      if (assignedTo) {
        query.assignedTo = assignedTo;
      }
      // Could add logic to filter by mentor's interns
    }

    // Apply filters
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    // Format tasks for frontend
    const formattedTasks = tasks.map(task => ({
      id: task._id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      category: task.category,
      assigneeId: task.assignedTo?._id,
      assigneeName: task.assignedTo?.name || task.assigneeName,
      assigneeEmail: task.assignedTo?.email,
      createdBy: task.createdBy?.name,
      dueDate: task.dueDate,
      createdDate: task.createdAt,
      estimatedHours: task.estimatedHours,
      actualHours: task.actualHours,
      progress: task.progress,
      tags: task.tags,
      dependencies: task.dependencies,
      attachments: task.attachments,
      comments: task.comments
    }));

    return NextResponse.json({ 
      tasks: formattedTasks,
      total: formattedTasks.length 
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
    
    if (!session || (session.user.role !== 'mentor' && session.user.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const body = await request.json();
    const {
      title,
      description,
      status = 'not_started',
      priority = 'medium',
      category,
      assignedTo,
      dueDate,
      estimatedHours = 0,
      tags = [],
      dependencies = []
    } = body;

    // Validate required fields
    if (!title || !description || !category || !assignedTo || !dueDate) {
      return NextResponse.json({ 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    // Get assignee details
    const assignee = await User.findById(assignedTo);
    if (!assignee) {
      return NextResponse.json({ 
        error: 'Assignee not found' 
      }, { status: 404 });
    }

    // Create new task
    const task = new Task({
      title,
      description,
      status,
      priority,
      category,
      assignedTo,
      assigneeName: assignee.name,
      assigneeId: assignedTo,
      createdBy: session.user.id,
      dueDate: new Date(dueDate),
      estimatedHours,
      tags,
      dependencies
    });

    await task.save();

    // Populate the created task
    await task.populate('assignedTo', 'name email');
    await task.populate('createdBy', 'name email');

    const formattedTask = {
      id: task._id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      category: task.category,
      assigneeId: task.assignedTo._id,
      assigneeName: task.assignedTo.name,
      assigneeEmail: task.assignedTo.email,
      createdBy: task.createdBy.name,
      dueDate: task.dueDate,
      createdDate: task.createdAt,
      estimatedHours: task.estimatedHours,
      actualHours: task.actualHours,
      progress: task.progress,
      tags: task.tags,
      dependencies: task.dependencies
    };

    return NextResponse.json({ 
      task: formattedTask,
      message: 'Task created successfully' 
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ 
      error: 'Failed to create task' 
    }, { status: 500 });
  }
}