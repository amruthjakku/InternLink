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

    const db = await getDatabase();
    
    // Get attendance records for today
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

    // Get all attendance records for the user
    const allRecords = await db.collection('attendance')
      .find({ userId: session.user.id })
      .sort({ timestamp: -1 })
      .limit(10)
      .toArray();

    // Get authorized IPs
    const authorizedIPs = await db.collection('authorized_ips')
      .find({ isActive: true })
      .toArray();

    return NextResponse.json({
      success: true,
      session: {
        user: session.user,
        expires: session.expires
      },
      today: {
        date: today.toISOString().split('T')[0],
        records: todayRecords,
        hasCheckin: todayRecords.some(r => r.action === 'checkin'),
        hasCheckout: todayRecords.some(r => r.action === 'checkout')
      },
      recent: allRecords,
      system: {
        authorizedIPs: authorizedIPs.length,
        environment: process.env.NODE_ENV,
        database: 'connected'
      }
    });

  } catch (error) {
    console.error('Error testing attendance system:', error);
    return NextResponse.json({ 
      error: 'Test failed',
      details: error.message
    }, { status: 500 });
  }
}