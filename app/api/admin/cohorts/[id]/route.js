import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { getDatabase } from '../../../../../utils/database';
import { ObjectId } from 'mongodb';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid cohort ID' }, { status: 400 });
    }

    const db = await getDatabase();
    
    const cohort = await db.collection('cohorts').findOne({ 
      _id: new ObjectId(id),
      isActive: true 
    });

    if (!cohort) {
      return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true,
      cohort 
    });

  } catch (error) {
    console.error('Error fetching cohort:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch cohort' 
    }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid cohort ID' }, { status: 400 });
    }

    const data = await request.json();
    const { name, description, startDate, endDate, mentorId, maxAI Developer Interns } = data;

    if (!name || !startDate || !endDate || !maxAI Developer Interns) {
      return NextResponse.json({ 
        error: 'Name, start date, end date, and max interns are required' 
      }, { status: 400 });
    }

    const db = await getDatabase();

    const updateData = {
      name,
      description: description || '',
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      mentorId: mentorId || null,
      maxAI Developer Interns: parseInt(maxAI Developer Interns),
      updatedAt: new Date()
    };

    const result = await db.collection('cohorts').updateOne(
      { _id: new ObjectId(id), isActive: true },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Cohort updated successfully'
    });

  } catch (error) {
    console.error('Error updating cohort:', error);
    return NextResponse.json({ 
      error: 'Failed to update cohort' 
    }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid cohort ID' }, { status: 400 });
    }

    const db = await getDatabase();

    // Soft delete the cohort
    const result = await db.collection('cohorts').updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          isActive: false,
          deletedAt: new Date(),
          deletedBy: session.user.gitlabUsername
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });
    }

    // Remove cohort assignment from all users
    await db.collection('users').updateMany(
      { cohortId: id },
      { 
        $unset: { cohortId: "" },
        $set: { updatedAt: new Date() }
      }
    );

    return NextResponse.json({ 
      success: true,
      message: 'Cohort deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting cohort:', error);
    return NextResponse.json({ 
      error: 'Failed to delete cohort' 
    }, { status: 500 });
  }
}