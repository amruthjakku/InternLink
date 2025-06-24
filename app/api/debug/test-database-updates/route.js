import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectToDatabase } from '../../../../utils/database';
import User from '../../../../models/User';
import College from '../../../../models/College';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }
    
    const { action, username, newRole, isActive } = await request.json();
    
    await connectToDatabase();
    
    const testResults = [];
    
    if (action === 'test_role_update') {
      // Test 1: Find the user
      const userBefore = await User.findByGitLabUsername(username, 'college');
      if (!userBefore) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      
      testResults.push({
        step: 1,
        action: 'Find user before update',
        result: 'SUCCESS',
        data: {
          username: userBefore.gitlabUsername,
          currentRole: userBefore.role,
          currentActive: userBefore.isActive,
          currentCollege: userBefore.college?.name
        }
      });
      
      // Test 2: Update the user
      const updateData = {
        lastTokenRefresh: new Date(),
        updatedAt: new Date()
      };
      
      if (newRole) updateData.role = newRole;
      if (isActive !== undefined) updateData.isActive = isActive;
      
      console.log(`🧪 TEST: Updating user ${username} with:`, updateData);
      
      const updatedUser = await User.findByIdAndUpdate(
        userBefore._id,
        updateData,
        { new: true }
      ).populate('college');
      
      testResults.push({
        step: 2,
        action: 'Update user in database',
        result: 'SUCCESS',
        data: {
          username: updatedUser.gitlabUsername,
          newRole: updatedUser.role,
          newActive: updatedUser.isActive,
          newCollege: updatedUser.college?.name,
          lastTokenRefresh: updatedUser.lastTokenRefresh,
          updatedAt: updatedUser.updatedAt
        }
      });
      
      // Test 3: Verify the update by reading again
      const userAfter = await User.findByGitLabUsername(username, 'college');
      
      const roleChanged = userBefore.role !== userAfter.role;
      const activeChanged = userBefore.isActive !== userAfter.isActive;
      
      testResults.push({
        step: 3,
        action: 'Verify update by re-reading from database',
        result: 'SUCCESS',
        data: {
          username: userAfter.gitlabUsername,
          finalRole: userAfter.role,
          finalActive: userAfter.isActive,
          finalCollege: userAfter.college?.name,
          roleChanged,
          activeChanged,
          changesPersisted: roleChanged || activeChanged
        }
      });
      
      // Test 4: Check if JWT refresh would pick up the changes
      const mockToken = {
        gitlabUsername: username,
        role: userBefore.role,
        isActive: userBefore.isActive,
        lastRefresh: new Date(Date.now() - 10000).toISOString() // 10 seconds ago
      };
      
      const shouldRefresh = userAfter.lastTokenRefresh && 
        (!mockToken.lastRefresh || new Date(userAfter.lastTokenRefresh) > new Date(mockToken.lastRefresh));
      
      testResults.push({
        step: 4,
        action: 'Test JWT refresh logic',
        result: shouldRefresh ? 'SUCCESS' : 'WARNING',
        data: {
          userLastTokenRefresh: userAfter.lastTokenRefresh,
          mockTokenLastRefresh: mockToken.lastRefresh,
          shouldTriggerRefresh: shouldRefresh,
          jwtWouldUpdateRole: shouldRefresh && roleChanged,
          jwtWouldUpdateActive: shouldRefresh && activeChanged
        }
      });
      
      return NextResponse.json({
        message: 'Database update test completed',
        testResults,
        summary: {
          userFound: !!userBefore,
          updateSuccessful: !!updatedUser,
          changesPersisted: roleChanged || activeChanged,
          jwtRefreshReady: shouldRefresh
        },
        recommendations: [
          'User should refresh their browser or sign out/in to get new role',
          'Admin can use "Force Refresh Session" button in role debug page',
          'Changes are immediately effective for new logins'
        ]
      });
    }
    
    if (action === 'test_all_users_status') {
      const allUsers = await User.find({}).populate('college').sort({ gitlabUsername: 1 });
      
      const statusReport = allUsers.map(user => ({
        username: user.gitlabUsername,
        role: user.role,
        isActive: user.isActive,
        college: user.college?.name || 'None',
        lastTokenRefresh: user.lastTokenRefresh,
        updatedAt: user.updatedAt,
        needsRefresh: !!user.lastTokenRefresh,
        timeSinceUpdate: user.updatedAt ? Math.floor((Date.now() - user.updatedAt.getTime()) / 1000) : null
      }));
      
      return NextResponse.json({
        message: 'All users status check completed',
        totalUsers: allUsers.length,
        users: statusReport,
        summary: {
          activeUsers: statusReport.filter(u => u.isActive).length,
          inactiveUsers: statusReport.filter(u => !u.isActive).length,
          usersWithPendingRefresh: statusReport.filter(u => u.needsRefresh).length,
          recentlyUpdated: statusReport.filter(u => u.timeSinceUpdate && u.timeSinceUpdate < 3600).length
        }
      });
    }
    
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({ 
      error: 'Database test failed',
      details: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}