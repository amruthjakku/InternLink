import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase, getDatabase } from '../../../../utils/database';
import Task from '../../../../models/Task';
import User from '../../../../models/User';
import College from '../../../../models/College';
import Cohort from '../../../../models/Cohort';
import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !['admin', 'super-admin'].includes(session.user.role)) {
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
    
    if (!session?.user || !['admin', 'super-admin'].includes(session.user.role)) {
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
      collegeIds, // New: for hierarchical assignment
      assignmentType, // New: 'hierarchical' or 'cohort'
      points, // New: task points
      dueDate, 
      startDate,
      estimatedHours,
      requirements,
      resources,
      createdBy,
      createdByRole,
      assignedBy,
      assignedTo // New: for hierarchical assignment structure
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
      assignmentType: assignmentType || 'cohort',
      cohortId: cohortIdObj,
      cohortName,
      points: points || 0,
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
      isActive: true,
      // New hierarchical assignment fields
      assignedTo: assignedTo || {
        cohort: cohortId,
        colleges: collegeIds || [],
        users: []
      }
    };

    const newTask = new Task(taskData);
    await newTask.save();

    // If hierarchical assignment, assign to users in selected colleges
    let assignedUserCount = 0;
    if (assignmentType === 'hierarchical' && collegeIds?.length > 0) {
      assignedUserCount = await assignTaskToColleges(newTask._id, collegeIds);
    }

    return NextResponse.json({ 
      success: true,
      taskId: newTask._id,
      message: 'Task created successfully',
      assignedUserCount
    });

  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ 
      error: 'Failed to create task' 
    }, { status: 500 });
  }
}

// Helper function to assign task to users in specified colleges
async function assignTaskToColleges(taskId, collegeIds) {
  try {
    // Find all active users in the specified colleges
    const users = await User.find({
      college: { $in: collegeIds },
      isActive: true,
      role: { $in: ['intern', 'mentor'] } // Only assign to interns and mentors
    });

    // Update users to include this task in their assigned tasks
    const userIds = users.map(user => user._id);
    
    // For now, we'll just log the assignment
    // In a real implementation, you might have a separate TaskAssignment collection
    console.log(`Task ${taskId} assigned to ${users.length} users across ${collegeIds.length} colleges`);
    
    return users.length;
  } catch (error) {
    console.error('Error assigning task to colleges:', error);
    return 0;
  }
}