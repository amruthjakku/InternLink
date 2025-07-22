import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { getDatabase } from '../../../../utils/database';
import { ObjectId } from 'mongodb';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDatabase();
    
    // Check if any cohorts exist
    const existingCohorts = await db.collection('cohorts').find({}).toArray();
    console.log('Existing cohorts:', existingCohorts.length);
    
    if (existingCohorts.length > 0) {
      return NextResponse.json({
        message: 'Cohorts already exist',
        cohorts: existingCohorts.map(c => ({
          id: c._id,
          name: c.name,
          isActive: c.isActive
        }))
      });
    }
    
    // Create a default cohort
    const defaultCohort = {
      name: 'Default Cohort',
      description: 'Default cohort for all interns',
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
      maxMembers: 100,
      memberCount: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: session.user.username || 'admin'
    };
    
    const result = await db.collection('cohorts').insertOne(defaultCohort);
    
    console.log('Created default cohort:', result.insertedId);
    
    return NextResponse.json({
      message: 'Default cohort created successfully',
      cohort: {
        id: result.insertedId,
        name: defaultCohort.name,
        isActive: defaultCohort.isActive
      }
    });

  } catch (error) {
    console.error('Error setting up cohorts:', error);
    return NextResponse.json({ 
      error: 'Failed to setup cohorts',
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

    const db = await getDatabase();
    
    // Get current state
    const cohorts = await db.collection('cohorts').find({}).toArray();
    const users = await db.collection('users').find({ role: 'AI Developer Intern' }).toArray();
    
    const internsWithCohorts = users.filter(u => u.cohortId).length;
    const internsWithoutCohorts = users.length - internsWithCohorts;
    
    return NextResponse.json({
      cohorts: cohorts.map(c => ({
        id: c._id,
        name: c.name,
        isActive: c.isActive,
        memberCount: c.memberCount || 0
      })),
      totalAIDeveloperInterns: users.length,
      internsWithCohorts,
      internsWithoutCohorts,
      needsSetup: cohorts.length === 0
    });

  } catch (error) {
    console.error('Error getting cohort setup status:', error);
    return NextResponse.json({ 
      error: 'Failed to get setup status',
      details: error.message 
    }, { status: 500 });
  }
}