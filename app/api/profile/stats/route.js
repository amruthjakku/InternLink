import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../utils/database';
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

    // Generate stats based on user activity
    const stats = await generateUserStats(user);

    return NextResponse.json({ 
      success: true,
      stats
    });

  } catch (error) {
    console.error('Error fetching profile stats:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch profile stats' 
    }, { status: 500 });
  }
}

async function generateUserStats(user) {
  const stats = {
    tasksCompleted: 0,
    tasksInProgress: 0,
    totalTasks: 0,
    commitCount: 0,
    currentStreak: 0,
    longestStreak: 0,
    attendanceRate: 0,
    totalAttendance: 0,
    presentDays: 0,
    averageTaskCompletion: 0,
    repositoriesContributed: 0,
    mergeRequestsCreated: 0,
    codeReviewsGiven: 0,
    pointsEarned: 0
  };

  try {
    const { getDatabase } = require('../../../../utils/database');
    const db = await getDatabase();

    // Task statistics
    const taskQuery = {
      $or: [
        { assignedTo: user._id },
        { 'submissions.internId': user._id }
      ]
    };

    const [completedTasks, inProgressTasks, totalTasks] = await Promise.all([
      Task.countDocuments({ ...taskQuery, status: 'completed' }),
      Task.countDocuments({ ...taskQuery, status: 'in_progress' }),
      Task.countDocuments(taskQuery)
    ]);

    stats.tasksCompleted = completedTasks;
    stats.tasksInProgress = inProgressTasks;
    stats.totalTasks = totalTasks;
    stats.averageTaskCompletion = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // GitLab/Commit statistics
    if (user.gitlabIntegration?.connected) {
      const commitRecords = await db.collection('activityrecords').find({
        userId: user._id,
        type: 'commit'
      }).toArray();

      stats.commitCount = commitRecords.length;

      // Calculate commit streak
      const streakData = calculateCommitStreak(commitRecords);
      stats.currentStreak = streakData.current;
      stats.longestStreak = streakData.longest;

      // Repository statistics
      const uniqueRepos = new Set(commitRecords.map(record => record.repositoryName));
      stats.repositoriesContributed = uniqueRepos.size;

      // Merge request statistics (if available)
      const mrRecords = await db.collection('activityrecords').find({
        userId: user._id,
        type: 'merge_request'
      }).toArray();
      stats.mergeRequestsCreated = mrRecords.length;
    }

    // Attendance statistics
    const attendanceRecords = await db.collection('attendancerecords').find({
      userId: user._id
    }).toArray();

    if (attendanceRecords.length > 0) {
      const presentRecords = attendanceRecords.filter(record => record.status === 'present');
      stats.totalAttendance = attendanceRecords.length;
      stats.presentDays = presentRecords.length;
      stats.attendanceRate = Math.round((presentRecords.length / attendanceRecords.length) * 100);
    }

    // Points calculation (based on activities)
    stats.pointsEarned = calculatePoints({
      tasksCompleted: stats.tasksCompleted,
      commitCount: stats.commitCount,
      attendanceRate: stats.attendanceRate,
      mergeRequestsCreated: stats.mergeRequestsCreated
    });

    // Additional role-specific stats
    if (user.role === 'mentor' || user.role === 'super-mentor') {
      // Count mentees or managed interns
      const mentees = await User.countDocuments({
        assignedMentor: user._id
      });
      stats.menteesManaged = mentees;

      // Count tasks created
      const tasksCreated = await Task.countDocuments({
        createdBy: user._id
      });
      stats.tasksCreated = tasksCreated;
    }

    if (user.role === 'admin') {
      // Admin-specific stats
      const totalUsers = await User.countDocuments({ isActive: true });
      const totalActiveTasks = await Task.countDocuments({ status: 'active' });
      
      stats.totalUsersManaged = totalUsers;
      stats.totalActiveTasksOverseeing = totalActiveTasks;
    }

    return stats;

  } catch (error) {
    console.error('Error generating user stats:', error);
    return stats; // Return default stats on error
  }
}

function calculateCommitStreak(commitRecords) {
  if (commitRecords.length === 0) {
    return { current: 0, longest: 0 };
  }

  // Sort commits by date
  const sortedCommits = commitRecords
    .map(record => new Date(record.timestamp || record.createdAt))
    .sort((a, b) => b - a);

  // Group commits by day
  const commitDays = new Set();
  sortedCommits.forEach(date => {
    const dayKey = date.toISOString().split('T')[0];
    commitDays.add(dayKey);
  });

  const uniqueDays = Array.from(commitDays).sort().reverse();
  
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Calculate current streak
  for (let i = 0; i < uniqueDays.length; i++) {
    const commitDate = new Date(uniqueDays[i]);
    const daysDiff = Math.floor((today - commitDate) / (1000 * 60 * 60 * 24));
    
    if (i === 0 && daysDiff <= 1) {
      // Started streak (today or yesterday)
      currentStreak = 1;
      tempStreak = 1;
    } else if (i > 0) {
      const prevDate = new Date(uniqueDays[i - 1]);
      const daysBetween = Math.floor((prevDate - commitDate) / (1000 * 60 * 60 * 24));
      
      if (daysBetween === 1) {
        // Consecutive day
        if (currentStreak > 0) currentStreak++;
        tempStreak++;
      } else {
        // Streak broken
        longestStreak = Math.max(longestStreak, tempStreak);
        if (currentStreak > 0) currentStreak = 0;
        tempStreak = 1;
      }
    }
  }
  
  longestStreak = Math.max(longestStreak, tempStreak, currentStreak);
  
  return { current: currentStreak, longest: longestStreak };
}

function calculatePoints(activities) {
  let points = 0;
  
  // Points for tasks
  points += activities.tasksCompleted * 10;
  
  // Points for commits
  points += Math.min(activities.commitCount * 2, 200); // Max 200 points from commits
  
  // Points for attendance
  if (activities.attendanceRate >= 90) points += 50;
  else if (activities.attendanceRate >= 80) points += 30;
  else if (activities.attendanceRate >= 70) points += 15;
  
  // Points for merge requests
  points += activities.mergeRequestsCreated * 15;
  
  return points;
}