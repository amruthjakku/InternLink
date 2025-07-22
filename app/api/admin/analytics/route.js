import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../utils/database';
import User from '../../../../models/User';
import Task from '../../../../models/Task';
import College from '../../../../models/College';
import { subDays, format, startOfDay, endOfDay } from 'date-fns';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '30'; // days
    const startDate = subDays(new Date(), parseInt(timeRange));

    // Get all users with their colleges
    const users = await User.find({})
      .populate('college', 'name')
      .select('name email role college isActive createdAt lastLoginAt');
      
    // Debug: Check user-college associations
    console.log('=== USER-COLLEGE DEBUG ===');
    console.log('Total users:', users.length);
    console.log('Users by role:', {
      intern: users.filter(u => u.role === 'AI developer Intern').length,
      mentor: users.filter(u => u.role === 'Tech Lead').length,
      'POC': users.filter(u => u.role === 'POC').length,
      admin: users.filter(u => u.role === 'admin').length
    });
    console.log('Interns with colleges:', users.filter(u => u.role === 'AI developer Intern' && u.college).length);
    console.log('Sample intern data:', users.filter(u => u.role === 'AI developer Intern').slice(0, 3).map(u => ({
      name: u.name,
      college: u.college ? { id: u.college._id ? u.college._id.toString() : 'no-id', name: u.college.name } : null
    })));

    // Get all tasks
    const tasks = await Task.find({})
      .populate('assignedTo', 'name role college')
      .populate('createdBy', 'name role')
      .select('title status priority category assignedTo createdBy createdByRole dueDate createdAt updatedAt progress');

    // Get all colleges with error handling
    let colleges = [];
    try {
      colleges = await College.find({})
        .select('name description location');
    } catch (error) {
      console.error('Error fetching colleges:', error);
      colleges = []; // Continue with empty array if college fetch fails
    }
      
    console.log('=== COLLEGE DEBUG ===');
    console.log('Total colleges:', colleges.length);
    console.log('College IDs and names:', colleges.map(c => ({ id: c._id ? c._id.toString() : 'no-id', name: c.name })));
    
    // Filter out colleges without valid IDs to prevent errors
    const validColleges = colleges.filter(c => c._id);
    console.log('Valid colleges (with IDs):', validColleges.length);

    // Calculate user metrics
    const userMetrics = {
      total: users.length,
      active: users.filter(u => u.isActive).length,
      byRole: {
        admin: users.filter(u => u.role === 'admin').length,
        'POC': users.filter(u => u.role === 'POC').length,
        mentor: users.filter(u => u.role === 'Tech Lead').length,
        intern: users.filter(u => u.role === 'AI developer Intern').length
      },
      recentSignups: users.filter(u => u.createdAt && new Date(u.createdAt) >= startDate).length,
      activeInPeriod: users.filter(u => u.lastLoginAt && new Date(u.lastLoginAt) >= startDate).length
    };

    // Calculate task metrics
    const taskMetrics = {
      total: tasks.length,
      completed: tasks.filter(t => t.status === 'completed' || t.status === 'done').length,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
      notStarted: tasks.filter(t => t.status === 'not_started').length,
      overdue: tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && !['completed', 'done'].includes(t.status)).length,
      byPriority: {
        high: tasks.filter(t => t.priority === 'high').length,
        medium: tasks.filter(t => t.priority === 'medium').length,
        low: tasks.filter(t => t.priority === 'low').length
      },
      byCreator: {
        admin: tasks.filter(t => t.createdByRole === 'admin').length,
        'POC': tasks.filter(t => t.createdByRole === 'POC').length,
        mentor: tasks.filter(t => t.createdByRole === 'Tech Lead').length
      },
      avgProgress: tasks.length > 0 ? Math.round(tasks.reduce((sum, t) => sum + (t.progress || 0), 0) / tasks.length) : 0,
      recentTasks: tasks.filter(t => t.createdAt && new Date(t.createdAt) >= startDate).length
    };

    // Calculate college metrics with better error handling
    let collegeMetrics;
    try {
      // Helper function to safely compare college IDs
      const isUserInCollege = (user, collegeId) => {
        try {
          const result = user && 
                 user.college && 
                 user.college._id && 
                 collegeId && 
                 user.college._id.toString() === collegeId.toString();
          
          // Debug the first few comparisons
          if (user && user.role === 'AI developer Intern') {
            console.log(`Checking user "${user.name}":`, {
              hasCollege: !!user.college,
              userCollegeId: user.college?._id?.toString(),
              targetCollegeId: collegeId?.toString(),
              match: result
            });
          }
          
          return result;
        } catch (err) {
          console.warn('Error comparing college IDs:', err);
          return false;
        }
      };

      collegeMetrics = {
        total: validColleges.length,
        withUsers: validColleges.filter(college => {
          try {
            return college._id && users.some(user => isUserInCollege(user, college._id));
          } catch (err) {
            console.warn('Error filtering colleges with users:', err);
            return false;
          }
        }).length,
        userDistribution: validColleges.map(college => {
          try {
            const collegeId = college._id;
            const collegeName = college.name || 'Unknown College';
            
            if (!collegeId) {
              return {
                name: collegeName,
                users: 0,
                interns: 0,
                mentors: 0,
                superMentors: 0
              };
            }

            const collegeUsers = users.filter(user => isUserInCollege(user, collegeId));
            
            return {
              name: collegeName,
              users: collegeUsers.length,
              interns: collegeUsers.filter(u => u.role === 'AI developer Intern').length,
              mentors: collegeUsers.filter(u => u.role === 'Tech Lead').length,
              superMentors: collegeUsers.filter(u => u.role === 'POC').length
            };
          } catch (err) {
            console.warn('Error processing college distribution:', err);
            return {
              name: college.name || 'Unknown College',
              users: 0,
              interns: 0,
              mentors: 0,
              superMentors: 0
            };
          }
        })
      };
    } catch (error) {
      console.error('Error calculating college metrics:', error);
      // Fallback college metrics
      collegeMetrics = {
        total: validColleges.length,
        withUsers: 0,
        userDistribution: validColleges.map(college => ({
          name: college.name || 'Unknown College',
          users: 0,
          interns: 0,
          mentors: 0,
          superMentors: 0
        }))
      };
    }

    // Calculate performance metrics
    const performanceMetrics = {
      taskCompletionRate: taskMetrics.total > 0 ? Math.round((taskMetrics.completed / taskMetrics.total) * 100) : 0,
      userEngagement: userMetrics.total > 0 ? Math.round((userMetrics.activeInPeriod / userMetrics.total) * 100) : 0,
      overdueRate: taskMetrics.total > 0 ? Math.round((taskMetrics.overdue / taskMetrics.total) * 100) : 0,
      growthRate: calculateGrowthRate(users, startDate)
    };

    // Generate time series data for charts
    let timeSeriesData;
    try {
      timeSeriesData = generateTimeSeriesData(users, tasks, startDate, parseInt(timeRange));
    } catch (error) {
      console.error('Error generating time series data:', error);
      // Fallback time series data
      timeSeriesData = [];
      for (let i = parseInt(timeRange) - 1; i >= 0; i--) {
        timeSeriesData.push({
          date: format(subDays(new Date(), i), 'yyyy-MM-dd'),
          newUsers: 0,
          tasksCreated: 0,
          tasksCompleted: 0,
          activeUsers: 0
        });
      }
    }

    // Calculate system health metrics
    const systemHealth = {
      activeUsers: userMetrics.activeInPeriod,
      taskBacklog: taskMetrics.notStarted + taskMetrics.inProgress,
      completionTrend: calculateCompletionTrend(tasks, startDate),
      userSatisfaction: 85 // This would come from surveys/feedback in real implementation
    };

    return NextResponse.json({
      userMetrics,
      taskMetrics,
      collegeMetrics,
      performanceMetrics,
      timeSeriesData,
      systemHealth,
      generatedAt: new Date().toISOString(),
      timeRange: parseInt(timeRange)
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json({ 
      error: 'Failed to fetch analytics data',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

function calculateGrowthRate(users, startDate) {
  const recentUsers = users.filter(u => u.createdAt && new Date(u.createdAt) >= startDate).length;
  const totalUsers = users.length;
  const previousPeriodUsers = totalUsers - recentUsers;
  
  if (previousPeriodUsers === 0) return 100;
  return Math.round((recentUsers / previousPeriodUsers) * 100);
}

function generateTimeSeriesData(users, tasks, startDate, days) {
  const dates = [];
  for (let i = days - 1; i >= 0; i--) {
    dates.push(subDays(new Date(), i));
  }

  return dates.map(date => {
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    return {
      date: format(date, 'yyyy-MM-dd'),
      newUsers: users.filter(u => {
        if (!u.createdAt) return false;
        const createdAt = new Date(u.createdAt);
        return createdAt >= dayStart && createdAt <= dayEnd;
      }).length,
      tasksCreated: tasks.filter(t => {
        if (!t.createdAt) return false;
        const createdAt = new Date(t.createdAt);
        return createdAt >= dayStart && createdAt <= dayEnd;
      }).length,
      tasksCompleted: tasks.filter(t => {
        if (!t.updatedAt) return false;
        const updatedAt = new Date(t.updatedAt);
        return updatedAt >= dayStart && updatedAt <= dayEnd && ['completed', 'done'].includes(t.status);
      }).length,
      activeUsers: users.filter(u => {
        if (!u.lastLoginAt) return false;
        const lastLogin = new Date(u.lastLoginAt);
        return lastLogin >= dayStart && lastLogin <= dayEnd;
      }).length
    };
  });
}

function calculateCompletionTrend(tasks, startDate) {
  const recentTasks = tasks.filter(t => t.createdAt && new Date(t.createdAt) >= startDate);
  const completedRecent = recentTasks.filter(t => ['completed', 'done'].includes(t.status)).length;
  
  if (recentTasks.length === 0) return 0;
  return Math.round((completedRecent / recentTasks.length) * 100);
}