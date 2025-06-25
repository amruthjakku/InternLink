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
    
    const cohorts = await db.collection('cohorts')
      .find({ isActive: true })
      .sort({ createdAt: -1 })
      .toArray();

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
    const { name, description, startDate, endDate, mentorId, maxInterns, createdBy } = data;

    if (!name || !startDate || !endDate || !maxInterns) {
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
      maxInterns: parseInt(maxInterns),
      currentInterns: 0,
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