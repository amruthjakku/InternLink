import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../utils/database';
import Task from '../../../../models/Task';
import { subDays, format, eachDayOfInterval } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const userId = session.user.id;
    const thirtyDaysAgo = subDays(new Date(), 30);

    // Get tasks for the last 30 days
    const tasks = await Task.find({
      assignedTo: userId,
      createdAt: { $gte: thirtyDaysAgo }
    }).sort({ createdAt: 1 });

    // Generate progress data for the last 30 days
    const days = eachDayOfInterval({
      start: thirtyDaysAgo,
      end: new Date()
    });

    const progress = days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayTasks = tasks.filter(task => 
        format(new Date(task.createdAt), 'yyyy-MM-dd') <= dayStr
      );
      
      const completedTasks = dayTasks.filter(task => 
        task.status === 'completed' && 
        format(new Date(task.updatedAt), 'yyyy-MM-dd') <= dayStr
      );

      return {
        date: dayStr,
        totalTasks: dayTasks.length,
        completedTasks: completedTasks.length,
        completionRate: dayTasks.length > 0 ? Math.round((completedTasks.length / dayTasks.length) * 100) : 0
      };
    });

    return NextResponse.json({ progress });

  } catch (error) {
    console.error('Error fetching progress data:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch progress data' 
    }, { status: 500 });
  }
}