import { connectToDatabase } from '../../../utils/database.js';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session || session.user.role !== 'POC') {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { db } = await connectToDatabase();
    
    // Get POC's college information
    const pocUser = await db.collection('users').findOne({
      $or: [
        { gitlabUsername: session.user.gitlabUsername },
        { email: session.user.email }
      ]
    });

    if (!pocUser || !pocUser.college) {
      return res.status(404).json({ message: 'POC college information not found' });
    }

    // Get college identifier
    const collegeId = typeof pocUser.college === 'string' ? pocUser.college : pocUser.college._id || pocUser.college.name;

    // Get all users from the same college
    const users = await db.collection('users').find({
      $or: [
        { college: collegeId },
        { 'college.name': collegeId },
        { 'college._id': collegeId }
      ]
    }).toArray();

    const userIds = users.map(user => user._id);

    // Get attendance records for college users
    const attendanceRecords = await db.collection('attendance').find({
      userId: { $in: userIds }
    }).sort({ date: -1 }).toArray();

    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    
    // Calculate attendance statistics
    const todayAttendance = attendanceRecords.filter(record => 
      record.date === today && record.status === 'present'
    );

    const thisWeekStart = new Date();
    thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
    const thisWeekStartStr = thisWeekStart.toISOString().split('T')[0];

    const thisWeekAttendance = attendanceRecords.filter(record => 
      record.date >= thisWeekStartStr && record.status === 'present'
    );

    // Group attendance by user
    const userAttendance = users.map(user => {
      const userRecords = attendanceRecords.filter(record => 
        record.userId.toString() === user._id.toString()
      );
      
      const presentDays = userRecords.filter(record => record.status === 'present').length;
      const totalDays = userRecords.length;
      const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

      return {
        userId: user._id,
        name: user.name,
        email: user.email,
        gitlabUsername: user.gitlabUsername,
        role: user.role,
        presentDays,
        totalDays,
        attendanceRate,
        lastAttendance: userRecords.length > 0 ? userRecords[0].date : null,
        recentRecords: userRecords.slice(0, 7) // Last 7 records
      };
    });

    // Calculate overall statistics
    const stats = {
      totalUsers: users.length,
      presentToday: todayAttendance.length,
      presentThisWeek: thisWeekAttendance.length,
      averageAttendanceRate: userAttendance.length > 0 
        ? Math.round(userAttendance.reduce((sum, user) => sum + user.attendanceRate, 0) / userAttendance.length)
        : 0
    };

    res.status(200).json({
      attendance: userAttendance,
      stats,
      records: attendanceRecords.slice(0, 100), // Recent 100 records
      college: pocUser.college
    });
  } catch (error) {
    console.error('Error fetching college attendance:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}