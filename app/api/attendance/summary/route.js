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

    // Ensure database connection
    if (!process.env.MONGODB_URI) {
      return NextResponse.json({ 
        error: 'Database not configured' 
      }, { status: 500 });
    }

    const db = await getDatabase();
    
    // Get user's attendance summary
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());
    
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Check if marked today
    const todayAttendance = await db.collection('attendance').findOne({
      userId: session.user.id,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });
    
    // This week's attendance
    const weekAttendance = await db.collection('attendance')
      .find({
        userId: session.user.id,
        date: { $gte: thisWeekStart },
        status: 'present'
      })
      .toArray();
    
    // This month's attendance
    const monthAttendance = await db.collection('attendance')
      .find({
        userId: session.user.id,
        date: { $gte: thisMonthStart },
        status: 'present'
      })
      .toArray();
    
    // Calculate streak
    const allAttendance = await db.collection('attendance')
      .find({
        userId: session.user.id,
        status: 'present'
      })
      .sort({ date: -1 })
      .toArray();
    
    let currentStreak = 0;
    const todayTime = today.getTime();
    
    for (let i = 0; i < allAttendance.length; i++) {
      const attendanceDate = new Date(allAttendance[i].date);
      attendanceDate.setHours(0, 0, 0, 0);
      
      const expectedDate = new Date(todayTime - (i * 24 * 60 * 60 * 1000));
      expectedDate.setHours(0, 0, 0, 0);
      
      // Skip weekends
      while (expectedDate.getDay() === 0 || expectedDate.getDay() === 6) {
        expectedDate.setDate(expectedDate.getDate() - 1);
      }
      
      if (attendanceDate.getTime() === expectedDate.getTime()) {
        currentStreak++;
      } else {
        break;
      }
    }
    
    // Working days calculations
    const getWorkingDays = (start, end) => {
      let count = 0;
      const current = new Date(start);
      while (current <= end) {
        const dayOfWeek = current.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          count++;
        }
        current.setDate(current.getDate() + 1);
      }
      return count;
    };
    
    const workingDaysThisWeek = getWorkingDays(thisWeekStart, today);
    const workingDaysThisMonth = getWorkingDays(thisMonthStart, today);
    
    const summary = {
      today: {
        marked: !!todayAttendance,
        markedAt: todayAttendance?.markedAt || null,
        ipAddress: todayAttendance?.ipAddress || null
      },
      week: {
        present: weekAttendance.length,
        total: workingDaysThisWeek,
        rate: workingDaysThisWeek > 0 ? (weekAttendance.length / workingDaysThisWeek) * 100 : 0
      },
      month: {
        present: monthAttendance.length,
        total: workingDaysThisMonth,
        rate: workingDaysThisMonth > 0 ? (monthAttendance.length / workingDaysThisMonth) * 100 : 0
      },
      streak: {
        current: currentStreak,
        best: currentStreak // For now, we'll use current as best
      },
      lastAttendance: allAttendance.length > 0 ? allAttendance[0].date : null
    };
    
    return NextResponse.json({ summary });
    
  } catch (error) {
    console.error('Error fetching attendance summary:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch attendance summary' 
    }, { status: 500 });
  }
}