import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../utils/database';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user.role !== 'mentor' && session.user.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // In a real implementation, you would fetch cohorts from database
    // For now, return empty array
    const cohorts = [];

    return NextResponse.json({ cohorts });

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
    
    if (!session || (session.user.role !== 'mentor' && session.user.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, collegeId, startDate, endDate, description } = await request.json();

    if (!name || !collegeId) {
      return NextResponse.json({ error: 'Name and college ID are required' }, { status: 400 });
    }

    await connectToDatabase();

    const cohortData = {
      name,
      collegeId,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      description: description || '',
      createdBy: session.user.id,
      createdAt: new Date()
    };

    // In a real implementation, save to cohorts collection
    // const db = await getDatabase();
    // const result = await db.collection('cohorts').insertOne(cohortData);

    return NextResponse.json({ 
      success: true,
      message: 'Cohort created successfully' 
    });

  } catch (error) {
    console.error('Error creating cohort:', error);
    return NextResponse.json({ 
      error: 'Failed to create cohort' 
    }, { status: 500 });
  }
}