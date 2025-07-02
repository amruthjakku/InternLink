import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase, getDatabase } from '../../../../utils/database';
import { ObjectId } from 'mongodb';
import User from '../../../../models/User';
import Task from '../../../../models/Task';
import Attendance from '../../../../models/Attendance';

/**
 * User Progress API - Secure user-isolated progress tracking
 * Each user can only access and modify their own progress data
 */

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const db = await getDatabase();

    // Get current user - only allow access to their own data
    const currentUser = await User.findById(session.user.id);
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'all-time';

    // Build date filter based on period
    let dateFilter = {};
    const now = new Date();
    
    if (period === 'this-week') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      dateFilter = { createdAt: { $gte: startOfWeek } };
    } else if (period === 'this-month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      dateFilter = { createdAt: { $gte: startOfMonth } };
    }

    // Get user's tasks - ONLY their own tasks
    const userId = currentUser._id.toString();
    const taskQuery = { 
      $or: [
        { assignedTo: userId },
        { assignedTo: currentUser._id }
      ],
      ...dateFilter
    };

    const allTasks = await db.collection('tasks').find(taskQuery).toArray();
    
    // Calculate user's personal progress metrics
    const completedTasks = allTasks.filter(task => 
      task.status === 'completed' || 
      task.status === 'done' || 
      task.status === 'approved' ||
      (task.status === 'review' && task.progress >= 90)
    );

    const totalTasks = allTasks.length;
    const tasksCompleted = completedTasks.length;
    const completionRate = totalTasks > 0 ? Math.round((tasksCompleted / totalTasks) * 100) : 0;

    // Calculate points earned - only from user's own completed tasks
    const pointsEarned = completedTasks.reduce((total, task) => {
      const taskPoints = task.points || 10;
      return total + taskPoints;
    }, 0);

    // Get user's attendance data - ONLY their own
    let attendanceQuery = { userId: userId };
    
    if (period === 'this-week') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      attendanceQuery.date = { $gte: startOfWeek };
    } else if (period === 'this-month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      attendanceQuery.date = { $gte: startOfMonth };
    } else {
      // For all-time, limit to last 90 days for performance
      attendanceQuery.date = { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) };
    }

    const attendanceRecords = await Attendance.find(attendanceQuery).sort({ date: -1 });

    // Calculate total hours worked - only user's own hours
    const totalHours = attendanceRecords.reduce((sum, record) => {
      if (record.checkOut && record.checkIn) {
        const hours = (new Date(record.checkOut) - new Date(record.checkIn)) / (1000 * 60 * 60);
        return sum + Math.max(0, hours);
      }
      return sum;
    }, 0);

    // Calculate streak days - only user's own streak
    let streakDays = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      
      const hasAttendance = attendanceRecords.some(record => {
        const recordDate = new Date(record.date);
        recordDate.setHours(0, 0, 0, 0);
        return recordDate.getTime() === checkDate.getTime() && record.checkIn;
      });
      
      if (hasAttendance) {
        streakDays++;
      } else if (i > 0) {
        break;
      }
    }

    // Calculate weekly progress breakdown
    const weeklyProgress = {};
    if (allTasks.length > 0) {
      allTasks.forEach(task => {
        if (task.weekNumber) {
          if (!weeklyProgress[task.weekNumber]) {
            weeklyProgress[task.weekNumber] = {
              total: 0,
              completed: 0,
              inProgress: 0,
              notStarted: 0
            };
          }
          
          weeklyProgress[task.weekNumber].total++;
          
          if (task.status === 'completed' || task.status === 'done') {
            weeklyProgress[task.weekNumber].completed++;
          } else if (task.status === 'in_progress' || task.status === 'review') {
            weeklyProgress[task.weekNumber].inProgress++;
          } else {
            weeklyProgress[task.weekNumber].notStarted++;
          }
        }
      });
    }

    // Build comprehensive progress response - ALL USER'S OWN DATA
    const progressData = {
      user: {
        id: currentUser._id,
        name: currentUser.name,
        email: currentUser.email,
        college: currentUser.college,
        cohortId: currentUser.cohortId,
        cohortName: currentUser.cohortName
      },
      period: period,
      metrics: {
        totalTasks: totalTasks,
        tasksCompleted: tasksCompleted,
        completionRate: completionRate,
        pointsEarned: pointsEarned,
        totalHours: Math.round(totalHours * 10) / 10,
        streakDays: streakDays
      },
      weeklyProgress: weeklyProgress,
      taskBreakdown: {
        completed: completedTasks.length,
        inProgress: allTasks.filter(t => t.status === 'in_progress' || t.status === 'review').length,
        notStarted: allTasks.filter(t => t.status === 'not_started' || !t.status).length
      },
      recentTasks: allTasks
        .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
        .slice(0, 5)
        .map(task => ({
          id: task._id,
          title: task.title,
          status: task.status,
          progress: task.progress || 0,
          points: task.points || 10,
          updatedAt: task.updatedAt || task.createdAt
        }))
    };

    return NextResponse.json({
      success: true,
      data: progressData
    });

  } catch (error) {
    console.error('Error fetching user progress:', error);
    return NextResponse.json({
      error: 'Failed to fetch user progress',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * Update user progress - users can only update their own progress
 */
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taskId, status, progress, notes } = await request.json();

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    await connectToDatabase();
    const db = await getDatabase();

    // Get current user
    const currentUser = await User.findById(session.user.id);
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userId = currentUser._id.toString();

    // Verify the task belongs to the current user - SECURITY CHECK
    const task = await db.collection('tasks').findOne({
      _id: new ObjectId(taskId),
      $or: [
        { assignedTo: userId },
        { assignedTo: currentUser._id }
      ]
    });

    if (!task) {
      return NextResponse.json({ 
        error: 'Task not found or not authorized to update' 
      }, { status: 403 });
    }

    // Update task with user's progress
    const updateData = {
      updatedAt: new Date()
    };

    if (status) updateData.status = status;
    if (progress !== undefined) updateData.progress = Math.max(0, Math.min(100, progress));
    if (notes) updateData.notes = notes;

    const result = await db.collection('tasks').updateOne(
      { _id: new ObjectId(taskId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Progress updated successfully',
      data: updateData
    });

  } catch (error) {
    console.error('Error updating user progress:', error);
    return NextResponse.json({
      error: 'Failed to update progress',
      details: error.message
    }, { status: 500 });
  }
}