import { connectToDatabase } from '../../../utils/database.js';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session || session.user.role !== 'POC') {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { db } = await connectToDatabase();
    
    // Get POC's college information
    const pocUser = await db.collection('users').findOne({
      $or: [
        { gitlabUsername: session.user.gitlabUsername },
        { email: session.user.email }
      ]
    });

    if (!pocUser || !pocUser.college) {
      return res.status(404).json({ message: 'POC college information not found' });
    }

    // Get college identifier
    const collegeId = typeof pocUser.college === 'string' ? pocUser.college : pocUser.college._id || pocUser.college.name;

    // Get all users from the same college
    const users = await db.collection('users').find({
      $or: [
        { college: collegeId },
        { 'college.name': collegeId },
        { 'college._id': collegeId }
      ]
    }).toArray();

    const userIds = users.map(user => user._id);

    // Get tasks for college users
    const tasks = await db.collection('tasks').find({
      $or: [
        { assignedTo: { $in: userIds } },
        { createdBy: { $in: userIds } },
        { college: collegeId }
      ]
    }).toArray();

    // Get GitLab activity (if available)
    const gitlabActivity = await db.collection('gitlab_activity').find({
      userId: { $in: userIds }
    }).sort({ date: -1 }).limit(1000).toArray();

    // Calculate performance metrics for each user
    const userPerformance = users.map(user => {
      const userTasks = tasks.filter(task => 
        task.assignedTo?.toString() === user._id.toString()
      );
      
      const completedTasks = userTasks.filter(task => task.status === 'done' || task.status === 'completed');
      const inProgressTasks = userTasks.filter(task => task.status === 'in_progress');
      const overdueTasks = userTasks.filter(task => {
        const dueDate = new Date(task.dueDate);
        const now = new Date();
        return task.status !== 'done' && task.status !== 'completed' && dueDate < now;
      });

      const userGitlabActivity = gitlabActivity.filter(activity => 
        activity.userId?.toString() === user._id.toString()
      );

      const totalCommits = userGitlabActivity.reduce((sum, activity) => 
        sum + (activity.commits || 0), 0
      );

      const completionRate = userTasks.length > 0 
        ? Math.round((completedTasks.length / userTasks.length) * 100)
        : 0;

      return {
        userId: user._id,
        name: user.name,
        email: user.email,
        gitlabUsername: user.gitlabUsername,
        role: user.role,
        tasksAssigned: userTasks.length,
        tasksCompleted: completedTasks.length,
        tasksInProgress: inProgressTasks.length,
        tasksOverdue: overdueTasks.length,
        completionRate,
        totalCommits,
        lastActivity: userGitlabActivity.length > 0 ? userGitlabActivity[0].date : null,
        performanceScore: Math.round((completionRate * 0.6) + (Math.min(totalCommits / 10, 40) * 0.4))
      };
    });

    // Calculate overall college performance
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'done' || task.status === 'completed').length;
    const totalCommits = gitlabActivity.reduce((sum, activity) => sum + (activity.commits || 0), 0);

    const overallStats = {
      totalUsers: users.length,
      totalTasks,
      completedTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      totalCommits,
      averagePerformanceScore: userPerformance.length > 0 
        ? Math.round(userPerformance.reduce((sum, user) => sum + user.performanceScore, 0) / userPerformance.length)
        : 0
    };

    // Generate trends data (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentTasks = tasks.filter(task => 
      new Date(task.createdAt) >= thirtyDaysAgo
    );

    const recentActivity = gitlabActivity.filter(activity => 
      new Date(activity.date) >= thirtyDaysAgo
    );

    const trends = {
      tasksCreated: recentTasks.length,
      tasksCompleted: recentTasks.filter(task => task.status === 'done' || task.status === 'completed').length,
      commitsThisMonth: recentActivity.reduce((sum, activity) => sum + (activity.commits || 0), 0),
      activeUsers: [...new Set(recentActivity.map(activity => activity.userId))].length
    };

    res.status(200).json({
      metrics: userPerformance,
      stats: overallStats,
      trends,
      college: pocUser.college
    });
  } catch (error) {
    console.error('Error fetching college performance:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}