import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { getDatabase } from '../../../../utils/database.js';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const role = searchParams.get('role');
    const college = searchParams.get('college');
    
    console.log('Attendance Analytics - Request params:', {
      startDate, endDate, role, college
    });
    
    // Ensure database connection
    if (!process.env.MONGODB_URI) {
      return NextResponse.json({ 
        error: 'Database not configured' 
      }, { status: 500 });
    }
    
    const db = await getDatabase();
    console.log('Attendance Analytics - Database connected successfully');
    
    // Build query
    let query = {};
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (role && role !== 'all') {
      query.userRole = role;
    }
    
    if (college && college !== 'all') {
      query.college = college;
    }
    
    // Get attendance data
    console.log('Attendance Analytics - Querying attendance with:', query);
    const attendanceData = await db.collection('attendance')
      .find(query)
      .sort({ date: -1 })
      .toArray();
    
    console.log('Attendance Analytics - Found attendance records:', attendanceData.length);
    
    // Get all users for absentee calculation
    let userQuery = {};
    if (role && role !== 'all') {
      userQuery.role = role;
    }
    if (college && college !== 'all') {
      userQuery.college = college;
    }
    
    console.log('Attendance Analytics - Querying users with:', userQuery);
    const allUsers = await db.collection('users')
      .find(userQuery)
      .toArray();
    
    console.log('Attendance Analytics - Found users:', allUsers.length);
    
    // Calculate analytics
    const analytics = await calculateAttendanceAnalytics(attendanceData, allUsers, startDate, endDate);
    console.log('Attendance Analytics - Analytics calculated successfully');
    
    return NextResponse.json(analytics);
    
  } catch (error) {
    console.error('Error fetching attendance analytics:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json({ 
      error: 'Failed to fetch attendance analytics',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}




async function calculateAttendanceAnalytics(attendanceData, allUsers, startDate, endDate) {
  try {
    console.log('Calculating attendance analytics with:', {
      attendanceRecords: attendanceData.length,
      totalUsers: allUsers.length,
      startDate,
      endDate
    });
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
  
  // Daily attendance heatmap
  const dailyHeatmap = {};
  const weeklyHeatmap = {};
  
  // Initialize heatmap data
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateKey = d.toISOString().split('T')[0];
    dailyHeatmap[dateKey] = 0;
    
    const weekKey = getWeekKey(d);
    if (!weeklyHeatmap[weekKey]) {
      weeklyHeatmap[weekKey] = 0;
    }
  }
  
  // Group attendance by user and date to handle check-in/check-out
  const userDailyAttendance = {};
  
  attendanceData.forEach(record => {
    try {
      let dateKey;
      if (record.date) {
        dateKey = typeof record.date === 'string' ? record.date : new Date(record.date).toISOString().split('T')[0];
      } else if (record.timestamp) {
        dateKey = new Date(record.timestamp).toISOString().split('T')[0];
      } else if (record.createdAt) {
        dateKey = new Date(record.createdAt).toISOString().split('T')[0];
      } else {
        dateKey = new Date().toISOString().split('T')[0]; // fallback to today
      }
      
      const userKey = `${record.userId}_${dateKey}`;
      
      if (!userDailyAttendance[userKey]) {
        userDailyAttendance[userKey] = {
          userId: record.userId,
          date: dateKey,
          records: []
        };
      }
      
      userDailyAttendance[userKey].records.push(record);
    } catch (err) {
      console.warn('Error processing attendance record:', err, record);
    }
  });
  
  // Fill heatmap with unique user-day combinations
  Object.values(userDailyAttendance).forEach(dayData => {
    const dateKey = dayData.date;
    
    // Count as present if:
    // 1. Old format: has status 'present'
    // 2. New format: has both checkin and checkout, or just checkin
    const hasOldPresent = dayData.records.some(r => r.status === 'present');
    const hasCheckin = dayData.records.some(r => r.action === 'checkin');
    
    if (hasOldPresent || hasCheckin) {
      if (dailyHeatmap.hasOwnProperty(dateKey)) {
        dailyHeatmap[dateKey]++;
      }
      
      const weekKey = getWeekKey(new Date(dateKey));
      if (weeklyHeatmap[weekKey] !== undefined) {
        weeklyHeatmap[weekKey]++;
      }
    }
  });
  
  // User-wise attendance history
  const userAttendance = {};
  const userStreaks = {};
  
  attendanceData.forEach(record => {
    try {
      if (!record.userId) {
        console.warn('Attendance record missing userId:', record);
        return;
      }
      
      if (!userAttendance[record.userId]) {
        userAttendance[record.userId] = {
          userId: record.userId,
          userName: record.userName || 'Unknown User',
          userEmail: record.userEmail || '',
          userRole: record.userRole || 'unknown',
          college: record.college || 'Unknown',
          totalDays: 0,
          presentDays: 0,
          absentDays: 0,
          attendanceRate: 0,
          records: []
        };
      }
      
      userAttendance[record.userId].records.push({
        date: record.date || record.timestamp || record.createdAt,
        status: record.status,
        ipAddress: record.ipAddress,
        location: record.location
      });
      
      if (record.status === 'present') {
        userAttendance[record.userId].presentDays++;
      }
    } catch (err) {
      console.warn('Error processing user attendance record:', err, record);
    }
  });
  
  // Calculate attendance rates and streaks
  const totalWorkingDays = getWorkingDays(start, end);
  
  Object.keys(userAttendance).forEach(userId => {
    const user = userAttendance[userId];
    user.totalDays = totalWorkingDays;
    user.absentDays = totalWorkingDays - user.presentDays;
    user.attendanceRate = totalWorkingDays > 0 ? (user.presentDays / totalWorkingDays) * 100 : 0;
    
    // Calculate current streak
    user.currentStreak = calculateUserStreak(user.records);
  });
  
  // Find absentees for today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = today.toISOString().split('T')[0];
  
  const presentToday = new Set(
    attendanceData
      .filter(record => {
        try {
          if (!record.date && !record.timestamp && !record.createdAt) return false;
          
          const recordDate = new Date(record.date || record.timestamp || record.createdAt);
          if (isNaN(recordDate.getTime())) return false;
          
          recordDate.setHours(0, 0, 0, 0);
          return recordDate.getTime() === today.getTime();
        } catch (err) {
          console.warn('Error filtering today attendance:', err, record);
          return false;
        }
      })
      .map(record => record.userId)
      .filter(userId => userId) // Remove null/undefined userIds
  );
  
  const absenteesToday = allUsers
    .filter(user => !presentToday.has(user._id?.toString() || user.id))
    .map(user => ({
      userId: user._id?.toString() || user.id,
      userName: user.name,
      userEmail: user.email,
      userRole: user.role,
      college: user.college,
      lastAttendance: user.lastAttendance || null,
      attendanceStreak: user.attendanceStreak || 0
    }));
  
  // Overall statistics
  const totalUsers = allUsers.length;
  const presentTodayCount = presentToday.size;
  const absentTodayCount = totalUsers - presentTodayCount;
  const attendanceRateToday = totalUsers > 0 ? (presentTodayCount / totalUsers) * 100 : 0;
  
  // Top performers (highest attendance rate)
  const topPerformers = Object.values(userAttendance)
    .sort((a, b) => b.attendanceRate - a.attendanceRate)
    .slice(0, 10);
  
  // Streak leaders
  const streakLeaders = Object.values(userAttendance)
    .sort((a, b) => b.currentStreak - a.currentStreak)
    .slice(0, 10);
  
  // Role-wise statistics
  const roleStats = {};
  allUsers.forEach(user => {
    if (!roleStats[user.role]) {
      roleStats[user.role] = {
        total: 0,
        present: 0,
        absent: 0,
        attendanceRate: 0
      };
    }
    roleStats[user.role].total++;
    
    if (presentToday.has(user._id?.toString() || user.id)) {
      roleStats[user.role].present++;
    } else {
      roleStats[user.role].absent++;
    }
  });
  
  Object.keys(roleStats).forEach(role => {
    const stats = roleStats[role];
    stats.attendanceRate = stats.total > 0 ? (stats.present / stats.total) * 100 : 0;
  });
  
  // College-wise statistics
  const collegeStats = {};
  allUsers.forEach(user => {
    const college = user.college || 'Unknown';
    if (!collegeStats[college]) {
      collegeStats[college] = {
        total: 0,
        present: 0,
        absent: 0,
        attendanceRate: 0
      };
    }
    collegeStats[college].total++;
    
    if (presentToday.has(user._id?.toString() || user.id)) {
      collegeStats[college].present++;
    } else {
      collegeStats[college].absent++;
    }
  });
  
  Object.keys(collegeStats).forEach(college => {
    const stats = collegeStats[college];
    stats.attendanceRate = stats.total > 0 ? (stats.present / stats.total) * 100 : 0;
  });
  
    return {
      overview: {
        totalUsers,
        presentToday: presentTodayCount,
        absentToday: absentTodayCount,
        attendanceRateToday,
        totalWorkingDays
      },
      dailyHeatmap,
      weeklyHeatmap,
      userAttendance: Object.values(userAttendance),
      absenteesToday,
      topPerformers,
      streakLeaders,
      roleStats,
      collegeStats,
      dateRange: {
        start: start.toISOString(),
        end: end.toISOString()
      }
    };
  } catch (error) {
    console.error('Error in calculateAttendanceAnalytics:', error);
    console.error('Error stack:', error.stack);
    
    // Return fallback analytics data
    return {
      overview: {
        totalUsers: allUsers.length,
        presentToday: 0,
        absentToday: allUsers.length,
        attendanceRateToday: 0,
        totalWorkingDays: 0
      },
      dailyHeatmap: {},
      weeklyHeatmap: {},
      userAttendance: [],
      absenteesToday: allUsers.map(user => ({
        userId: user._id?.toString() || user.id,
        userName: user.name || 'Unknown',
        userEmail: user.email || '',
        userRole: user.role || 'unknown',
        college: user.college || 'Unknown',
        lastAttendance: null,
        attendanceStreak: 0
      })),
      topPerformers: [],
      streakLeaders: [],
      roleStats: {},
      collegeStats: {},
      dateRange: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString()
      }
    };
  }
}

function getWeekKey(date) {
  const year = date.getFullYear();
  const week = getWeekNumber(date);
  return `${year}-W${week.toString().padStart(2, '0')}`;
}

function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function getWorkingDays(startDate, endDate) {
  let count = 0;
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Exclude weekends
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
}

function calculateUserStreak(records) {
  if (!records || records.length === 0) return 0;
  
  // Sort records by date (newest first)
  const sortedRecords = records
    .filter(record => record.status === 'present')
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  
  if (sortedRecords.length === 0) return 0;
  
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < sortedRecords.length; i++) {
    const recordDate = new Date(sortedRecords[i].date);
    recordDate.setHours(0, 0, 0, 0);
    
    const expectedDate = new Date(today);
    expectedDate.setDate(expectedDate.getDate() - i);
    
    // Skip weekends
    while (expectedDate.getDay() === 0 || expectedDate.getDay() === 6) {
      expectedDate.setDate(expectedDate.getDate() - 1);
    }
    
    if (recordDate.getTime() === expectedDate.getTime()) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}