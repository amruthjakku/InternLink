import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../utils/database';
import User from '../../../../models/User';

export async function POST(request) {
  try {
    const { username } = await request.json();
    
    await connectToDatabase();
    
    // Find user and populate all required fields
    const user = await User.findOne({ gitlabUsername: username })
      .populate('college')
      .populate('assignedMentor');
    
    if (!user) {
      return NextResponse.json({ 
        success: false,
        error: 'User not found',
        canLogin: false
      });
    }
    
    // Check all requirements for login
    const checks = {
      userExists: !!user,
      isActive: user.isActive,
      hasRole: !!user.role,
      hasCollege: !!user.college,
      hasMentorIfNeeded: user.role !== 'AI developer Intern' || !!user.assignedMentor,
      hasAssignedBy: !!user.assignedBy
    };
    
    const canLogin = Object.values(checks).every(check => check === true);
    const issues = Object.entries(checks)
      .filter(([key, value]) => !value)
      .map(([key]) => key);
    
    return NextResponse.json({
      success: true,
      canLogin,
      issues,
      checks,
      user: {
        gitlabUsername: user.gitlabUsername,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        college: user.college?.name,
        assignedMentor: user.assignedMentor?.gitlabUsername,
        assignedBy: user.assignedBy
      }
    });
    
  } catch (error) {
    console.error('Test login error:', error);
    return NextResponse.json({ 
      success: false,
      error: error.message,
      canLogin: false
    });
  }
}