import { NextResponse } from 'next/server';
import { getDatabase } from '../../../../utils/database';

export async function GET(request) {
  try {
    const db = await getDatabase();
    
    // Get all cohorts directly from database
    const cohorts = await db.collection('cohorts').find({}).toArray();
    
    console.log('TEST API - Raw cohorts from database:', cohorts);
    
    // Format cohorts for frontend
    const formattedCohorts = cohorts.map(cohort => ({
      id: cohort._id,
      _id: cohort._id,
      name: cohort.name,
      description: cohort.description,
      isActive: cohort.isActive,
      memberCount: cohort.memberCount || 0,
      maxMembers: cohort.maxMembers || 100,
      startDate: cohort.startDate,
      endDate: cohort.endDate,
      createdAt: cohort.createdAt
    }));
    
    console.log('TEST API - Formatted cohorts:', formattedCohorts);
    
    return NextResponse.json({
      success: true,
      count: cohorts.length,
      cohorts: formattedCohorts,
      rawCohorts: cohorts
    });

  } catch (error) {
    console.error('TEST API - Error fetching cohorts:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch cohorts',
      details: error.message 
    }, { status: 500 });
  }
}