import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../utils/database';
import Task from '../../../../models/Task';
import User from '../../../../models/User';
import TaskProgress from '../../../../models/TaskProgress';
import mongoose from 'mongoose';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const cohortId = searchParams.get('cohortId');
    const taskId = searchParams.get('taskId');

    await connectToDatabase();

    if (action === 'stats') {
      // Get overall statistics
      const totalTasks = await Task.countDocuments({ isActive: true });
      const totalAIDeveloperInterns = await User.countDocuments({ role: 'AI Developer Intern', isActive: true });
      const totalProgress = await TaskProgress.countDocuments();
      
      const progressByStatus = await TaskProgress.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const topPerformers = await TaskProgress.aggregate([
        {
          $match: { status: { $in: ['completed', 'done'] } }
        },
        {
          $group: {
            _id: '$internId',
            totalPoints: { $sum: '$pointsEarned' },
            completedTasks: { $sum: 1 }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'AI Developer Intern'
          }
        },
        {
          $unwind: '$intern'
        },
        {
          $project: {
            name: '$intern.name',
            gitlabUsername: '$intern.gitlabUsername',
            totalPoints: 1,
            completedTasks: 1
          }
        },
        {
          $sort: { totalPoints: -1 }
        },
        {
          $limit: 10
        }
      ]);

      return NextResponse.json({
        success: true,
        stats: {
          totalTasks,
          totalAIDeveloperInterns,
          totalProgress,
          expectedProgress: totalTasks * totalAIDeveloperInterns,
          progressByStatus,
          topPerformers
        }
      });
    }

    if (action === 'cohort-progress' && cohortId) {
      // Get progress for a specific cohort
      const cohortAI Developer Interns = await User.find({ 
        cohortId: cohortId, 
        role: 'AI Developer Intern', 
        isActive: true 
      });

      const cohortTasks = await Task.find({
        $or: [
          { cohortId: cohortId, assignmentType: 'cohort' },
          { assignmentType: 'hierarchical' }
        ],
        isActive: true
      });

      const progressData = await Promise.all(cohortAI Developer Interns.map(async (intern) => {
        const internProgress = await TaskProgress.find({ internId: intern._id })
          .populate('taskId', 'title points category');
        
        const completedTasks = internProgress.filter(p => ['completed', 'done'].includes(p.status));
        const totalPoints = completedTasks.reduce((sum, p) => sum + (p.pointsEarned || 0), 0);
        
        return {
          intern: {
            id: intern._id,
            name: intern.name,
            gitlabUsername: intern.gitlabUsername
          },
          totalTasks: cohortTasks.length,
          completedTasks: completedTasks.length,
          totalPoints,
          completionRate: cohortTasks.length > 0 ? Math.round((completedTasks.length / cohortTasks.length) * 100) : 0
        };
      }));

      return NextResponse.json({
        success: true,
        cohortProgress: progressData.sort((a, b) => b.totalPoints - a.totalPoints)
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Error in admin task progress API:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch task progress data',
      details: error.message
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    await connectToDatabase();

    const body = await request.json();
    const { action, taskId, cohortId, internIds } = body;

    if (action === 'initialize-progress') {
      // Initialize TaskProgress records for a task and cohort/interns
      if (!taskId) {
        return NextResponse.json({ error: 'Task ID required' }, { status: 400 });
      }

      const task = await Task.findById(taskId);
      if (!task) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      }

      let targetAI Developer Interns = [];
      
      if (internIds && internIds.length > 0) {
        // Specific interns
        targetAI Developer Interns = await User.find({ 
          _id: { $in: internIds }, 
          role: 'AI Developer Intern', 
          isActive: true 
        });
      } else if (cohortId) {
        // All interns in cohort
        targetAI Developer Interns = await User.find({ 
          cohortId: cohortId, 
          role: 'AI Developer Intern', 
          isActive: true 
        });
      } else if (task.assignmentType === 'cohort' && task.cohortId) {
        // Use task's cohort
        targetAI Developer Interns = await User.find({ 
          cohortId: task.cohortId, 
          role: 'AI Developer Intern', 
          isActive: true 
        });
      } else {
        return NextResponse.json({ error: 'No target interns specified' }, { status: 400 });
      }

      let created = 0;
      let existing = 0;

      for (const intern of targetAI Developer Interns) {
        const existingProgress = await TaskProgress.findOne({
          taskId: taskId,
          internId: intern._id
        });

        if (!existingProgress) {
          await TaskProgress.create({
            taskId: taskId,
            internId: intern._id,
            status: 'not_started',
            progress: 0,
            pointsEarned: 0
          });
          created++;
        } else {
          existing++;
        }
      }

      return NextResponse.json({
        success: true,
        message: `Initialized progress tracking`,
        stats: {
          created,
          existing,
          totalAIDeveloperInterns: targetAI Developer Interns.length
        }
      });
    }

    if (action === 'bulk-initialize') {
      // Initialize progress for all cohort tasks and interns
      if (!cohortId) {
        return NextResponse.json({ error: 'Cohort ID required' }, { status: 400 });
      }

      const cohortTasks = await Task.find({
        $or: [
          { cohortId: cohortId, assignmentType: 'cohort' },
          { assignmentType: 'hierarchical' }
        ],
        isActive: true
      });

      const cohortAI Developer Interns = await User.find({ 
        cohortId: cohortId, 
        role: 'AI Developer Intern', 
        isActive: true 
      });

      let created = 0;
      let existing = 0;

      for (const task of cohortTasks) {
        for (const intern of cohortAI Developer Interns) {
          const existingProgress = await TaskProgress.findOne({
            taskId: task._id,
            internId: intern._id
          });

          if (!existingProgress) {
            await TaskProgress.create({
              taskId: task._id,
              internId: intern._id,
              status: 'not_started',
              progress: 0,
              pointsEarned: 0
            });
            created++;
          } else {
            existing++;
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: `Bulk initialized progress tracking for cohort`,
        stats: {
          created,
          existing,
          totalTasks: cohortTasks.length,
          totalAIDeveloperInterns: cohortAI Developer Interns.length,
          expectedRecords: cohortTasks.length * cohortAI Developer Interns.length
        }
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Error in admin task progress POST:', error);
    return NextResponse.json({ 
      error: 'Failed to process request',
      details: error.message
    }, { status: 500 });
  }
}