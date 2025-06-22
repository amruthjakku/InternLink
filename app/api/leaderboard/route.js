import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { connectToDatabase, getUsersByRole } from '../../../utils/database';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'all-time';
    const metric = searchParams.get('metric') || 'completion-rate';

    await connectToDatabase();

    // Get all interns
    const interns = await getUsersByRole('intern');
    
    // Calculate leaderboard data based on real user data
    const leaderboard = await Promise.all(interns.map(async (intern, index) => {
      // In a real implementation, you would calculate these metrics from actual data
      // For now, we'll return basic user info with placeholder metrics
      return {
        id: intern._id,
        name: intern.name,
        college: intern.college || 'Unknown College',
        avatar: intern.name ? intern.name.charAt(0).toUpperCase() : 'U',
        tasksCompleted: 0, // Would be calculated from tasks collection
        totalTasks: 0, // Would be calculated from tasks collection
        completionRate: 0, // Would be calculated from tasks
        streakDays: 0, // Would be calculated from attendance
        totalHours: 0, // Would be calculated from attendance
        rank: index + 1,
        isCurrentUser: intern._id.toString() === session.user.id
      };
    }));

    // Sort by the selected metric
    leaderboard.sort((a, b) => {
      switch (metric) {
        case 'tasks-completed':
          return b.tasksCompleted - a.tasksCompleted;
        case 'hours-worked':
          return b.totalHours - a.totalHours;
        case 'streak-days':
          return b.streakDays - a.streakDays;
        default: // completion-rate
          return b.completionRate - a.completionRate;
      }
    });

    // Update ranks after sorting
    leaderboard.forEach((intern, index) => {
      intern.rank = index + 1;
    });

    return NextResponse.json({ leaderboard });

  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch leaderboard' 
    }, { status: 500 });
  }
}