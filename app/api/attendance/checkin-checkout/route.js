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

    const { action, clientIP, location, deviceInfo } = await request.json();
    
    if (!action || !['checkin', 'checkout'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Must be checkin or checkout' }, { status: 400 });
    }

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
    
    const authorizedIPs = [...envIPs, ...dbIPs.map(ip => ip.ip)];
    
    // Validate IP address
    if (!authorizedIPs.includes(clientIP)) {
      return NextResponse.json({ 
        error: 'Unauthorized network. Please connect to an authorized Wi-Fi network to mark attendance.',
        currentIP: clientIP,
        authorizedIPs: authorizedIPs.length > 0 ? ['Contact admin for authorized networks'] : []
      }, { status: 403 });
    }

    // Check today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAttendance = await db.collection('attendance')
      .find({
        userId: session.user.id,
        timestamp: {
          $gte: today,
          $lt: tomorrow
        }
      })
      .sort({ timestamp: 1 })
      .toArray();

    // Validate action based on current state
    const hasCheckin = todayAttendance.some(record => record.action === 'checkin');
    const hasCheckout = todayAttendance.some(record => record.action === 'checkout');

    if (action === 'checkin') {
      if (hasCheckin) {
        return NextResponse.json({ 
          error: 'You have already checked in today' 
        }, { status: 400 });
      }
    } else if (action === 'checkout') {
      if (!hasCheckin) {
        return NextResponse.json({ 
          error: 'You must check in before checking out' 
        }, { status: 400 });
      }
      if (hasCheckout) {
        return NextResponse.json({ 
          error: 'You have already checked out today' 
        }, { status: 400 });
      }
    }

    // Create attendance record
    const attendanceRecord = {
      userId: session.user.id,
      userEmail: session.user.email,
      userName: session.user.name,
      userRole: session.user.role,
      action: action, // 'checkin' or 'checkout'
      timestamp: new Date(),
      date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
      ipAddress: clientIP,
      location: location || null,
      deviceInfo: deviceInfo || null,
      college: session.user.college || null
    };
    
    const result = await db.collection('attendance').insertOne(attendanceRecord);
    
    // Update user's attendance streak and working hours
    await updateUserAttendanceStats(db, session.user.id, action);
    
    const actionMessage = action === 'checkin' ? 'Checked in' : 'Checked out';
    
    return NextResponse.json({ 
      success: true, 
      message: `${actionMessage} successfully at ${new Date().toLocaleTimeString()}`,
      attendanceId: result.insertedId,
      timestamp: attendanceRecord.timestamp,
      action: action
    });
    
  } catch (error) {
    console.error('Error processing attendance:', error);
    return NextResponse.json({ 
      error: 'Failed to process attendance' 
    }, { status: 500 });
  }
}

async function updateUserAttendanceStats(db, userId, action) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get today's attendance records
    const todayRecords = await db.collection('attendance')
      .find({
        userId: userId,
        timestamp: { $gte: today }
      })
      .sort({ timestamp: 1 })
      .toArray();

    let workingHours = 0;
    let isCompleteDay = false;

    // Calculate working hours if both checkin and checkout exist
    const checkinRecord = todayRecords.find(r => r.action === 'checkin');
    const checkoutRecord = todayRecords.find(r => r.action === 'checkout');

    if (checkinRecord && checkoutRecord) {
      const checkinTime = new Date(checkinRecord.timestamp);
      const checkoutTime = new Date(checkoutRecord.timestamp);
      workingHours = (checkoutTime - checkinTime) / (1000 * 60 * 60); // Convert to hours
      isCompleteDay = true;
    }

    // Update user stats
    const updateData = {
      lastAttendanceAction: action,
      lastAttendanceTime: new Date()
    };

    if (isCompleteDay) {
      updateData.todayWorkingHours = workingHours;
      updateData.attendanceStatus = 'complete';
      
      // Calculate streak for complete days
      await updateAttendanceStreak(db, userId);
    } else if (action === 'checkin') {
      updateData.attendanceStatus = 'checked-in';
    }

    await db.collection('users').updateOne(
      { _id: userId },
      { $set: updateData },
      { upsert: true }
    );
    
  } catch (error) {
    console.error('Error updating user attendance stats:', error);
  }
}

async function updateAttendanceStreak(db, userId) {
  try {
    // Get user's complete attendance days (days with both checkin and checkout)
    const completeDays = await db.collection('attendance').aggregate([
      {
        $match: {
          userId: userId,
          timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
        }
      },
      {
        $group: {
          _id: "$date",
          actions: { $push: "$action" },
          date: { $first: "$timestamp" }
        }
      },
      {
        $match: {
          actions: { $all: ["checkin", "checkout"] }
        }
      },
      {
        $sort: { date: -1 }
      }
    ]).toArray();

    // Calculate current streak
    let currentStreak = 0;
    const today = new Date().toISOString().split('T')[0];
    
    for (let i = 0; i < completeDays.length; i++) {
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - i);
      const expectedDateStr = expectedDate.toISOString().split('T')[0];
      
      if (completeDays[i] && completeDays[i]._id === expectedDateStr) {
        currentStreak++;
      } else {
        break;
      }
    }
    
    // Update user's streak
    await db.collection('users').updateOne(
      { _id: userId },
      { 
        $set: { 
          attendanceStreak: currentStreak,
          lastStreakUpdate: new Date()
        }
      },
      { upsert: true }
    );
    
  } catch (error) {
    console.error('Error updating attendance streak:', error);
  }
}