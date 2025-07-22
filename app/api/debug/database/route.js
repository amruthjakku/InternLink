import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../utils/database';
import User from '../../../../models/User';
import College from '../../../../models/College';

export async function GET() {
  try {
    await connectToDatabase();
    
    // Check all users
    const users = await User.find({}).populate('college');
    
    // Check colleges
    const colleges = await College.find({});
    
    const report = {
      summary: {
        totalUsers: users.length,
        totalColleges: colleges.length
      },
      allUsers: users.map(user => ({
        id: user._id.toString(),
        gitlabUsername: user.gitlabUsername,
        role: user.role,
        college: user.college?.name || 'None',
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt
      })),
      colleges: colleges.map(college => ({
        id: college._id.toString(),
        name: college.name
      }))
    };
    
    return NextResponse.json(report);
    
  } catch (error) {
    console.error('Database debug error:', error);
    return NextResponse.json({ 
      error: 'Database check failed',
      details: error.message 
    }, { status: 500 });
  }
}