import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../utils/database';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // For now, return empty logs since we haven't implemented activity tracking yet
    // In a real implementation, you would fetch from an activity_logs collection
    const logs = [];

    return NextResponse.json({ logs });

  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch activity logs' 
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, details } = await request.json();

    await connectToDatabase();

    // Create activity log entry
    const logEntry = {
      userId: session.user.id,
      userName: session.user.name,
      action,
      details: details || {},
      timestamp: new Date(),
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    };

    // In a real implementation, save to activity_logs collection
    // const db = await getDatabase();
    // await db.collection('activity_logs').insertOne(logEntry);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error creating activity log:', error);
    return NextResponse.json({ 
      error: 'Failed to create activity log' 
    }, { status: 500 });
  }
}