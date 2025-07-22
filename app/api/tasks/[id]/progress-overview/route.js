import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../../utils/database';
import Task from '../../../../../models/Task';
import User from '../../../../../models/User';
import TaskProgress from '../../../../../models/TaskProgress';
import mongoose from 'mongoose';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only mentors, super-mentors, and admins can view progress overview
    if (!['Tech Lead', 'POC', 'admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { id } = params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 });
    }

    await connectToDatabase();

    // Find the task
    const task = await Task.findById(id).populate('cohortId', 'name');
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Get all progress records for this task
    const progressRecords = await TaskProgress.find({ taskId: id })
      .populate('internId', 'name email gitlabUsername college')
      .sort({ updatedAt: -1 });

    // Get all interns who should have this task (but might not have progress records yet)
    let expectedAIDeveloperInterns = [];
    
    if (task.assignmentType === 'individual' && task.assignedTo) {
      const intern = await User.findById(task.assignedTo);
      if (intern && intern.role === 'AI Developer Intern') {
        expectedAIDeveloperInterns = [intern];
      }
    } else if (task.assignmentType === 'cohort' && task.cohortId) {
      expectedAIDeveloperInterns = await User.find({ 
        cohortId: task.cohortId, 
        role: 'AI Developer Intern',
        isActive: true 
      });
    } else if (task.assignmentType === 'hierarchical' && task.assignedTo?.colleges) {
      expectedAIDeveloperInterns = await User.find({
        college: { $in: task.assignedTo.colleges },
        role: 'AI Developer Intern',
        isActive: true
      });
    }

    // Create a map of existing progress records
    const progressMap = new Map();
    progressRecords.forEach(progress => {
      progressMap.set(progress.internId._id.toString(), progress);
    });

    // Build comprehensive progress overview
    const progressOverview = expectedAIDeveloperInterns.map(intern => {
      const progress = progressMap.get(intern._id.toString());
      
      return {
        intern: {
          id: intern._id,
          name: intern.name,
          email: intern.email,
          gitlabUsername: intern.gitlabUsername,
          college: intern.college
        },
        progress: progress ? {
          id: progress._id,
          status: progress.status,
          progress: progress.progress,
          actualHours: progress.actualHours,
          pointsEarned: progress.pointsEarned,
          startedAt: progress.startedAt,
          completedAt: progress.completedAt,
          submissionUrl: progress.submissionUrl,
          submissionNotes: progress.submissionNotes,
          needsHelp: progress.needsHelp,
          helpMessage: progress.helpMessage,
          lastUpdated: progress.updatedAt
        } : {
          status: 'not_started',
          progress: 0,
          actualHours: 0,
          pointsEarned: 0,
          startedAt: null,
          completedAt: null,
          submissionUrl: null,
          submissionNotes: null,
          needsHelp: false,
          helpMessage: null,
          lastUpdated: null
        }
      };
    });

    // Calculate summary statistics
    const totalAIDeveloperInterns = progressOverview.length;
    const completedCount = progressOverview.filter(p => 
      ['completed', 'done'].includes(p.progress.status)
    ).length;
    const inProgressCount = progressOverview.filter(p => 
      p.progress.status === 'in_progress'
    ).length;
    const reviewCount = progressOverview.filter(p => 
      p.progress.status === 'review'
    ).length;
    const notStartedCount = progressOverview.filter(p => 
      p.progress.status === 'not_started'
    ).length;
    const needsHelpCount = progressOverview.filter(p => 
      p.progress.needsHelp
    ).length;

    const averageProgress = totalAIDeveloperInterns > 0 
      ? Math.round(progressOverview.reduce((sum, p) => sum + p.progress.progress, 0) / totalAIDeveloperInterns)
      : 0;

    const totalPointsEarned = progressOverview.reduce((sum, p) => sum + p.progress.pointsEarned, 0);
    const totalHoursLogged = progressOverview.reduce((sum, p) => sum + p.progress.actualHours, 0);

    return NextResponse.json({
      success: true,
      task: {
        id: task._id,
        title: task.title,
        description: task.description,
        assignmentType: task.assignmentType,
        cohortId: task.cohortId,
        cohortName: task.cohortId?.name,
        points: task.points || 10,
        dueDate: task.dueDate,
        estimatedHours: task.estimatedHours
      },
      summary: {
        totalAIDeveloperInterns,
        completedCount,
        inProgressCount,
        reviewCount,
        notStartedCount,
        needsHelpCount,
        averageProgress,
        totalPointsEarned,
        totalHoursLogged: Math.round(totalHoursLogged * 10) / 10,
        completionRate: totalAIDeveloperInterns > 0 ? Math.round((completedCount / totalAIDeveloperInterns) * 100) : 0
      },
      progressOverview: progressOverview.sort((a, b) => {
        // Sort by status priority, then by progress percentage
        const statusPriority = {
          'completed': 4,
          'review': 3,
          'in_progress': 2,
          'not_started': 1
        };
        
        const aPriority = statusPriority[a.progress.status] || 0;
        const bPriority = statusPriority[b.progress.status] || 0;
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority;
        }
        
        return b.progress.progress - a.progress.progress;
      })
    });

  } catch (error) {
    console.error('Error fetching task progress overview:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch task progress overview',
      details: error.message
    }, { status: 500 });
  }
}