import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../utils/database';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'super-admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Generate sample activity logs based on user data
    const User = (await import('../../../../models/User')).default;
    const users = await User.find({ isActive: true })
      .select('_id name email role lastLoginAt createdAt')
      .sort({ lastLoginAt: -1, createdAt: -1 })
      .limit(20);

    const logs = [];
    
    users.forEach(user => {
      // Add login activity if user has logged in
      if (user.lastLoginAt) {
        logs.push({
          id: `login_${user._id}_${user.lastLoginAt.getTime()}`,
          userId: user._id.toString(),
          userName: user.name,
          action: 'User logged in',
          timestamp: user.lastLoginAt,
          ipAddress: '192.168.1.1',
          userAgent: 'Browser',
          details: `${user.name} (${user.role}) logged into the system`
        });
      }

      // Add registration activity
      logs.push({
        id: `register_${user._id}_${user.createdAt.getTime()}`,
        userId: user._id.toString(),
        userName: user.name,
        action: 'User registered',
        timestamp: user.createdAt,
        ipAddress: '192.168.1.1',
        userAgent: 'Browser',
        details: `${user.name} registered as ${user.role}`
      });
    });

    // Sort logs by timestamp (most recent first)
    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

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