import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../utils/database';
import User from '../../../../models/User';

export async function GET() {
  try {
    await connectToDatabase();
    
    // Get all users with detailed info
    const allUsers = await User.find({})
      .populate('college')
      .populate('assignedTech Lead')
      .sort({ createdAt: -1 });
    
    const analysis = {
      total: allUsers.length,
      active: allUsers.filter(u => u.isActive).length,
      inactive: allUsers.filter(u => !u.isActive).length,
      
      // Inactive users by role
      inactiveByRole: {
        admin: allUsers.filter(u => !u.isActive && u.role === 'admin').length,
        'POC': allUsers.filter(u => !u.isActive && u.role === 'POC').length,
        'Tech Lead': allUsers.filter(u => !u.isActive && u.role === 'Tech Lead').length,
        'AI Developer Intern': allUsers.filter(u => !u.isActive && u.role === 'AI Developer Intern').length,
        pending: allUsers.filter(u => !u.isActive && u.role === 'pending').length,
      },
      
      // Reasons for inactivity
      inactivityReasons: [],
      
      // Detailed inactive users
      inactiveUsers: allUsers.filter(u => !u.isActive).map(user => ({
        gitlabUsername: user.gitlabUsername,
        email: user.email,
        role: user.role,
        college: user.college?.name || 'No college',
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        assignedTech Lead: user.assignedTech Lead?.gitlabUsername || 'None',
        hasRequiredFields: {
          hasCollege: !!user.college,
          hasTech Lead: user.role !== 'AI Developer Intern' || !!user.assignedTech Lead,
          hasAssignedBy: !!user.assignedBy
        }
      })),
      
      // Common patterns
      patterns: {
        missingTech Leads: allUsers.filter(u => u.role === 'AI Developer Intern' && !u.assignedTech Lead).length,
        missingColleges: allUsers.filter(u => !u.college && u.role !== 'admin').length,
        neverLoggedIn: allUsers.filter(u => !u.lastLoginAt).length,
        oldAccounts: allUsers.filter(u => {
          const monthAgo = new Date();
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return u.createdAt < monthAgo && !u.lastLoginAt;
        }).length
      },
      
      // Default activation status explanation
      defaultStatus: {
        explanation: 'New users are created as ACTIVE by default, but can become inactive due to:',
        reasons: [
          '1. Manual deactivation by admin',
          '2. Failed login validation (missing mentor, college, etc.)',
          '3. System security measures',
          '4. Bulk operations',
          '5. Data migration issues'
        ]
      }
    };
    
    return NextResponse.json({
      success: true,
      analysis,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Inactive analysis error:', error);
    return NextResponse.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
}