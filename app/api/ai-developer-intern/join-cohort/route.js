import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase, getDatabase } from '../../../../utils/database';
import User from '../../../../models/User';
import Cohort from '../../../../models/Cohort';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'AI developer Intern') {
      return NextResponse.json({ error: 'Unauthorized - Only AI developer interns can join cohorts' }, { status: 401 });
    }

    await connectToDatabase();

    const { cohortId } = await request.json();

    // Get the current user
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is already in a cohort
    if (user.cohortId) {
      const currentCohort = await Cohort.findById(user.cohortId);
      return NextResponse.json({ 
        error: `You are already assigned to cohort: ${currentCohort?.name || 'Unknown'}`,
        currentCohort: {
          id: user.cohortId,
          name: currentCohort?.name
        }
      }, { status: 400 });
    }

    let targetCohort;

    if (cohortId) {
      // Join specific cohort
      targetCohort = await Cohort.findById(cohortId);
      if (!targetCohort) {
        return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });
      }
      
      if (!targetCohort.isActive) {
        return NextResponse.json({ error: 'This cohort is not active' }, { status: 400 });
      }
    } else {
      // Auto-assign to first available active cohort
      targetCohort = await Cohort.findOne({ isActive: true });
      if (!targetCohort) {
        return NextResponse.json({ error: 'No active cohorts available' }, { status: 404 });
      }
    }

    // Assign user to cohort
    await user.assignToCohort(targetCohort._id, 'self-assignment');
    
    return NextResponse.json({ 
      message: `Successfully joined cohort: ${targetCohort.name}`,
      cohort: {
        id: targetCohort._id,
        name: targetCohort.name,
        startDate: targetCohort.startDate,
        endDate: targetCohort.endDate
      }
    });

  } catch (error) {
    console.error('Error joining cohort:', error);
    return NextResponse.json({ 
      error: 'Failed to join cohort',
      details: error.message 
    }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'AI developer Intern') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Get current user's cohort status
    const user = await User.findById(session.user.id).populate('cohortId', 'name startDate endDate');
    
    // Get all available active cohorts
    const availableCohorts = await Cohort.find({ isActive: true })
      .select('name description startDate endDate memberCount maxMembers');

    return NextResponse.json({
      currentCohort: user.cohortId ? {
        id: user.cohortId._id,
        name: user.cohortId.name,
        startDate: user.cohortId.startDate,
        endDate: user.cohortId.endDate
      } : null,
      availableCohorts,
      canJoinCohort: !user.cohortId
    });

  } catch (error) {
    console.error('Error fetching cohort info:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch cohort information',
      details: error.message 
    }, { status: 500 });
  }
}