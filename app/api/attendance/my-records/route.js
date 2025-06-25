import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { getDatabase } from '../../../../utils/database';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDatabase();
    
    // Use userId as string to avoid ObjectId version conflicts
    const userId = String(session.user.id);

    // Get attendance records grouped by date
    const attendance = await db.collection('attendance').aggregate([
      {
        $match: {
          userId: userId
        }
      },
      {
        $group: {
          _id: "$date", // Group by date
          records: { $push: "$$ROOT" },
          checkinRecord: {
            $first: {
              $cond: [{ $eq: ["$action", "checkin"] }, "$$ROOT", null]
            }
          },
          checkoutRecord: {
            $first: {
              $cond: [{ $eq: ["$action", "checkout"] }, "$$ROOT", null]
            }
          }
        }
      },
      {
        $addFields: {
          date: "$_id",
          checkinTime: "$checkinRecord.timestamp",
          checkoutTime: "$checkoutRecord.timestamp",
          status: {
            $cond: [
              { $and: ["$checkinRecord", "$checkoutRecord"] },
              "complete",
              {
                $cond: [
                  "$checkinRecord",
                  "partial",
                  "none"
                ]
              }
            ]
          },
          totalHours: {
            $cond: [
              { $and: ["$checkinRecord", "$checkoutRecord"] },
              {
                $divide: [
                  { $subtract: ["$checkoutRecord.timestamp", "$checkinRecord.timestamp"] },
                  3600000 // Convert milliseconds to hours
                ]
              },
              0
            ]
          }
        }
      },
      {
        $sort: { date: -1 }
      }
    ]).toArray();

    // Transform data for consistent format
    const formattedRecords = attendance.map(record => ({
      _id: record._id,
      date: record.date,
      checkinTime: record.checkinTime,
      checkoutTime: record.checkoutTime,
      status: record.status,
      totalHours: record.totalHours ? parseFloat(record.totalHours.toFixed(2)) : 0,
      ipAddress: record.checkinRecord?.ipAddress || record.checkoutRecord?.ipAddress,
      location: record.checkinRecord?.location || record.checkoutRecord?.location,
      college: record.checkinRecord?.college || record.checkoutRecord?.college,
      rawRecords: record.records // Include raw records for debugging
    }));

    return NextResponse.json({ 
      records: formattedRecords,
      totalRecords: formattedRecords.length
    });

  } catch (error) {
    console.error('Error fetching user attendance:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch attendance records' 
    }, { status: 500 });
  }
}