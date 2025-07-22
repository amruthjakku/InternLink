import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { connectToDatabase, getDatabase } from '../../../utils/database';
import { ObjectId } from 'mongodb';
import Task from '../../../models/Task';
import User from '../../../models/User';
import TaskProgress from '../../../models/TaskProgress';

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
    if (session.user.role === 'AI Developer Intern') {
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
            id: task._id,
            title: task.title || 'Untitled Task',
            description: task.description,
            instructions: task.instructions,
            assignmentType: task.assignmentType,
            cohortId: task.cohortId,
            assignedTo: task.assignedTo,
            isActive: task.isActive,
            status: task.status || 'not_started',
            priority: task.priority || 'medium',
            difficulty: task.difficulty,
            points: task.points || 0,
            progress: 0,
            estimatedHours: task.estimatedHours,
            category: task.category,
            weekNumber: task.weekNumber,
            weekStartDate: task.weekStartDate,
            weekEndDate: task.weekEndDate,
            dueDate: task.dueDate,
            prerequisites: task.prerequisites,
            deliverables: task.deliverables,
            resources: task.resources,
            tags: task.tags || [],
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
        // Get the user with their cohort and college information
        const user = await User.findById(session.user.id).populate('college');
        
        if (user) {
          console.log(`AI Developer Intern ${user.name} (${user._id})`);
          
          // Build query for tasks
          const orConditions = [];
          
          // 1. Add hierarchical tasks (assigned to the intern's college)
          if (user.college) {
            console.log(`AI Developer Intern's college ID: ${user.college._id}`);
            
            // Add tasks assigned to the intern's college through hierarchical assignment
            orConditions.push({
              assignmentType: 'hierarchical',
              'assignedTo.colleges': user.college._id
            });
          }
          
          // 2. Add cohort-based tasks
          if (user.cohortId) {
            console.log(`AI Developer Intern's cohort ID: ${user.cohortId}`);
            
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
            
            // Add tasks assigned to the intern's cohort
            orConditions.push({ 
              cohortId: cohortIdObj,
              assignmentType: 'cohort'
            });
          }
          
          // 3. Add individually assigned tasks
          orConditions.push(
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
          );
          
          // Set the combined query
          query.$or = orConditions;
          
          // Add a log to show the exact query being used
          console.log('AI Developer Intern tasks query:', JSON.stringify(query, null, 2));
          
          console.log('Showing hierarchical, cohort, and individual tasks for intern');
        } else {
          console.log(`AI Developer Intern ${session.user.id} not found in database`);
          
          // If intern is not found, show individually assigned tasks
          query.$or = [
            { assignedTo: session.user.id },
            { assigneeId: session.user.id }
          ];
          
          console.log('Showing only individual tasks for intern (not found in DB)');
        }
      } catch (error) {
        console.error('Error getting user information:', error);
        // Fallback to just showing individually assigned tasks
        query.$or = [
          { assignedTo: session.user.id },
          { assigneeId: session.user.id }
        ];
      }
    }
    
    // If user is mentor, show tasks they created or are assigned to their interns
    if (session.user.role === 'Tech Lead') {
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
    if (session.user.role === 'AI Developer Intern') {
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

    // Get individual progress for intern users
    let taskProgressMap = new Map();
    if (session.user.role === 'AI Developer Intern') {
      const taskIds = tasks.map(task => task._id);
      const progressRecords = await TaskProgress.find({
        taskId: { $in: taskIds },
        internId: session.user.id
      });
      
      progressRecords.forEach(progress => {
        taskProgressMap.set(progress.taskId.toString(), progress);
      });
    }

    // Format tasks for frontend
    const formattedTasks = await Promise.all(tasks.map(async task => {
      // Get individual progress for this intern if available
      const individualProgress = taskProgressMap.get(task._id.toString());
      
      const formattedTask = {
        id: task._id,
        title: task.title,
        description: task.description,
        // Use individual progress status if available, otherwise use task status, with fallback
        status: (individualProgress ? individualProgress.status : task.status) || 'not_started',
        priority: task.priority || 'medium',
        category: task.category,
        assigneeId: task.assignedTo?._id,
        assigneeName: task.assignedTo?.name || task.assigneeName,
        assigneeEmail: task.assignedTo?.email,
        createdBy: task.createdBy?.name,
        dueDate: task.dueDate,
        createdDate: task.createdAt,
        estimatedHours: task.estimatedHours,
        // Use individual progress data if available
        actualHours: individualProgress ? individualProgress.actualHours : task.actualHours,
        progress: (individualProgress ? individualProgress.progress : task.progress) || 0,
        tags: task.tags || [],
        dependencies: task.dependencies || [],
        attachments: task.attachments || [],
        comments: task.comments || [],
        timeTracking: individualProgress ? individualProgress.timeLogs : (task.timeTracking || []),
        cohortId: task.cohortId,
        cohortName: task.cohortName,
        assignmentType: task.assignmentType,
        weekNumber: task.weekNumber || null,
        points: task.points || 0,
        // Individual progress specific fields
        individualProgress: individualProgress ? {
          id: individualProgress._id,
          status: individualProgress.status,
          progress: individualProgress.progress,
          actualHours: individualProgress.actualHours,
          pointsEarned: individualProgress.pointsEarned,
          startedAt: individualProgress.startedAt,
          completedAt: individualProgress.completedAt,
          submissionUrl: individualProgress.submissionUrl,
          submissionNotes: individualProgress.submissionNotes,
          needsHelp: individualProgress.needsHelp,
          helpMessage: individualProgress.helpMessage,
          // GitLab repository details
          repoUrl: individualProgress.repoUrl,
          submissionMethod: individualProgress.submissionMethod,
          verified: individualProgress.verified,
          submittedOn: individualProgress.submittedOn,
          matchConfidence: individualProgress.matchConfidence,
          matchMethod: individualProgress.matchMethod
        } : null,
        // GitLab template repository
        gitlabTemplateRepo: task.gitlabTemplateRepo || null,
        verificationLevel: task.verificationLevel || 'none',
        matchKeywords: task.matchKeywords || [],
        subtasks: task.subtasks?.map(subtask => {
          // Find individual subtask progress if available
          const subtaskProgress = individualProgress?.subtaskProgress?.find(
            sp => sp.subtaskId.toString() === subtask._id.toString()
          );
          
          return {
            id: subtask._id,
            title: subtask.title,
            description: subtask.description,
            completed: subtaskProgress ? subtaskProgress.completed : subtask.completed,
            completedAt: subtaskProgress ? subtaskProgress.completedAt : subtask.completedAt,
            priority: subtask.priority,
            estimatedHours: subtask.estimatedHours,
            actualHours: subtaskProgress ? subtaskProgress.actualHours : subtask.actualHours,
            createdAt: subtask.createdAt,
            updatedAt: subtask.updatedAt
          };
        }) || []
      };
      
      // Add hierarchical assignment information if available
      if (task.assignmentType === 'hierarchical' && task.assignedTo) {
        formattedTask.hierarchicalAssignment = {
          cohort: task.assignedTo.cohort,
          colleges: task.assignedTo.colleges
        };
      }
      
      return formattedTask;
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
    
    if (!session || !['Tech Lead', 'POC', 'admin'].includes(session.user.role)) {
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
      dependencies = [],
      points = 10, // Default to 10 points if not specified
      progress = 0
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
      dependencies,
      points, // Add points to the task
      progress // Add progress to the task
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