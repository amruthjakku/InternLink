import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase, getDatabase } from '../../../../utils/database';
import Task from '../../../../models/Task';
import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';

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
    
    console.log('Tasks with populated cohorts:', tasks.map(task => ({
      id: task._id,
      title: task.title,
      assignmentType: task.assignmentType,
      cohortId: task.cohortId,
      cohortIdRaw: task.cohortId?._id || task.cohortId,
      cohortName: task.cohortId?.name || task.cohortName
    })));
    
    // Count tasks by cohort
    const cohortCounts = {};
    tasks.forEach(task => {
      const cohortId = task.cohortId?._id || task.cohortId;
      if (cohortId) {
        const cohortIdStr = cohortId.toString();
        cohortCounts[cohortIdStr] = (cohortCounts[cohortIdStr] || 0) + 1;
      }
    });
    
    console.log('Task counts by cohort:', cohortCounts);

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

    if (!title || !description || !category || !cohortId || cohortId === '' || !dueDate) {
      return NextResponse.json({ 
        error: 'Title, description, category, cohort, and due date are required' 
      }, { status: 400 });
    }

    await connectToDatabase();

    // Convert cohortId to ObjectId if it's a string
    let cohortIdObj;
    try {
      cohortIdObj = mongoose.Types.ObjectId.isValid(cohortId) 
        ? new mongoose.Types.ObjectId(cohortId) 
        : cohortId;
    } catch (error) {
      console.error('Error converting cohort ID:', error);
      return NextResponse.json({ 
        error: 'Invalid cohort ID format' 
      }, { status: 400 });
    }
    
    // Get cohort name
    let cohortName = '';
    try {
      const db = await getDatabase();
      const cohort = await db.collection('cohorts').findOne({ _id: cohortIdObj });
      if (cohort) {
        cohortName = cohort.name;
        console.log(`Found cohort name: ${cohort.name} for ID: ${cohortId}`);
      } else {
        console.warn(`Cohort not found for ID: ${cohortId}`);
      }
    } catch (error) {
      console.error(`Error fetching cohort: ${error.message}`);
    }

    const taskData = {
      title,
      description,
      type: type || 'assignment',
      status: 'active',
      priority: priority || 'medium',
      category,
      assignmentType: 'cohort',
      cohortId: cohortIdObj,
      cohortName,
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