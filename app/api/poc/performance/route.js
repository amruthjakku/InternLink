import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../lib/mongoose';
import User from '../../../../models/User';
import Task from '../../../../models/Task';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'POC') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Get POC's college
    const poc = await User.findById(session.user.id).populate('college');
    if (!poc || !poc.college) {
      return NextResponse.json({ error: 'POC college not found' }, { status: 404 });
    }

    // Get all interns from the same college
    const collegeInterns = await User.find({
      college: poc.college._id,
      role: 'AIDeveloperIntern'
    });

    // Get tasks for these interns
    const internIds = collegeInterns.map(intern => intern._id);
    const tasks = await Task.find({
      assignedTo: { $in: internIds }
    });

    // Calculate performance metrics
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    const totalTasks = tasks.length;
    const averageScore = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    // Count top performers (those with >80% completion rate)
    let topPerformers = 0;
    for (const intern of collegeInterns) {
      const internTasks = tasks.filter(task => task.assignedTo.toString() === intern._id.toString());
      const internCompleted = internTasks.filter(task => task.status === 'completed').length;
      const internTotal = internTasks.length;
      
      if (internTotal > 0 && (internCompleted / internTotal) > 0.8) {
        topPerformers++;
      }
    }

    const performanceData = {
      averageScore,
      completedTasks,
      totalTasks,
      topPerformers,
      collegeInterns: collegeInterns.length,
      trends: {
        // Mock data for now - can be enhanced with real historical data
        weekly: [65, 70, 75, 80, averageScore],
        monthly: [60, 65, 70, averageScore]
      }
    };

    return NextResponse.json(performanceData);

  } catch (error) {
    console.error('Error fetching performance data:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch performance data',
      details: error.message 
    }, { status: 500 });
  }
}