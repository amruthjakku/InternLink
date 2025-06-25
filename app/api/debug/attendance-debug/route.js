import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { getDatabase } from '../../../../utils/database.js';

export async function GET() {
  try {
    // Check session
    const session = await getServerSession(authOptions);
    
    const debug = {
      timestamp: new Date().toISOString(),
      sessionCheck: {
        hasSession: !!session,
        userId: session?.user?.id || null,
        userEmail: session?.user?.email || null,
        userName: session?.user?.name || null,
        userRole: session?.user?.role || null
      },
      databaseCheck: {
        hasMongoUri: !!process.env.MONGODB_URI,
        nodeEnv: process.env.NODE_ENV || 'not-set'
      },
      ipCheck: {
        authorizedIPs: process.env.AUTHORIZED_IPS?.split(',').map(ip => ip.trim()) || [],
        isDevelopment: process.env.NODE_ENV === 'development'
      }
    };

    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'No session found',
        debug
      });
    }

    // Try to connect to database
    try {
      const db = await getDatabase();
      debug.databaseCheck.connected = true;
      
      // Check if attendance collection exists and is accessible
      const attendanceCount = await db.collection('attendance').countDocuments({
        userId: session.user.id
      });
      
      debug.databaseCheck.attendanceRecords = attendanceCount;
      
      // Check today's attendance
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayRecords = await db.collection('attendance')
        .find({
          userId: session.user.id,
          timestamp: { $gte: today, $lt: tomorrow }
        })
        .sort({ timestamp: 1 })
        .toArray();

      debug.todayAttendance = {
        recordsFound: todayRecords.length,
        records: todayRecords.map(r => ({
          action: r.action,
          timestamp: r.timestamp,
          ipAddress: r.ipAddress
        }))
      };

      // Check authorized IPs from database
      const dbIPs = await db.collection('authorized_ips')
        .find({ isActive: true })
        .toArray();
      
      debug.ipCheck.databaseIPs = dbIPs.map(ip => ip.ip);

    } catch (dbError) {
      debug.databaseCheck.connected = false;
      debug.databaseCheck.error = dbError.message;
    }

    return NextResponse.json({
      success: true,
      debug
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

export async function POST(request) {
  try {
    const { testAction } = await request.json();
    
    if (testAction === 'test_checkin') {
      // Simulate a check-in request
      const session = await getServerSession(authOptions);
      
      if (!session) {
        return NextResponse.json({ error: 'No session' }, { status: 401 });
      }

      // Test IP detection
      let userIP;
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        userIP = ipData.ip;
      } catch (ipError) {
        userIP = 'IP_DETECTION_FAILED';
      }

      const db = await getDatabase();
      
      // Test database write
      const testRecord = {
        userId: session.user.id,
        userEmail: session.user.email,
        action: 'test',
        timestamp: new Date(),
        ipAddress: userIP,
        testMode: true
      };
      
      await db.collection('attendance_test').insertOne(testRecord);
      
      return NextResponse.json({
        success: true,
        message: 'Test check-in simulation successful',
        testRecord: {
          userId: testRecord.userId,
          userEmail: testRecord.userEmail,
          ipAddress: testRecord.ipAddress,
          timestamp: testRecord.timestamp
        }
      });
    }

    return NextResponse.json({ error: 'Invalid test action' }, { status: 400 });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}