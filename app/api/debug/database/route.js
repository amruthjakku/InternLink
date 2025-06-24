import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../utils/database';
import User from '../../../../models/User';
import College from '../../../../models/College';

export async function GET() {
  try {
    await connectToDatabase();
    
    // Check all users
    const users = await User.find({}).populate('college');
    const activeUsers = await User.find({ isActive: true }).populate('college');
    const inactiveUsers = await User.find({ isActive: false }).populate('college');
    
    // Check colleges
    const colleges = await College.find({});
    
    const report = {
      summary: {
        totalUsers: users.length,
        activeUsers: activeUsers.length,
        inactiveUsers: inactiveUsers.length,
        totalColleges: colleges.length
      },
      allUsers: users.map(user => ({
        id: user._id.toString(),
        gitlabUsername: user.gitlabUsername,
        role: user.role,
        isActive: user.isActive,
        college: user.college?.name || 'None',
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt
      })),
      inactiveUsers: inactiveUsers.map(user => ({
        id: user._id.toString(),
        gitlabUsername: user.gitlabUsername,
        role: user.role,
        college: user.college?.name || 'None',
        createdAt: user.createdAt
      })),
      colleges: colleges.map(college => ({
        id: college._id.toString(),
        name: college.name,
        isActive: college.isActive
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