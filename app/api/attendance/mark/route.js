import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { getDatabase } from '../../../../utils/database.js';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { clientIP, location, deviceInfo } = await request.json();
    
    // Ensure database connection
    if (!process.env.MONGODB_URI) {
      return NextResponse.json({ 
        error: 'Database not configured' 
      }, { status: 500 });
    }
    
    const db = await getDatabase();
    
    // Get authorized IPs from environment
    const envIPs = process.env.AUTHORIZED_IPS?.split(',').map(ip => ip.trim()) || [];
    
    // Get authorized IPs from database
    const dbIPs = await db.collection('authorized_ips')
      .find({ isActive: true })
      .toArray();
    
    const dbIPList = dbIPs.map(record => record.ip);
    
    // Combine all authorized IPs
    const allAuthorizedIPs = [...envIPs, ...dbIPList];
    
    // Validate IP address
    if (!allAuthorizedIPs.includes(clientIP)) {
      return NextResponse.json({ 
        error: 'Attendance can only be marked from authorized Wi-Fi networks',
        code: 'UNAUTHORIZED_NETWORK',
        clientIP: clientIP,
        authorizedCount: allAuthorizedIPs.length
      }, { status: 403 });
    }
    
    // Check if attendance already marked today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const existingAttendance = await db.collection('attendance').findOne({
      userId: session.user.id,
      date: {
        $gte: today,
        $lt: tomorrow
      }
    });
    
    if (existingAttendance) {
      return NextResponse.json({ 
        error: 'Attendance already marked for today',
        code: 'ALREADY_MARKED'
      }, { status: 400 });
    }
    
    // Create attendance record
    const attendanceRecord = {
      userId: session.user.id,
      userEmail: session.user.email,
      userName: session.user.name,
      userRole: session.user.role,
      date: new Date(),
      ipAddress: clientIP,
      location: location || null,
      deviceInfo: deviceInfo || null,
      status: 'present',
      markedAt: new Date(),
      college: session.user.college || null
    };
    
    const result = await db.collection('attendance').insertOne(attendanceRecord);
    
    // Update user's attendance streak
    await updateAttendanceStreak(db, session.user.id);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Attendance marked successfully',
      attendanceId: result.insertedId
    });
    
  } catch (error) {
    console.error('Error marking attendance:', error);
    return NextResponse.json({ 
      error: 'Failed to mark attendance' 
    }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Ensure database connection
    if (!process.env.MONGODB_URI) {
      return NextResponse.json({ 
        error: 'Database not configured' 
      }, { status: 500 });
    }

    const db = await getDatabase();
    
    // Build date filter
    let dateFilter = {};
    if (startDate) {
      dateFilter.$gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.$lte = end;
    }
    
    const query = {
      userId: session.user.id,
      ...(Object.keys(dateFilter).length > 0 && { date: dateFilter })
    };
    
    const attendance = await db.collection('attendance')
      .find(query)
      .sort({ date: -1 })
      .toArray();
    
    return NextResponse.json({ attendance });
    
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch attendance' 
    }, { status: 500 });
  }
}



async function updateAttendanceStreak(db, userId) {
  try {
    // Get user's attendance history (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const attendanceHistory = await db.collection('attendance')
      .find({
        userId: userId,
        date: { $gte: thirtyDaysAgo },
        status: 'present'
      })
      .sort({ date: -1 })
      .toArray();
    
    // Calculate current streak
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < attendanceHistory.length; i++) {
      const attendanceDate = new Date(attendanceHistory[i].date);
      attendanceDate.setHours(0, 0, 0, 0);
      
      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - i);
      
      if (attendanceDate.getTime() === expectedDate.getTime()) {
        currentStreak++;
      } else {
        break;
      }
    }
    
    // Update user's streak in users collection
    await db.collection('users').updateOne(
      { _id: userId },
      { 
        $set: { 
          attendanceStreak: currentStreak,
          lastAttendance: new Date()
        }
      },
      { upsert: true }
    );
    
  } catch (error) {
    console.error('Error updating attendance streak:', error);
  }
}