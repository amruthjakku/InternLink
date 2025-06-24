import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../utils/database';
import User from '../../../../models/User';
import College from '../../../../models/College';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    await connectToDatabase();
    
    // Get all users and check their roles
    const users = await User.find({}).populate('college').sort({ createdAt: -1 });
    
    const report = {
      sessionInfo: session ? {
        gitlabUsername: session.user.gitlabUsername,
        sessionRole: session.user.role,
        hasCollege: !!session.user.college,
        needsRegistration: session.user.needsRegistration
      } : null,
      
      databaseUsers: users.map(user => {
        const sessionMatch = session && session.user.gitlabUsername === user.gitlabUsername;
        return {
          id: user._id.toString(),
          gitlabUsername: user.gitlabUsername,
          databaseRole: user.role,
          isActive: user.isActive,
          college: user.college?.name || 'None',
          lastLoginAt: user.lastLoginAt,
          updatedAt: user.updatedAt,
          createdAt: user.createdAt,
          
          // Check for mismatches
          isCurrentUser: sessionMatch,
          sessionRole: sessionMatch ? session.user.role : null,
          roleMismatch: sessionMatch ? (session.user.role !== user.role) : false
        };
      }),
      
      // Find potential issues
      issues: [],
      
      summary: {
        totalUsers: users.length,
        activeUsers: users.filter(u => u.isActive).length,
        pendingUsers: users.filter(u => u.role === 'pending').length,
        rolesDistribution: {}
      }
    };
    
    // Calculate role distribution
    users.forEach(user => {
      report.summary.rolesDistribution[user.role] = (report.summary.rolesDistribution[user.role] || 0) + 1;
    });
    
    // Find issues
    if (session) {
      const currentUser = users.find(u => u.gitlabUsername === session.user.gitlabUsername);
      if (currentUser) {
        if (currentUser.role !== session.user.role) {
          report.issues.push({
            type: 'ROLE_MISMATCH',
            description: `Current user ${session.user.gitlabUsername} has role '${session.user.role}' in session but '${currentUser.role}' in database`,
            severity: 'HIGH',
            fix: 'JWT token needs refresh'
          });
        }
        
        if (!currentUser.isActive) {
          report.issues.push({
            type: 'INACTIVE_USER',
            description: `Current user ${session.user.gitlabUsername} is marked as inactive in database`,
            severity: 'HIGH',
            fix: 'User account needs to be activated'
          });
        }
      } else {
        report.issues.push({
          type: 'USER_NOT_FOUND',
          description: `Current session user ${session.user.gitlabUsername} not found in database`,
          severity: 'CRITICAL',
          fix: 'User needs to be registered in database'
        });
      }
    }
    
    // Check for users with recent updates but potential stale sessions
    const recentlyUpdated = users.filter(user => {
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
      return user.updatedAt > hourAgo;
    });
    
    if (recentlyUpdated.length > 0) {
      report.issues.push({
        type: 'RECENT_UPDATES',
        description: `${recentlyUpdated.length} users were updated in the last hour - their sessions might be stale`,
        severity: 'MEDIUM',
        fix: 'These users might need to refresh their sessions',
        affectedUsers: recentlyUpdated.map(u => u.gitlabUsername)
      });
    }
    
    return NextResponse.json(report);
    
  } catch (error) {
    console.error('Role changes debug error:', error);
    return NextResponse.json({ 
      error: 'Debug check failed',
      details: error.message 
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { action, username } = await request.json();
    
    await connectToDatabase();
    
    if (action === 'force_refresh_token') {
      // This will help test if JWT refresh is working
      const user = await User.findByGitLabUsername(username, 'college');
      
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      
      // Update the user's updatedAt to trigger JWT refresh
      user.updatedAt = new Date();
      await user.save();
      
      return NextResponse.json({
        message: `Forced token refresh for ${username}`,
        user: {
          gitlabUsername: user.gitlabUsername,
          role: user.role,
          updatedAt: user.updatedAt
        }
      });
    }
    
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    
  } catch (error) {
    console.error('Role changes action error:', error);
    return NextResponse.json({ 
      error: 'Action failed',
      details: error.message 
    }, { status: 500 });
  }
}