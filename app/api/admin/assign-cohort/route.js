import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../utils/database';
import User from '../../../../models/User';
import Cohort from '../../../../models/Cohort';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { userId, cohortId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get the user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (cohortId) {
      // Validate cohort exists
      const cohort = await Cohort.findById(cohortId);
      if (!cohort) {
        return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });
      }

      // Assign user to cohort
      await user.assignToCohort(cohortId, session.user.username);
      
      return NextResponse.json({ 
        message: `User ${user.name} assigned to cohort ${cohort.name}`,
        user: {
          id: user._id,
          name: user.name,
          cohortId: cohortId,
          cohortName: cohort.name
        }
      });
    } else {
      // Remove user from cohort
      await user.removeFromCohort(session.user.username);
      
      return NextResponse.json({ 
        message: `User ${user.name} removed from cohort`,
        user: {
          id: user._id,
          name: user.name,
          cohortId: null,
          cohortName: null
        }
      });
    }

  } catch (error) {
    console.error('Error assigning cohort:', error);
    return NextResponse.json({ 
      error: 'Failed to assign cohort',
      details: error.message 
    }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Get all users without cohort assignments
    const usersWithoutCohorts = await User.find({ 
      cohortId: { $exists: false },
      role: 'AI Developer Intern'
    }).select('name email role');

    // Get all available cohorts
    const cohorts = await Cohort.find({ isActive: true })
      .select('name startDate endDate memberCount maxMembers');

    return NextResponse.json({
      usersWithoutCohorts,
      availableCohorts: cohorts
    });

  } catch (error) {
    console.error('Error fetching cohort assignment data:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch data',
      details: error.message 
    }, { status: 500 });
  }
}