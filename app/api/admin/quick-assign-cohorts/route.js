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

    // Get all interns without cohort assignments
    const internsWithoutCohorts = await User.find({ 
      role: 'AI Developer Intern',
      $or: [
        { cohortId: { $exists: false } },
        { cohortId: null }
      ]
    });
    
    if (internsWithoutCohorts.length === 0) {
      return NextResponse.json({ 
        message: 'All interns are already assigned to cohorts',
        assignedCount: 0
      });
    }
    
    // Get the first active cohort
    const activeCohort = await Cohort.findOne({ isActive: true });
    
    if (!activeCohort) {
      return NextResponse.json({ 
        error: 'No active cohorts found. Please create a cohort first.',
        internsWithoutCohorts: internsWithoutCohorts.length
      }, { status: 404 });
    }
    
    // Assign each intern to the cohort
    let assignedCount = 0;
    const results = [];
    
    for (const intern of internsWithoutCohorts) {
      try {
        await intern.assignToCohort(activeCohort._id, session.user.username || 'admin');
        results.push({
          success: true,
          intern: {
            id: intern._id,
            name: intern.name,
            email: intern.email
          },
          cohort: {
            id: activeCohort._id,
            name: activeCohort.name
          }
        });
        assignedCount++;
      } catch (error) {
        results.push({
          success: false,
          intern: {
            id: intern._id,
            name: intern.name,
            email: intern.email
          },
          error: error.message
        });
      }
    }
    
    return NextResponse.json({ 
      message: `Successfully assigned ${assignedCount} interns to cohort ${activeCohort.name}`,
      assignedCount,
      totalAIDeveloperInterns: internsWithoutCohorts.length,
      cohort: {
        id: activeCohort._id,
        name: activeCohort.name
      },
      results
    });

  } catch (error) {
    console.error('Error in quick assign cohorts:', error);
    return NextResponse.json({ 
      error: 'Failed to assign cohorts',
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

    // Get summary of cohort assignments
    const totalAIDeveloperInterns = await User.countDocuments({ role: 'AI Developer Intern' });
    const internsWithCohorts = await User.countDocuments({ 
      role: 'AI Developer Intern',
      cohortId: { $exists: true, $ne: null }
    });
    const internsWithoutCohorts = totalAIDeveloperInterns - internsWithCohorts;
    
    const activeCohorts = await Cohort.find({ isActive: true })
      .select('name memberCount maxMembers');
    
    return NextResponse.json({
      summary: {
        totalAIDeveloperInterns,
        internsWithCohorts,
        internsWithoutCohorts,
        activeCohorts: activeCohorts.length
      },
      activeCohorts,
      canAutoAssign: internsWithoutCohorts > 0 && activeCohorts.length > 0
    });

  } catch (error) {
    console.error('Error fetching cohort assignment summary:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch summary',
      details: error.message 
    }, { status: 500 });
  }
}