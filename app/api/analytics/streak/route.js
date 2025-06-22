import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../utils/database';
import Attendance from '../../../../models/Attendance';
import { format, subDays } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const userId = session.user.id;
    const ninetyDaysAgo = subDays(new Date(), 90);

    // Get attendance records for the last 90 days
    const attendanceRecords = await Attendance.find({
      userId: userId,
      date: { $gte: ninetyDaysAgo }
    }).sort({ date: -1 });

    // Calculate current streak
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check consecutive days from today backwards
    for (let i = 0; i < 90; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      
      const hasAttendance = attendanceRecords.some(record => {
        const recordDate = new Date(record.date);
        recordDate.setHours(0, 0, 0, 0);
        return recordDate.getTime() === checkDate.getTime() && record.checkIn;
      });
      
      if (hasAttendance) {
        currentStreak++;
      } else if (i > 0) { // Allow today to be missing for current streak
        break;
      }
    }

    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 0;
    
    // Sort by date ascending to calculate longest streak
    const sortedRecords = [...attendanceRecords].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    for (let i = 0; i < sortedRecords.length; i++) {
      const record = sortedRecords[i];
      if (record.checkIn) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    // Generate streak history for the last 30 days
    const history = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      const hasAttendance = attendanceRecords.some(record => {
        const recordDate = new Date(record.date);
        recordDate.setHours(0, 0, 0, 0);
        return recordDate.getTime() === date.getTime() && record.checkIn;
      });
      
      history.push({
        date: format(date, 'yyyy-MM-dd'),
        hasActivity: hasAttendance
      });
    }

    const streak = {
      current: currentStreak,
      longest: longestStreak,
      history: history
    };

    return NextResponse.json({ streak });

  } catch (error) {
    console.error('Error fetching streak data:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch streak data' 
    }, { status: 500 });
  }
}