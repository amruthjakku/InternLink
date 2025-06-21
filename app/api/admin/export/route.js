import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route.js';
import { connectToDatabase } from '../../../../utils/database.js';
import User from '../../../../models/User.js';
import College from '../../../../models/College.js';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    let data = {};

    if (type === 'users' || type === 'all') {
      const users = await User.find({ isActive: true })
        .populate('college')
        .select('-__v')
        .sort({ createdAt: -1 });
      
      data.users = users.map(user => ({
        gitlabUsername: user.gitlabUsername,
        gitlabId: user.gitlabId,
        name: user.name,
        email: user.email,
        role: user.role,
        college: user.college?.name || null,
        assignedBy: user.assignedBy,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }));
    }

    if (type === 'colleges' || type === 'all') {
      const colleges = await College.find({ isActive: true })
        .select('-__v')
        .sort({ createdAt: -1 });

      // Add intern count to each college
      const collegesWithStats = await Promise.all(
        colleges.map(async (college) => {
          const internsCount = await User.countDocuments({
            college: college._id,
            role: 'intern',
            isActive: true
          });

          return {
            name: college.name,
            description: college.description,
            location: college.location,
            website: college.website,
            mentorUsername: college.mentorUsername,
            internsCount,
            createdBy: college.createdBy,
            isActive: college.isActive,
            createdAt: college.createdAt,
            updatedAt: college.updatedAt
          };
        })
      );

      data.colleges = collegesWithStats;
    }

    if (!type || (type !== 'users' && type !== 'colleges' && type !== 'all')) {
      return NextResponse.json({ 
        error: 'Invalid export type. Must be "users", "colleges", or "all".' 
      }, { status: 400 });
    }

    // Add metadata
    data.exportedAt = new Date().toISOString();
    data.exportedBy = session.user.gitlabUsername;
    data.exportType = type;

    // Return as JSON file
    const response = new NextResponse(JSON.stringify(data, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${type}_export_${new Date().toISOString().split('T')[0]}.json"`
      }
    });

    return response;

  } catch (error) {
    console.error('Error exporting data:', error);
    return NextResponse.json({ 
      error: 'Failed to export data' 
    }, { status: 500 });
  }
}