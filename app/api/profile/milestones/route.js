import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase, getDatabase } from '../../../../utils/database';
import User from '../../../../models/User';
import Task from '../../../../models/Task';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Generate milestones based on user activity
    const milestones = await generateMilestones(user);

    return NextResponse.json({ 
      success: true,
      milestones
    });

  } catch (error) {
    console.error('Error fetching milestones:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch milestones' 
    }, { status: 500 });
  }
}

async function generateMilestones(user) {
  const milestones = [];
  const now = new Date();

  try {
    // Ensure user has required properties
    if (!user._id) {
      console.error('User object missing _id property:', user);
      return milestones; // Return empty array if user is invalid
    }

    // Task-based milestones
    const completedTasks = await Task.countDocuments({
      $or: [
        { assignedTo: user._id },
        { 'submissions.internId': user._id, 'submissions.status': 'approved' }
      ],
      status: 'completed'
    });

    if (completedTasks >= 1) {
      milestones.push({
        id: 'first_task',
        title: 'First Task Completed',
        description: 'Completed your first task successfully',
        icon: '🎯',
        points: 10,
        achievedAt: user.createdAt,
        category: 'tasks'
      });
    }

    if (completedTasks >= 5) {
      milestones.push({
        id: 'task_warrior',
        title: 'Task Warrior',
        description: 'Completed 5 tasks',
        icon: '⚔️',
        points: 25,
        achievedAt: user.createdAt,
        category: 'tasks'
      });
    }

    if (completedTasks >= 10) {
      milestones.push({
        id: 'task_master',
        title: 'Task Master',
        description: 'Completed 10 tasks',
        icon: '🏆',
        points: 50,
        achievedAt: user.createdAt,
        category: 'tasks'
      });
    }

    // GitLab-based milestones
    if (user.gitlabIntegration?.connected) {
      milestones.push({
        id: 'gitlab_connected',
        title: 'GitLab Connected',
        description: 'Successfully connected GitLab account',
        icon: '🦊',
        points: 15,
        achievedAt: user.gitlabIntegration.connectedAt || user.createdAt,
        category: 'integration'
      });

      // Check for commit milestones from activity records
      const db = await getDatabase();
      
      const commitCount = await db.collection('activityrecords').countDocuments({
        userId: user._id,
        type: 'commit'
      });

      if (commitCount >= 1) {
        milestones.push({
          id: 'first_commit',
          title: 'First Commit',
          description: 'Made your first commit',
          icon: '💾',
          points: 10,
          achievedAt: user.createdAt,
          category: 'development'
        });
      }

      if (commitCount >= 50) {
        milestones.push({
          id: 'commit_champion',
          title: 'Commit Champion',
          description: 'Made 50 commits',
          icon: '🚀',
          points: 40,
          achievedAt: user.createdAt,
          category: 'development'
        });
      }

      if (commitCount >= 100) {
        milestones.push({
          id: 'code_ninja',
          title: 'Code Ninja',
          description: 'Made 100 commits',
          icon: '🥷',
          points: 75,
          achievedAt: user.createdAt,
          category: 'development'
        });
      }
    }

    // Time-based milestones
    const daysSinceJoining = Math.floor((now - new Date(user.createdAt)) / (1000 * 60 * 60 * 24));
    
    if (daysSinceJoining >= 7) {
      milestones.push({
        id: 'week_survivor',
        title: 'Week Survivor',
        description: 'Active for one week',
        icon: '📅',
        points: 20,
        achievedAt: new Date(user.createdAt.getTime() + 7 * 24 * 60 * 60 * 1000),
        category: 'engagement'
      });
    }

    if (daysSinceJoining >= 30) {
      milestones.push({
        id: 'monthly_member',
        title: 'Monthly Member',
        description: 'Active for one month',
        icon: '🗓️',
        points: 50,
        achievedAt: new Date(user.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000),
        category: 'engagement'
      });
    }

    // Role-based milestones
    if (user.role === 'intern') {
      milestones.push({
        id: 'intern_journey',
        title: 'Intern Journey Begins',
        description: 'Started your internship journey',
        icon: '🎓',
        points: 5,
        achievedAt: user.createdAt,
        category: 'role'
      });
    }

    if (user.role === 'mentor') {
      milestones.push({
        id: 'mentor_status',
        title: 'Mentor Status',
        description: 'Became a mentor',
        icon: '👨‍🏫',
        points: 100,
        achievedAt: user.createdAt,
        category: 'role'
      });
    }

    // Attendance-based milestones (if attendance data exists)
    const attendanceRecords = await db.collection('attendancerecords').countDocuments({
      userId: user._id,
      status: 'present'
    });

    if (attendanceRecords >= 5) {
      milestones.push({
        id: 'attendance_streak',
        title: 'Attendance Streak',
        description: 'Maintained good attendance',
        icon: '📍',
        points: 30,
        achievedAt: user.createdAt,
        category: 'attendance'
      });
    }

    // Sort milestones by achievement date (most recent first)
    milestones.sort((a, b) => new Date(b.achievedAt) - new Date(a.achievedAt));

    return milestones;

  } catch (error) {
    console.error('Error generating milestones:', error);
    return [];
  }
}