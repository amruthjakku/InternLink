import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { getDatabase } from '../../../../utils/database.js';
import { ObjectId } from 'mongodb';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDatabase();
    
    // Get attendance notifications for the user
    const notifications = await db.collection('attendance_notifications')
      .find({ 
        $or: [
          { userId: session.user.id },
          { targetRole: session.user.role },
          { isGlobal: true }
        ]
      })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();
    
    return NextResponse.json({ notifications });
    
  } catch (error) {
    console.error('Error fetching attendance notifications:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch notifications' 
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'mentor')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, message, targetUsers, targetRole, isGlobal } = await request.json();
    
    const db = await getDatabase();
    
    // Create notification
    const notification = {
      type, // 'reminder', 'warning', 'achievement', 'system'
      message,
      createdBy: session.user.id,
      createdByName: session.user.name,
      createdAt: new Date(),
      isGlobal: isGlobal || false,
      targetRole: targetRole || null,
      targetUsers: targetUsers || [],
      isRead: false,
      priority: type === 'warning' ? 'high' : 'normal'
    };
    
    const result = await db.collection('attendance_notifications').insertOne(notification);
    
    return NextResponse.json({ 
      success: true, 
      notificationId: result.insertedId 
    });
    
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json({ 
      error: 'Failed to create notification' 
    }, { status: 500 });
  }
}

// Mark notification as read
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { notificationId } = await request.json();
    
    const db = await getDatabase();
    
    await db.collection('attendance_notifications').updateOne(
      { _id: new ObjectId(notificationId) },
      { $set: { isRead: true, readAt: new Date() } }
    );
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json({ 
      error: 'Failed to mark notification as read' 
    }, { status: 500 });
  }
}