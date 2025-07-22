import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { getDatabase } from '../../../../utils/database';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDatabase();
    
    // Get cohorts
    const cohorts = await db.collection('cohorts').find({}).toArray();
    
    // Get users
    const users = await db.collection('users').find({ role: 'AI Developer Intern' }).toArray();
    
    // Count assignments
    const internsWithCohorts = users.filter(u => u.cohortId).length;
    const internsWithoutCohorts = users.length - internsWithCohorts;
    
    const status = {
      cohorts: {
        total: cohorts.length,
        active: cohorts.filter(c => c.isActive).length,
        list: cohorts.map(c => ({
          id: c._id,
          name: c.name,
          isActive: c.isActive,
          memberCount: c.memberCount || 0
        }))
      },
      interns: {
        total: users.length,
        withCohorts: internsWithCohorts,
        withoutCohorts: internsWithoutCohorts,
        unassignedList: users
          .filter(u => !u.cohortId)
          .map(u => ({
            id: u._id,
            name: u.name,
            email: u.email
          }))
      },
      needsFix: cohorts.length === 0 || internsWithoutCohorts > 0
    };
    
    return NextResponse.json(status);

  } catch (error) {
    console.error('Error checking cohort status:', error);
    return NextResponse.json({ 
      error: 'Failed to check status',
      details: error.message 
    }, { status: 500 });
  }
}