import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase, getDatabase } from '../../../../utils/database';
import User from '../../../../models/User';
import Task from '../../../../models/Task';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const db = await getDatabase();

    // Get all users with their cohort assignments
    const users = await User.find({})
      .populate('cohortId', 'name startDate endDate')
      .populate('college', 'name')
      .select('name email role cohortId college');

    // Get all cohorts
    const cohorts = await db.collection('cohorts').find({}).toArray();

    // Get all tasks
    const tasks = await Task.find({})
      .populate('cohortId', 'name')
      .select('title assignmentType cohortId assignedTo');

    // Analyze the data
    const analysis = {
      totalUsers: users.length,
      usersByRole: {},
      usersWithCohorts: 0,
      usersWithoutCohorts: 0,
      totalCohorts: cohorts.length,
      totalTasks: tasks.length,
      tasksByType: {},
      cohortTasks: 0,
      individualTasks: 0,
      userDetails: [],
      cohortDetails: cohorts.map(c => ({
        id: c._id,
        name: c.name,
        startDate: c.startDate,
        endDate: c.endDate,
        isActive: c.isActive
      })),
      taskDetails: []
    };

    // Analyze users
    users.forEach(user => {
      // Count by role
      analysis.usersByRole[user.role] = (analysis.usersByRole[user.role] || 0) + 1;
      
      // Count cohort assignments
      if (user.cohortId) {
        analysis.usersWithCohorts++;
      } else {
        analysis.usersWithoutCohorts++;
      }

      // Add user details
      analysis.userDetails.push({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        cohortId: user.cohortId?._id,
        cohortName: user.cohortId?.name,
        collegeName: user.college?.name,
        hasCollegeAssignment: !!user.college,
        hasCohortAssignment: !!user.cohortId
      });
    });

    // Analyze tasks
    tasks.forEach(task => {
      // Count by assignment type
      analysis.tasksByType[task.assignmentType] = (analysis.tasksByType[task.assignmentType] || 0) + 1;
      
      if (task.assignmentType === 'cohort') {
        analysis.cohortTasks++;
      } else {
        analysis.individualTasks++;
      }

      // Add task details
      analysis.taskDetails.push({
        id: task._id,
        title: task.title,
        assignmentType: task.assignmentType,
        cohortId: task.cohortId?._id,
        cohortName: task.cohortId?.name,
        assignedTo: task.assignedTo
      });
    });

    return NextResponse.json(analysis);

  } catch (error) {
    console.error('Error in cohort assignments debug:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch debug data',
      details: error.message 
    }, { status: 500 });
  }
}