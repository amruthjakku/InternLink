import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { getDatabase } from '../../../../utils/database';
import { ObjectId } from 'mongodb';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDatabase();
    
    // First, count all cohorts to see if there are any
    const totalCohorts = await db.collection('cohorts').countDocuments();
    console.log(`Total cohorts in database: ${totalCohorts}`);
    
    // Get all cohorts, active or not
    const allCohorts = await db.collection('cohorts')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    
    console.log('All cohorts:', allCohorts.map(c => ({
      id: c._id,
      name: c.name,
      isActive: c.isActive
    })));
    
    // Get all cohorts for admin dashboard
    // We'll return all cohorts, not just active ones
    const cohorts = await db.collection('cohorts')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    
    console.log('Fetched cohorts:', cohorts.map(c => ({
      id: c._id,
      name: c.name,
      startDate: c.startDate,
      endDate: c.endDate,
      isActive: c.isActive
    })));

    console.log('Returning cohorts response:', { success: true, cohorts: cohorts.length });

    return NextResponse.json({ 
      success: true,
      cohorts 
    });

  } catch (error) {
    console.error('Error fetching cohorts:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch cohorts' 
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { name, description, startDate, endDate, mentorId, maxAIDeveloperInterns, createdBy } = data;

    if (!name || !startDate || !endDate || !maxAIDeveloperInterns) {
      return NextResponse.json({ 
        error: 'Name, start date, end date, and max interns are required' 
      }, { status: 400 });
    }

    const db = await getDatabase();

    const cohortData = {
      name,
      description: description || '',
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      mentorId: mentorId || null,
      maxAIDeveloperInterns: parseInt(maxAIDeveloperInterns),
      currentAIDeveloperInterns: 0,
      createdBy: createdBy || session.user.gitlabUsername,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    };

    const result = await db.collection('cohorts').insertOne(cohortData);

    return NextResponse.json({ 
      success: true,
      cohortId: result.insertedId,
      message: 'Cohort created successfully'
    });

  } catch (error) {
    console.error('Error creating cohort:', error);
    return NextResponse.json({ 
      error: 'Failed to create cohort' 
    }, { status: 500 });
  }
}