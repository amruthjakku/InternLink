import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../utils/database';
import User from '../../../../models/User';
import College from '../../../../models/College';

export async function GET() {
  try {
    console.log('🔍 AUTH FLOW DEBUG: Starting comprehensive auth flow check...');
    
    // Step 1: Check session
    const session = await getServerSession(authOptions);
    console.log('🔍 AUTH FLOW DEBUG - Session check:', {
      hasSession: !!session,
      user: session?.user ? {
        gitlabUsername: session.user.gitlabUsername,
        role: session.user.role,
        needsRegistration: session.user.needsRegistration,
        hasCollege: !!session.user.college
      } : null
    });
    
    if (!session) {
      return NextResponse.json({
        step: 'session_check',
        status: 'FAIL',
        reason: 'No session found',
        recommendation: 'User needs to login'
      });
    }
    
    // Step 2: Database lookup
    await connectToDatabase();
    console.log('🔍 AUTH FLOW DEBUG - Database connected');
    
    const user = await User.findByGitLabUsername(session.user.gitlabUsername, 'college');
    console.log('🔍 AUTH FLOW DEBUG - Database lookup:', {
      username: session.user.gitlabUsername,
      found: !!user,
      userRole: user?.role,
      userActive: user?.isActive,
      userCollege: user?.college?.name,
      sessionRole: session.user.role
    });
    
    if (!user) {
      return NextResponse.json({
        step: 'database_lookup',
        status: 'FAIL', 
        reason: 'User not found in database',
        recommendation: 'User needs to be registered by admin'
      });
    }
    
    if (!user.isActive) {
      return NextResponse.json({
        step: 'user_active_check',
        status: 'FAIL',
        reason: 'User account is deactivated',
        recommendation: 'Admin needs to activate user account'
      });
    }
    
    // Step 3: Pending user check
    if (user.role === 'pending') {
      return NextResponse.json({
        step: 'pending_approval',
        status: 'PENDING',
        reason: 'User account needs admin approval',
        recommendation: 'User should wait for admin approval',
        user: {
          id: user._id.toString(),
          gitlabUsername: user.gitlabUsername,
          role: user.role,
          college: user.college?.name,
          isActive: user.isActive,
          expectedDashboard: '/pending'
        }
      });
    }

    // Step 4: Role-based access check
    const accessRules = {
      admin: ['admin'],
      'super-mentor': ['mentor'],
      mentor: ['mentor'], 
      intern: ['intern']
    };
    
    const expectedDashboard = accessRules[user.role]?.[0];
    console.log('🔍 AUTH FLOW DEBUG - Role access check:', {
      userRole: user.role,
      expectedDashboard,
      hasValidRole: !!accessRules[user.role]
    });
    
    if (!expectedDashboard) {
      return NextResponse.json({
        step: 'role_validation',
        status: 'FAIL',
        reason: `Unknown role: ${user.role}`,
        recommendation: 'Admin needs to assign valid role'
      });
    }
    
    // Step 5: College requirement check (for non-admins)
    if (user.role !== 'admin' && !user.college) {
      return NextResponse.json({
        step: 'college_requirement',
        status: 'FAIL',
        reason: 'User needs college assignment',
        recommendation: 'Admin needs to assign user to a college'
      });
    }
    
    // All checks passed!
    return NextResponse.json({
      step: 'complete',
      status: 'SUCCESS',
      user: {
        id: user._id.toString(),
        gitlabUsername: user.gitlabUsername,
        role: user.role,
        college: user.college?.name,
        isActive: user.isActive,
        expectedDashboard: `/${expectedDashboard}/dashboard`
      },
      recommendation: `User should access /${expectedDashboard}/dashboard`
    });
    
  } catch (error) {
    console.error('🔍 AUTH FLOW DEBUG - Error:', error);
    return NextResponse.json({
      step: 'error',
      status: 'FAIL',
      reason: error.message,
      recommendation: 'Check server logs for detailed error'
    }, { status: 500 });
  }
}