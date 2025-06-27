import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { connectToDatabase, getDatabase } from '../../../utils/database';
import { ObjectId } from 'mongodb';
import Task from '../../../models/Task';
import User from '../../../models/User';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const { getDatabase } = require('../../../utils/database');
    const db = await getDatabase();

    const { searchParams } = new URL(request.url);
    const assignedTo = searchParams.get('assignedTo');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const category = searchParams.get('category');

    // Build query based on user role and filters
    let query = {};
    
    // If user is intern, show tasks for their cohort
    if (session.user.role === 'intern') {
      // First, try to get weekly tasks
      console.log('Checking for weekly tasks...');
      try {
        const weeklyTasks = await db.collection('weeklytasks').find({
          isActive: true,
          isPublished: true,
          $or: [
            { assignmentType: 'all' },
            { assignmentType: 'cohort', cohortId: new ObjectId(session.user.cohortId) },
            { assignmentType: 'individual', assignedTo: new ObjectId(session.user.id) }
          ]
        }).toArray();
        
        console.log(`Found ${weeklyTasks.length} weekly tasks for user`);
        
        // If we have weekly tasks, return them instead of old format tasks
        if (weeklyTasks.length > 0) {
          // Convert weekly tasks to the format expected by frontend
          const formattedTasks = weeklyTasks.map(task => ({
            _id: task._id,
            title: task.title,
            description: task.description,
            instructions: task.instructions,
            assignmentType: task.assignmentType,
            cohortId: task.cohortId,
            assignedTo: task.assignedTo,
            isActive: task.isActive,
            status: 'active',
            difficulty: task.difficulty,
            points: task.points,
            estimatedHours: task.estimatedHours,
            category: task.category,
            weekNumber: task.weekNumber,
            weekStartDate: task.weekStartDate,
            weekEndDate: task.weekEndDate,
            dueDate: task.dueDate,
            prerequisites: task.prerequisites,
            deliverables: task.deliverables,
            resources: task.resources,
            tags: task.tags,
            createdAt: task.createdAt,
            updatedAt: task.updatedAt
          }));
          
          console.log(`Returning ${formattedTasks.length} weekly tasks`);
          
          return NextResponse.json({
            success: true,
            tasks: formattedTasks,
            taskType: 'weekly',
            totalTasks: formattedTasks.length
          });
        }
      } catch (error) {
        console.error('Error fetching weekly tasks:', error);
        // Continue with regular tasks if weekly tasks fail
      }
      
      query.isActive = true;
      
      try {
        // Get the user with their cohort information
        const user = await User.findById(session.user.id);
        
        if (user && user.cohortId) {
          console.log(`Intern ${user.name} (${user._id}) is assigned to cohort ${user.cohortId}`);
          
          console.log(`Intern's cohort ID: ${user.cohortId}`);
          
          // Convert cohortId to ObjectId if it's a string
          let cohortIdObj;
          try {
            cohortIdObj = ObjectId.isValid(user.cohortId) 
              ? new ObjectId(user.cohortId) 
              : user.cohortId;
            console.log(`Converted cohort ID: ${cohortIdObj}`);
          } catch (error) {
            console.error('Error converting cohort ID:', error);
            cohortIdObj = user.cohortId;
          }
          
          // Show only tasks assigned to the intern's cohort or directly to the intern
          query.$or = [
            // Tasks assigned to the intern's cohort
            { 
              cohortId: cohortIdObj,
              assignmentType: 'cohort'
            },
            // Tasks assigned directly to the intern
            { 
              assignedTo: session.user.id,
              assignmentType: 'individual'
            },
            // Tasks where assigneeId is set to the intern
            {
              assigneeId: session.user.id,
              assignmentType: 'individual'
            }
          ];
          
          // Add a log to show the exact query being used
          console.log('Intern tasks query:', JSON.stringify(query, null, 2));
          
          console.log('Query for intern tasks:', JSON.stringify(query));
          
          console.log('Showing cohort and individual tasks for intern');
        } else {
          console.log(`Intern ${user?.name || 'Unknown'} (${session.user.id}) is not assigned to any cohort`);
          
          // If intern is not assigned to a cohort, show individually assigned tasks
          query.$or = [
            { assignedTo: session.user.id },
            { assigneeId: session.user.id }
          ];
          
          console.log('Showing only individual tasks for intern (no cohort)');
          console.log('💡 SOLUTION: This intern needs to be assigned to a cohort to see cohort-based tasks');
          console.log('💡 Admin can assign this intern to a cohort through the User Management section');
        }
      } catch (error) {
        console.error('Error getting user cohort:', error);
        // Fallback to just showing individually assigned tasks
        query.$or = [
          { assignedTo: session.user.id },
          { assigneeId: session.user.id }
        ];
      }
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

    console.log('Final query for tasks:', JSON.stringify(query));
    
    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('cohortId', 'name startDate endDate')
      .sort({ createdAt: -1 });
      
    console.log(`Found ${tasks.length} tasks for user ${session.user.id} with role ${session.user.role}`);
    
    // Enhanced debugging for cohort task matching
    if (session.user.role === 'intern') {
      console.log('=== INTERN TASK DEBUG ===');
      console.log('Session user ID:', session.user.id);
      console.log('Session cohort ID:', session.user.cohortId);
      console.log('Query used:', JSON.stringify(query, null, 2));
      
      // Get all tasks for this cohort (including inactive ones) for comparison
      const db = await getDatabase();
      const allCohortTasks = await db.collection('tasks').find({
        cohortId: query.$or?.[0]?.cohortId,
        assignmentType: 'cohort'
      }).toArray();
      
      console.log(`Total tasks for cohort ${query.$or?.[0]?.cohortId}: ${allCohortTasks.length}`);
      allCohortTasks.forEach(task => {
        console.log(`- ${task.title}: isActive=${task.isActive}, status=${task.status}`);
      });
      
      console.log('=== RETURNED TASKS ===');
    }
    
    // Log task details for debugging
    tasks.forEach(task => {
      console.log(`Task: ${task.title}, Type: ${task.assignmentType}, Cohort: ${task.cohortId?._id || task.cohortId}, Assigned To: ${task.assignedTo?._id || task.assignedTo}`);
    });

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
      comments: task.comments,
      timeTracking: task.timeTracking || [],
      cohortId: task.cohortId,
      cohortName: task.cohortName,
      assignmentType: task.assignmentType
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
    
    if (!session || !['mentor', 'super-mentor', 'admin'].includes(session.user.role)) {
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
      cohortId,
      assignmentType = 'individual',
      dueDate,
      estimatedHours = 0,
      tags = [],
      dependencies = []
    } = body;

    // Validate required fields based on assignment type
    if (!title || !description || !category || !dueDate) {
      return NextResponse.json({ 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    if (assignmentType === 'individual' && !assignedTo) {
      return NextResponse.json({ 
        error: 'Individual tasks require an assignee' 
      }, { status: 400 });
    }

    if (assignmentType === 'cohort' && !cohortId) {
      return NextResponse.json({ 
        error: 'Cohort tasks require a cohort' 
      }, { status: 400 });
    }

    let assignee = null;
    let cohortName = null;

    // Get assignee details if it's an individual assignment
    if (assignmentType === 'individual' && assignedTo) {
      assignee = await User.findById(assignedTo);
      if (!assignee) {
        return NextResponse.json({ 
          error: 'Assignee not found' 
        }, { status: 404 });
      }
    }

    // Get cohort details if it's a cohort assignment
    if (assignmentType === 'cohort' && cohortId) {
      const db = await getDatabase();
      const cohort = await db.collection('cohorts').findOne({ _id: new ObjectId(cohortId) });
      if (!cohort) {
        return NextResponse.json({ 
          error: 'Cohort not found' 
        }, { status: 404 });
      }
      cohortName = cohort.name;
    }

    // Create new task
    const taskData = {
      title,
      description,
      status,
      priority,
      category,
      assignmentType,
      createdBy: session.user.id,
      createdByRole: session.user.role,
      dueDate: new Date(dueDate),
      estimatedHours,
      tags,
      dependencies
    };

    // Add assignment details based on type
    if (assignmentType === 'individual' && assignee) {
      taskData.assignedTo = assignedTo;
      taskData.assigneeName = assignee.name;
      taskData.assigneeId = assignedTo;
    } else if (assignmentType === 'cohort' && cohortId) {
      taskData.cohortId = cohortId;
      taskData.cohortName = cohortName;
    }

    const task = new Task(taskData);

    await task.save();

    // Populate the created task
    await task.populate('assignedTo', 'name email');
    await task.populate('createdBy', 'name email');

    // Format the task response based on assignment type
    const formattedTask = {
      id: task._id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      category: task.category,
      assignmentType: task.assignmentType,
      createdBy: task.createdBy?.name,
      dueDate: task.dueDate,
      createdDate: task.createdAt,
      estimatedHours: task.estimatedHours,
      actualHours: task.actualHours,
      progress: task.progress,
      tags: task.tags,
      dependencies: task.dependencies,
      timeTracking: task.timeTracking || []
    };

    // Add assignment-specific details
    if (task.assignmentType === 'individual' && task.assignedTo) {
      formattedTask.assigneeId = task.assignedTo._id;
      formattedTask.assigneeName = task.assignedTo.name;
      formattedTask.assigneeEmail = task.assignedTo.email;
    } else if (task.assignmentType === 'cohort') {
      formattedTask.cohortId = task.cohortId;
      formattedTask.cohortName = task.cohortName;
    }

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