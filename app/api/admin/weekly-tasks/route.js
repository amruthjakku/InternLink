import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../utils/database';
import WeeklyTask from '../../../../models/WeeklyTask';
import Cohort from '../../../../models/Cohort';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const weekNumber = searchParams.get('week');
    const cohortId = searchParams.get('cohort');
    
    let query = {};
    
    if (weekNumber) {
      query.weekNumber = parseInt(weekNumber);
    }
    
    if (cohortId) {
      query.cohortId = cohortId;
    }
    
    const tasks = await WeeklyTask.find(query)
      .populate('cohortId', 'name')
      .populate('createdBy', 'name email')
      .sort({ weekNumber: 1, createdAt: 1 });
    
    // Get week statistics
    const weekStats = await WeeklyTask.aggregate([
      {
        $group: {
          _id: '$weekNumber',
          totalTasks: { $sum: 1 },
          activeTasks: { $sum: { $cond: ['$isActive', 1, 0] } },
          publishedTasks: { $sum: { $cond: ['$isPublished', 1, 0] } },
          avgPoints: { $avg: '$points' },
          weeks: { $addToSet: '$weekNumber' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    return NextResponse.json({
      success: true,
      tasks,
      weekStats,
      totalTasks: tasks.length
    });

  } catch (error) {
    console.error('Error fetching weekly tasks:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch weekly tasks',
      details: error.message 
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    const data = await request.json();
    
    // Validate required fields
    const requiredFields = ['title', 'description', 'weekNumber', 'weekStartDate', 'weekEndDate'];
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json({ 
          error: `Missing required field: ${field}` 
        }, { status: 400 });
      }
    }
    
    // Create the task
    const taskData = {
      ...data,
      createdBy: session.user.id,
      weekStartDate: new Date(data.weekStartDate),
      weekEndDate: new Date(data.weekEndDate)
    };
    
    // Set activation and due dates if not provided
    if (!taskData.activationDate) {
      taskData.activationDate = taskData.weekStartDate;
    }
    if (!taskData.dueDate) {
      taskData.dueDate = taskData.weekEndDate;
    }
    
    const task = new WeeklyTask(taskData);
    await task.save();
    
    // Populate the response
    await task.populate('cohortId', 'name');
    await task.populate('createdBy', 'name email');
    
    return NextResponse.json({
      success: true,
      message: 'Weekly task created successfully',
      task
    });

  } catch (error) {
    console.error('Error creating weekly task:', error);
    return NextResponse.json({ 
      error: 'Failed to create weekly task',
      details: error.message 
    }, { status: 500 });
  }
}