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

    const { internId, cohortId } = await request.json();

    if (!internId || !cohortId) {
      return NextResponse.json({ 
        error: 'Intern ID and Cohort ID are required' 
      }, { status: 400 });
    }

    const db = await getDatabase();

    // Check if cohort exists and has space
    const cohort = await db.collection('cohorts').findOne({ 
      _id: new ObjectId(cohortId),
      isActive: true 
    });

    if (!cohort) {
      return NextResponse.json({ 
        error: 'Cohort not found' 
      }, { status: 404 });
    }

    // Check current intern count
    const currentInterns = await db.collection('users').countDocuments({
      cohortId: cohortId,
      role: 'intern',
      isActive: true
    });

    if (currentInterns >= cohort.maxInterns) {
      return NextResponse.json({ 
        error: 'Cohort is at maximum capacity' 
      }, { status: 400 });
    }

    // Update intern with cohort assignment
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(internId) },
      { 
        $set: { 
          cohortId: cohortId,
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ 
        error: 'Intern not found' 
      }, { status: 404 });
    }

    // Update cohort's current intern count
    await db.collection('cohorts').updateOne(
      { _id: new ObjectId(cohortId) },
      { 
        $set: { 
          currentInterns: currentInterns + 1,
          updatedAt: new Date()
        }
      }
    );

    return NextResponse.json({ 
      success: true,
      message: 'Intern assigned to cohort successfully'
    });

  } catch (error) {
    console.error('Error assigning intern to cohort:', error);
    return NextResponse.json({ 
      error: 'Failed to assign intern to cohort' 
    }, { status: 500 });
  }
}