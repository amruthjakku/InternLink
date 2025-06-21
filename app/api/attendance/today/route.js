import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { getDatabase } from '../../../../utils/database.js';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

    // Ensure database connection
    if (!process.env.MONGODB_URI) {
      return NextResponse.json({ 
        error: 'Database not configured' 
      }, { status: 500 });
    }

    const db = await getDatabase();
    
    // Get attendance records for the specified date
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    
    const attendance = await db.collection('attendance')
      .find({
        userId: session.user.id,
        timestamp: {
          $gte: startDate,
          $lte: endDate
        }
      })
      .sort({ timestamp: 1 })
      .toArray();
    
    return NextResponse.json({ attendance });
    
  } catch (error) {
    console.error('Error fetching today attendance:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch attendance' 
    }, { status: 500 });
  }
}

