import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../../utils/database';
import Task from '../../../../../models/Task';
import mongoose from 'mongoose';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fromCohortId, toCohortId, importedBy, selectedTasks } = await request.json();

    if (!fromCohortId || !toCohortId) {
      return NextResponse.json({ 
        error: 'Source and destination cohort IDs are required' 
      }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(fromCohortId) || !mongoose.Types.ObjectId.isValid(toCohortId)) {
      return NextResponse.json({ error: 'Invalid cohort IDs' }, { status: 400 });
    }

    await connectToDatabase();

    // Get tasks from source cohort
    let query = { 
      cohortId: fromCohortId, 
      isActive: true 
    };

    // If specific tasks are selected, filter by those IDs
    if (selectedTasks && selectedTasks.length > 0) {
      query._id = { $in: selectedTasks.map(id => new mongoose.Types.ObjectId(id)) };
    }

    const sourceTasks = await Task.find(query);

    if (sourceTasks.length === 0) {
      return NextResponse.json({ 
        error: 'No tasks found to import' 
      }, { status: 404 });
    }

    // Get cohort names for metadata
    const { getDatabase } = require('../../../../../utils/database');
    const db = await getDatabase();
    
    const [fromCohort, toCohort] = await Promise.all([
      db.collection('cohorts').findOne({ _id: new mongoose.Types.ObjectId(fromCohortId) }),
      db.collection('cohorts').findOne({ _id: new mongoose.Types.ObjectId(toCohortId) })
    ]);

    if (!fromCohort || !toCohort) {
      return NextResponse.json({ 
        error: 'Source or destination cohort not found' 
      }, { status: 404 });
    }

    // Create new tasks for destination cohort
    const importedTasks = [];
    
    for (const sourceTask of sourceTasks) {
      const newTaskData = {
        title: sourceTask.title,
        description: sourceTask.description,
        type: sourceTask.type,
        status: 'draft', // Import as draft initially
        priority: sourceTask.priority,
        category: sourceTask.category,
        assignmentType: 'cohort',
        cohortId: toCohortId,
        cohortName: toCohort.name,
        createdBy: session.user.id,
        createdByRole: session.user.role,
        assignedBy: importedBy || session.user.gitlabUsername,
        dueDate: sourceTask.dueDate,
        startDate: sourceTask.startDate,
        estimatedHours: sourceTask.estimatedHours,
        actualHours: 0,
        progress: 0,
        tags: [...sourceTask.tags],
        dependencies: [], // Don't copy dependencies as they may not exist in new cohort
        attachments: [...sourceTask.attachments],
        resources: [...sourceTask.resources],
        requirements: sourceTask.requirements.map(req => ({
          description: req.description,
          completed: false // Reset completion status
        })),
        submissions: [], // Don't copy submissions
        comments: [], // Don't copy comments
        // Import metadata
        originalTaskId: sourceTask._id,
        importedFrom: {
          cohortId: fromCohortId,
          cohortName: fromCohort.name,
          importedAt: new Date(),
          importedBy: importedBy || session.user.gitlabUsername
        },
        isActive: true
      };

      const newTask = new Task(newTaskData);
      await newTask.save();
      importedTasks.push(newTask);
    }

    return NextResponse.json({ 
      success: true,
      importedCount: importedTasks.length,
      message: `Successfully imported ${importedTasks.length} tasks from ${fromCohort.name} to ${toCohort.name}`
    });

  } catch (error) {
    console.error('Error importing tasks:', error);
    return NextResponse.json({ 
      error: 'Failed to import tasks' 
    }, { status: 500 });
  }
}